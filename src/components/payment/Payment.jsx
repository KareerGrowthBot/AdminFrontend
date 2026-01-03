import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, IndianRupee, ShieldCheck, FileText, Send } from 'lucide-react';
import { useSubscription } from '../../providers/SubscriptionProvider';
import { API_BASE_URL } from '../../constants/api';
import axios from 'axios';

const Payment = () => {
    const { creditsData, refreshCredits } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', 'pending-manual', null
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualForm, setManualForm] = useState({
        requestedCredits: 50,
        requestedPositions: 5,
        paymentMethod: 'Bank Transfer',
        transactionId: '',
        amount: 5000
    });

    const plans = [
        {
            id: 'basic',
            name: 'Starter Pack',
            credits: 50,
            positions: 5,
            price: 5000,
            features: ['50 Interview Credits', '5 Position Credits', 'Email Support']
        },
        {
            id: 'pro',
            name: 'Growth Pack',
            credits: 200,
            positions: 20,
            price: 15000,
            features: ['200 Interview Credits', '20 Position Credits', 'Priority Support', 'Custom Reports'],
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Scalable Pack',
            credits: 1000,
            positions: 100,
            price: 50000,
            features: ['1000 Interview Credits', 'Unlimited Position Credits', '24/7 Dedicated Support', 'Custom Integration']
        }
    ];

    const handlePayment = async (plan) => {
        setLoading(true);
        setPaymentStatus(null);

        try {
            console.log(`Processing payment for ${plan.name} at ₹${plan.price}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setPaymentStatus('success');
            refreshCredits();
        } catch (error) {
            console.error('Payment failed:', error);
            setPaymentStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/payments/manual/request`, manualForm, {
                withCredentials: true
            });
            setPaymentStatus('pending-manual');
            setShowManualForm(false);
        } catch (error) {
            console.error('Manual payment request failed:', error);
            alert('Failed to submit manual payment request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openManualForm = (plan) => {
        setManualForm({
            requestedCredits: plan.credits,
            requestedPositions: plan.positions,
            paymentMethod: 'Bank Transfer',
            transactionId: '',
            amount: plan.price
        });
        setShowManualForm(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto p-4 md:p-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
                <h1 className="text-3xl font-extrabold text-slate-900">Top Up Your Credits</h1>
                <p className="text-slate-500 text-lg">
                    Choose a plan that fits your recruitment needs. Get instant access to more interviews and positions.
                </p>
            </div>

            {paymentStatus === 'success' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 flex items-start gap-4 mb-8">
                    <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-green-800">Payment Successful!</h3>
                        <p className="text-green-700">Your credits have been added to your organization. You can now resume your recruitment process.</p>
                    </div>
                </div>
            )}

            {paymentStatus === 'pending-manual' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 flex items-start gap-4 mb-8">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-blue-800">Manual Request Submitted</h3>
                        <p className="text-blue-700">Your request is being reviewed by our team. Credits will be added once verified.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative bg-white rounded-3xl p-8 border-2 transition-all hover:shadow-2xl hover:-translate-y-1 ${plan.popular ? 'border-blue-500 shadow-xl' : 'border-slate-100 shadow-sm'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                MOST POPULAR
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <IndianRupee className="w-6 h-6 text-slate-900" />
                                    <span className="text-4xl font-black text-slate-900">{plan.price.toLocaleString()}</span>
                                    <span className="text-slate-500 font-medium">/ pack</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                                        <span className="text-slate-600 font-medium text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handlePayment(plan)}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-900 text-white hover:bg-slate-800'} disabled:opacity-50`}
                                >
                                    <CreditCard className="w-5 h-5" /> Online Payment
                                </button>

                                <button
                                    onClick={() => openManualForm(plan)}
                                    disabled={loading}
                                    className="w-full py-4 rounded-2xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-5 h-5" /> Manual Request
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showManualForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Manual Payment</h2>
                            <button onClick={() => setShowManualForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                        </div>

                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Credits</label>
                                    <input type="number" value={manualForm.requestedCredits} disabled className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                                    <input type="number" value={manualForm.amount} disabled className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Payment Method</label>
                                <select
                                    className="w-full border-slate-200 rounded-xl px-4 py-2"
                                    value={manualForm.paymentMethod}
                                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                                >
                                    <option>Bank Transfer</option>
                                    <option>UPI</option>
                                    <option>Check</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Transaction ID</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-slate-200 rounded-xl px-4 py-2"
                                    value={manualForm.transactionId}
                                    onChange={(e) => setManualForm({ ...manualForm, transactionId: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                                <Send className="w-4 h-4" /> Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;
