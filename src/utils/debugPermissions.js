/**
 * Debug utility to check permissions in localStorage
 * Can be called from browser console: window.debugPermissions()
 */

export const debugPermissions = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.error('localStorage not available');
    return;
  }

  console.log('========================================');
  console.log('PERMISSION DEBUG INFO');
  console.log('========================================');
  console.log('');
  
  // Role Info
  console.log('ROLE INFORMATION:');
  console.log('  roleName:', localStorage.getItem('roleName'));
  console.log('  roleCode:', localStorage.getItem('roleCode'));
  console.log('  roleId:', localStorage.getItem('roleId'));
  console.log('  isSystemRole:', localStorage.getItem('isSystemRole'));
  console.log('  organizationId:', localStorage.getItem('organizationId'));
  console.log('');
  
  // Features Permissions
  const featuresPerms = localStorage.getItem('FeaturesPermissions');
  if (featuresPerms) {
    try {
      const perms = JSON.parse(featuresPerms);
      console.log('FEATURES PERMISSIONS:');
      console.log('  Total features:', perms.length);
      perms.forEach(perm => {
        console.log(`  ${perm.featureName}:`, perm.permissionScopes);
      });
    } catch (e) {
      console.error('Error parsing FeaturesPermissions:', e);
      console.log('  Raw:', featuresPerms);
    }
  } else {
    console.log('FEATURES PERMISSIONS: null or empty');
  }
  console.log('');
  
  // Individual Feature Permissions
  console.log('INDIVIDUAL FEATURE PERMISSIONS:');
  const permissionKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.endsWith('Permissions') && key !== 'FeaturesPermissions') {
      permissionKeys.push(key);
    }
  }
  if (permissionKeys.length > 0) {
    permissionKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        console.log(`  ${key}:`, parsed);
      } catch (e) {
        console.log(`  ${key}:`, value);
      }
    });
  } else {
    console.log('  No individual feature permissions found');
  }
  console.log('');
  
  // Test Permission Checks
  console.log('PERMISSION CHECK TESTS:');
  const { hasPermission } = require('./permissions');
  const testFeatures = ['USER', 'CANDIDATE', 'POSITION', 'ROLE', 'QUESTION', 'DASHBOARD'];
  const testActions = ['READ', 'CREATE', 'UPDATE', 'DELETE'];
  
  testFeatures.forEach(feature => {
    console.log(`  ${feature}:`);
    testActions.forEach(action => {
      const hasPerm = hasPermission(feature, action);
      console.log(`    ${action}:`, hasPerm ? '✓' : '✗');
    });
  });
  console.log('');
  
  console.log('========================================');
  console.log('END DEBUG INFO');
  console.log('========================================');
};

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  window.debugPermissions = debugPermissions;
}


