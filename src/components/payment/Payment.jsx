import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertCircle, IndianRupee, Calculator, Calendar } from 'lucide-react';
import { useSubscription } from '../../providers/SubscriptionProvider';
import { API_BASE_URL } from '../../constants/api';
import apiClient from '../../services/apiService';

// Load RazorPay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-script");
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      setTimeout(() => {
        if (window.Razorpay) resolve(true);
        else resolve(false);
      }, 3000);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment = () => {
    const { creditsData, refreshCredits } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', null
    const [adminPlan, setAdminPlan] = useState(null);
    const [formData, setFormData] = useState({
        interviewCredits: 10,
        positionCredits: 5,
        billingCycle: '1' // 1, 2, or 3 months
    });
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [error, setError] = useState('');

    // Fetch admin plan on component mount
    useEffect(() => {
        fetchAdminPlan();
    }, []);

    // Calculate price when form data changes
    useEffect(() => {
        if (adminPlan) {
            const interview = Number(formData.interviewCredits) || 0;
            const position = Number(formData.positionCredits) || 0;
            const interviewCost = interview * parseFloat(adminPlan.interviewCreditCost);
            const positionCost = position * parseFloat(adminPlan.positionCreditCost);
            setCalculatedPrice(interviewCost + positionCost);
        }
    }, [formData, adminPlan]);

    const fetchAdminPlan = async () => {
        try {
            const response = await apiClient.get('/api/admin-plans');
            if (response.data && response.data.length > 0) {
                const plan = response.data[0]; // Get first plan
                setAdminPlan(plan);
                // Set minimum credits as default
                setFormData({
                    interviewCredits: plan.minInterviewCredits,
                    positionCredits: plan.minPositionCredits,
                    billingCycle: '1'
                });
            }
        } catch (error) {
            console.error('Error fetching admin plan:', error);
            setError('Failed to load payment plans. Please refresh the page.');
        }
    };

    const handleInputChange = (field, value) => {
        const numValue = value === '' ? '' : (parseInt(value, 10) || 0);
        setError('');
        setFormData(prev => ({
            ...prev,
            [field]: numValue
        }));
    };

    const calculateExpiryDate = (billingCycle) => {
        const today = new Date();
        const days = parseInt(billingCycle) * 28; // 1 month = 28 days, 2 months = 56 days, 3 months = 84 days
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + days);
        return expiryDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    const handlePayment = async () => {
        setError('');
        setPaymentStatus(null);

        if (!adminPlan) {
            setError('Payment plan not loaded. Please refresh the page.');
            return;
        }

        const interviewCredits = Number(formData.interviewCredits) || 0;
        const positionCredits = Number(formData.positionCredits) || 0;

        if (interviewCredits < adminPlan.minInterviewCredits) {
            setError(`Minimum interview credits required: ${adminPlan.minInterviewCredits}.`);
            return;
        }

        if (positionCredits < adminPlan.minPositionCredits) {
            setError(`Minimum position credits required: ${adminPlan.minPositionCredits}.`);
            return;
        }

        if (calculatedPrice <= 0) {
            setError('Invalid price. Please enter valid credit amounts.');
            return;
        }

        setLoading(true);

        try {
            // Load RazorPay SDK
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded || !window.Razorpay) {
                setError('Razorpay SDK not loaded. Please check your internet connection and refresh the page.');
                setLoading(false);
                return;
            }

            // Get organization ID
            const organizationId = localStorage.getItem('organizationId');
            if (!organizationId) {
                setError('Organization ID not found. Please login again.');
                setLoading(false);
                return;
            }

            // Calculate expiry date
            const expiryDate = calculateExpiryDate(formData.billingCycle);

            // Create payment order
            const orderResponse = await apiClient.post('/api/payments/create-order', {
                organizationId,
                interviewCredits: formData.interviewCredits,
                positionCredits: formData.positionCredits,
                billingCycle: formData.billingCycle,
                expiryDate,
                amount: calculatedPrice
            });

            const { orderId, key, amount } = orderResponse.data;

            // Create RazorPay options
            const options = {
                key,
                amount: Math.round(amount * 100), // Convert to paise
                currency: "INR",
                name: "KareerGrowth",
                description: `Credits: ${formData.interviewCredits} Interview + ${formData.positionCredits} Position`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        // Verify payment
                        await apiClient.post('/api/payments/verify-payment', {
                            orderId: orderId,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            organizationId,
                            interviewCredits: formData.interviewCredits,
                            positionCredits: formData.positionCredits,
                            billingCycle: formData.billingCycle,
                            expiryDate
                        });

                        await refreshCredits();
                        setPaymentStatus('success');
                    } catch (verifyError) {
                        console.error('Payment verification error:', verifyError);
                        setError('Payment verification failed. Please contact support.');
                        setPaymentStatus('error');
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", function (response) {
                setError(`Payment failed: ${response.error.description || 'Unknown error'}`);
                setPaymentStatus('error');
                setLoading(false);
            });

            rzp.open();
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.message || 'Payment failed to start. Please try again.');
            setPaymentStatus('error');
            setLoading(false);
        }
    };

    if (!adminPlan) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading payment plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div>
                    <h1 className="text-lg font-bold text-navy-900">Add Credits</h1>
                    <p className="text-xs text-gray-600 mt-0.5">Purchase interview and position credits for your organization</p>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-6">

                {paymentStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-xs font-semibold text-green-800 mb-0.5">Payment Successful!</h3>
                            <p className="text-xs text-green-700">Your credits have been added to your organization. You can now resume your recruitment process.</p>
                        </div>
                    </div>
                )}

                {paymentStatus === 'error' && error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-xs font-semibold text-red-800 mb-0.5">Payment Failed</h3>
                            <p className="text-xs text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side - Form */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                            {/* Interview Credits */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Interview Credits <span className="text-red-500">*</span>
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                        (Minimum: {adminPlan.minInterviewCredits})
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.interviewCredits}
                                        onChange={(e) => handleInputChange('interviewCredits', e.target.value)}
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                    />
                                    <div className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-600 whitespace-nowrap">
                                        Cost: ₹{parseFloat(adminPlan.interviewCreditCost).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Position Credits */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Position Credits <span className="text-red-500">*</span>
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                        (Minimum: {adminPlan.minPositionCredits})
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.positionCredits}
                                        onChange={(e) => handleInputChange('positionCredits', e.target.value)}
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition"
                                    />
                                    <div className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-600 whitespace-nowrap">
                                        Cost: ₹{parseFloat(adminPlan.positionCreditCost).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Billing Cycle */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Billing Cycle <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition appearance-none bg-white"
                                    required
                                >
                                    <option value="1">1 Month (28 days)</option>
                                    <option value="2">2 Months (56 days)</option>
                                    <option value="3">3 Months (84 days)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Credits will expire on: {calculateExpiryDate(formData.billingCycle)}
                                </p>
                            </div>

                            {/* Red alert below form - validation errors on Pay click */}
                            {error && paymentStatus !== 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-red-700 text-xs">{error}</p>
                                </div>
                            )}

                            {/* Payment Button */}
                            <button
                                type="submit"
                                disabled={loading || calculatedPrice <= 0}
                                className="w-full py-2 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-3 h-3" />
                                        Proceed to Payment
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right Side - Price Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Price Summary</h3>
                            <div className="space-y-3">
                                {/* Interview Credits Calculation */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-600">Interview Credits</span>
                                        <span className="text-xs font-medium text-gray-900">{Number(formData.interviewCredits) || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>₹{parseFloat(adminPlan.interviewCreditCost).toFixed(2)} × {Number(formData.interviewCredits) || 0}</span>
                                        <span className="font-medium text-gray-700">₹{((Number(formData.interviewCredits) || 0) * parseFloat(adminPlan.interviewCreditCost)).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Position Credits Calculation */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-600">Position Credits</span>
                                        <span className="text-xs font-medium text-gray-900">{Number(formData.positionCredits) || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>₹{parseFloat(adminPlan.positionCreditCost).toFixed(2)} × {Number(formData.positionCredits) || 0}</span>
                                        <span className="font-medium text-gray-700">₹{((Number(formData.positionCredits) || 0) * parseFloat(adminPlan.positionCreditCost)).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Billing Cycle Info */}
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-600">Billing Cycle</span>
                                        <span className="text-xs font-medium text-gray-900">{formData.billingCycle} Month{formData.billingCycle !== '1' ? 's' : ''}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Expires: {calculateExpiryDate(formData.billingCycle)}
                                    </p>
                                </div>

                                {/* Total Amount */}
                                <div className="pt-3 border-t-2 border-gray-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                                        <div className="flex items-baseline gap-1">
                                            <IndianRupee className="w-4 h-4 text-gray-900" />
                                            <span className="text-lg font-bold text-gray-900">{calculatedPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
