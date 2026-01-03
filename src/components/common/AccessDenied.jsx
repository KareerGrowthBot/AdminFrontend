import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = ({ message = "You don't have permission to access this page." }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100 mt-10 mx-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Access Denied</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                {message} Please contact your administrator if you believe this is an error.
            </p>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );
};

export default AccessDenied;
