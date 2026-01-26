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
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchCreditsAndSubscription = async (force = false) => {
        // Skip fetching if not authenticated or no organizationId
        const organizationId = typeof localStorage !== 'undefined' ? localStorage.getItem('organizationId') : null;

        if (!organizationId) {
            setLoading(false);
            return;
        }

        // Always fetch credits and subscription from API to get latest status
        setLoading(true);
        try {
            console.log('SubscriptionProvider: Fetching credits and subscription from API...');
            
            // Fetch both credits and subscription in parallel
            const [creditsResponse, subscriptionResponse] = await Promise.all([
                dashboardService.getCredits().catch(err => {
                    console.error('Error fetching credits:', err);
                    return null;
                }),
                dashboardService.getSubscription().catch(err => {
                    console.error('Error fetching subscription:', err);
                    return null;
                })
            ]);

            console.log('SubscriptionProvider: Credits data received:', creditsResponse);
            console.log('SubscriptionProvider: Subscription data received:', subscriptionResponse);
            
            setCreditsData(creditsResponse);
            setSubscriptionData(subscriptionResponse);

            // Check if admin has isSubscription set to true
            let isSubscribed = false;
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                const adminStr = localStorage.getItem('adminInfo');
                if (adminStr) {
                    try {
                        const admin = JSON.parse(adminStr);
                        isSubscribed = admin.isSubscription === true;
                    } catch (e) { }
                }
            }

            // Determine if subscription is active based on subscription data, credits, validity, and manual subscription flag
            const hasActiveSubscription = subscriptionResponse && 
                (subscriptionResponse.subscriptionStatus === 'ACTIVE' || subscriptionResponse.isSubscription === true);
            const hasCredits = creditsResponse && (creditsResponse.totalInterviewCredits > 0 || creditsResponse.totalPositionCredits > 0);
            const isActive = isSubscribed || hasActiveSubscription || hasCredits;

            setIsSubscriptionActive(isActive);

            // Update localStorage for persistence across reloads
            localStorage.setItem('isSubscription', isActive.toString());
        } catch (error) {
            console.error('Error fetching credits/subscription in SubscriptionProvider:', error);
            // Fallback to true to avoid locking out users on API failure during dev
            setIsSubscriptionActive(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchCreditsAndSubscription();
        } else {
            // If not authenticated, stop loading but don't fetch
            setLoading(false);
        }
    }, [isAuthenticated]);

    return (
        <SubscriptionContext.Provider value={{ 
            isSubscriptionActive, 
            creditsData, 
            subscriptionData,
            loading, 
            refreshCredits: fetchCreditsAndSubscription 
        }}>
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
