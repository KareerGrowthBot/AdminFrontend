import React from 'react';
import { AlertOctagon, CreditCard, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionExpired = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100 mt-10 mx-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <AlertOctagon className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Subscription Expired or No Credits</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Your organization's test credits have been depleted or your subscription has expired.
                Please top up your credits to continue managing positions and candidates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => navigate('/dashboard/payment')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                >
                    <CreditCard className="w-4 h-4" /> Top Up Credits
                </button>
                <button
                    onClick={() => window.open('https://kareergrowth.com/pricing', '_blank')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                    View Plans <ExternalLink className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SubscriptionExpired;
