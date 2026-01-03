import React, { createContext, useContext, useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children, isAuthenticated }) => {
    const [isSubscriptionActive, setIsSubscriptionActive] = useState(() => {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('isSubscription');
            return stored === null ? true : stored === 'true';
        }
        return true;
    });
    const [creditsData, setCreditsData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchCredits = async (force = false) => {
        // Skip fetching if not authenticated or no organizationId
        const organizationId = typeof localStorage !== 'undefined' ? localStorage.getItem('organizationId') : null;

        if (!organizationId) {
            setLoading(false);
            return;
        }

        // If not forcing a refresh, and we already have a subscription status, we can skip the backend call
        if (!force && typeof localStorage !== 'undefined' && localStorage.getItem('isSubscription') !== null) {
            setLoading(false);
            return;
        }

        try {
            const data = await dashboardService.getCredits();
            setCreditsData(data);

            // Check if admin has isSubscription set to true
            let isSubscribed = false;
            // ... rest of logic remains same for isSubscribed check ...
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                const adminStr = localStorage.getItem('adminInfo');
                if (adminStr) {
                    try {
                        const admin = JSON.parse(adminStr);
                        isSubscribed = admin.isSubscription === true;
                    } catch (e) { }
                }
            }

            // Determine if subscription is active based on credits, validity, and manual subscription flag
            const hasCredits = data && (data.totalInterviewCredits > 0 || data.totalPositionCredits > 0);
            const isActive = isSubscribed || hasCredits;

            setIsSubscriptionActive(isActive);

            // Update localStorage for persistence across reloads
            localStorage.setItem('isSubscription', isActive.toString());
        } catch (error) {
            console.error('Error fetching credits in SubscriptionProvider:', error);
            // Fallback to true to avoid locking out users on API failure during dev
            setIsSubscriptionActive(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchCredits();
        } else {
            // If not authenticated, stop loading but don't fetch
            setLoading(false);
        }
    }, [isAuthenticated]);

    return (
        <SubscriptionContext.Provider value={{ isSubscriptionActive, creditsData, loading, refreshCredits: fetchCredits }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
