import React from 'react';
import { hasPermission } from '../../utils/permissions';
import { useSubscription } from '../../providers/SubscriptionProvider';

/**
 * PermissionWrapper Component
 * 
 * Conditionally renders children based on whether the user has the required permission scope
 * for a specific feature, and also checks if the subscription is active for write operations.
 */
const PermissionWrapper = ({
    feature,
    scope,
    children,
    fallback = null
}) => {
    const { isSubscriptionActive } = useSubscription();
    const isAllowed = hasPermission(feature, scope);

    // If trying to CREATE, UPDATE, or DELETE, check if subscription is active
    if (['CREATE', 'UPDATE', 'DELETE'].includes(scope) && !isSubscriptionActive) {
        return fallback;
    }

    if (!isAllowed) {
        return fallback;
    }

    return <>{children}</>;
};

export default PermissionWrapper;
