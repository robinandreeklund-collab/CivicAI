# Firebase Admin Access - Quick Reference

## How Admin Access Works Now

The admin dashboard now integrates with the existing Firebase authentication system. Admin access is controlled by the `role` field in your Firebase user document.

## Quick Steps to Grant Admin Access

### 1. Create or Login to Your Account
- Go to `http://localhost:3000/skapa-konto` to create a new account
- Or `http://localhost:3000/logga-in` if you already have one

### 2. Find Your User ID
Open browser console (F12) and run:
```javascript
const user = JSON.parse(localStorage.getItem('oneseek_user'));
console.log('Your User ID:', user.userId);
```

### 3. Update Role in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Firestore Database" in the sidebar
4. Navigate to the `users` collection
5. Find your user document (e.g., `user_e2ff8ff8581a81ed8eb03b5bb84f1d07`)
6. Edit the document
7. Change the `role` field from `"user"` to `"admin"`
8. Save the changes

### 4. Refresh Your Session
- Log out from the application
- Log in again
- The new role will be loaded from Firebase

### 5. Access Admin Dashboard
- Navigate to `http://localhost:3000/admin`
- You now have full access to the admin dashboard!

## Firebase Document Structure

```javascript
{
  "userId": "user_e2ff8ff8581a81ed8eb03b5bb84f1d07",
  "role": "admin",  // ← Change this from "user" to "admin"
  "accountType": "anonymous",
  "accountStatus": "active",
  "publicKey": "pk_...",
  "publicKeyHash": "e2ff8ff8...",
  "profileType": "pseudonym",
  "agentConfig": {
    "biasFilter": "neutral",
    "tone": "balanced",
    "transparencyLevel": "high"
  },
  "preferences": {
    "language": "sv",
    "notifications": false,
    "theme": "dark"
  },
  "usage": {
    "totalQuestions": 0,
    "totalSessions": 0
  },
  "createdAt": "2025-11-20T00:57:24.000Z",
  // ... other fields
}
```

## Alternative: Direct Database Update

If you have Firebase Admin SDK access or direct database access:

```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');
const db = admin.firestore();

await db.collection('users').doc('user_YOUR_USER_ID').update({
  role: 'admin'
});
```

Or using Firebase CLI:

```bash
# Update via Firebase CLI
firebase firestore:update users/user_YOUR_USER_ID --data '{"role":"admin"}'
```

## Flow Diagram

```
User Account (role: "user")
         ↓
Firebase Console: Change role → "admin"
         ↓
User logs out and logs in again
         ↓
Session refreshed with new role
         ↓
Access granted to /admin ✓
```

## Technical Details

### How It Works
1. When you log in, the backend fetches your user data from Firebase
2. This includes the `role` field
3. The frontend stores this in localStorage via `AuthContext`
4. The admin dashboard checks: `user?.role === 'admin'`
5. If true, you get access; if false, you see "Access Denied"

### Code Changes Made
- **AdminDashboardPage.jsx**: Uses `useAuth()` hook instead of direct localStorage
- **LoginPage.jsx**: Includes `role` field when storing user session
- **SignupPage.jsx**: Includes `role` field (defaults to "user")

### Benefits
✅ Integrates with existing Firebase authentication  
✅ No manual localStorage manipulation needed  
✅ Role persists across sessions  
✅ Easy to manage in Firebase Console  
✅ Backend can validate role against Firebase  
✅ Secure and maintainable  

## Troubleshooting

### "Access Denied" after changing role
- Make sure you logged out and logged in again
- Check that the role field is exactly `"admin"` (lowercase, in quotes)
- Verify the change was saved in Firebase Console

### Can't find my user document
- Check the userId in localStorage (see step 2 above)
- User documents are named `user_<hash>` where hash is the first 32 characters of your public key hash

### Role not updating
- Clear browser cache and localStorage
- Log in again with your seed phrase or public key
- The role will be re-fetched from Firebase

## Security Note

For production deployments, consider:
- Adding server-side role validation
- Implementing proper RBAC (Role-Based Access Control)
- Adding audit logging for admin actions
- Using Firebase Security Rules to restrict who can change roles

---

**Version:** Updated 2025-11-21  
**Commit:** 978cfb3
