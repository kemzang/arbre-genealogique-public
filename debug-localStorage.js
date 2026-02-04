// Debug script to check localStorage data
// Run this in the browser console to debug authentication issues

console.log('=== DEBUGGING AUTHENTICATION ISSUE ===');

// Check all localStorage keys
console.log('All localStorage keys:', Object.keys(localStorage));

// Check token
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Present' : 'Missing');

// Check user data
const userStr = localStorage.getItem('user');
console.log('User string:', userStr);

if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('Parsed user object:', user);
        
        // Check user structure
        console.log('User ID:', user.id);
        console.log('User email:', user.email);
        console.log('User displayName:', user.displayName);
        console.log('User isSuperAdmin:', user.isSuperAdmin);
        console.log('User role:', user.role);
        
        // Test isSuperAdmin logic
        const hasIsSuperAdmin = user.isSuperAdmin === true;
        const hasRoleSuperAdmin = user.role === 'SUPER_ADMIN';
        const shouldBeAdmin = hasIsSuperAdmin || hasRoleSuperAdmin;
        
        console.log('Should be admin:', shouldBeAdmin);
        
        // Expected user structure
        const expectedUser = {
            "id": 2,
            "email": "admin@family.com",
            "displayName": "Super Admin", 
            "profilePictureUrl": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            "isSuperAdmin": true,
            "createdAt": "2026-02-04T10:21:53.098Z"
        };
        
        console.log('Expected user structure:', expectedUser);
        console.log('Current user matches expected:', JSON.stringify(user) === JSON.stringify(expectedUser));
        
    } catch (error) {
        console.error('Error parsing user data:', error);
    }
} else {
    console.log('No user data found in localStorage');
}

// Check for any obsolete keys
const obsoleteKeys = ['userRole', 'clientName'];
obsoleteKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
        console.log(`Found obsolete key "${key}":`, value);
    }
});

console.log('=== END DEBUG ===');