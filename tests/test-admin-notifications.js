// Simple test script to verify admin notification management functionality
const apiClient = require('./src/services/ApiClient');


async function testAdminNotificationFeatures() {
    const BASE_API_URL = 'http://localhost:3000';

    console.log('Testing Admin Notification Management Features...\n');
    
    try {
        // Test 1: Login as admin (you'll need to replace with actual admin credentials)
        console.log('1. Testing admin login...');
        const loginResponse = await fetch(`${BASE_API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@fadaa.dz', // Replace with actual admin email
                password: 'your-admin-password' // Replace with actual admin password
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error('Admin login failed');
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✓ Admin login successful\n');
        
        // Test 2: Fetch all notifications as admin (should see all notifications with user info)
        console.log('2. Testing admin notification fetch...');
        const notificationsResponse = await fetch(`${BASE_API_URL}/api/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (!notificationsResponse.ok) {
            throw new Error('Failed to fetch notifications');
        }
        
        const notificationsData = await notificationsResponse.json();
        console.log('✓ Admin can fetch all notifications');
        console.log(`  Found ${notificationsData.notifications.length} notifications`);
        
        // Check if user information is included
        const hasUserInfo = notificationsData.notifications.some(n => n.user);
        if (hasUserInfo) {
            console.log('✓ User information is included in notifications');
        } else {
            console.log('⚠ User information not found in notifications');
        }
        console.log('');
        
        // Test 3: Create notification with user assignment
        console.log('3. Testing notification creation with user assignment...');
        const createResponse = await fetch(`${BASE_API_URL}/api/notifications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'SystemAlert',
                message: 'Test notification created by admin for specific user',
                user_id: 1 // Replace with actual user ID
            })
        });
        
        if (!createResponse.ok) {
            throw new Error('Failed to create notification');
        }
        
        console.log('✓ Admin can create notifications with user assignment\n');
        
        // Test 4: Update notification user assignment
        console.log('4. Testing notification user assignment update...');
        // First, get a notification ID to update
        const latestNotifications = await fetch(`${BASE_API_URL}/api/notifications?limit=1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        const latestData = await latestNotifications.json();
        if (latestData.notifications.length > 0) {
            const notificationId = latestData.notifications[0].id;
            
            const updateResponse = await fetch(`${BASE_API_URL}/api/notifications/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Updated notification message',
                    type: 'SystemAlert',
                    user_id: 2 // Change to different user
                })
            });
            
            if (!updateResponse.ok) {
                throw new Error('Failed to update notification');
            }
            
            console.log('✓ Admin can update notification user assignments\n');
        }
        
        console.log('🎉 All admin notification management tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nNote: Make sure to:');
        console.log('1. Update admin credentials in the test');
        console.log('2. Ensure the backend is running on port 3000');
        console.log('3. Have valid user IDs in the database');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testAdminNotificationFeatures();
}

module.exports = { testAdminNotificationFeatures };
