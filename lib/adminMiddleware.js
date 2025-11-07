// Admin-only middleware - verifies Firebase ID token AND checks for admin role
import admin from 'firebase-admin';

// Reuse the same admin initialization from authMiddleware
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

/**
 * Middleware for admin-only API routes
 * Verifies Firebase ID token AND checks if user has admin claim
 */
export function withAdminAuth(handler) {
  return async (req, res) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Unauthorized: Missing or invalid Authorization header',
          code: 'AUTH_MISSING_TOKEN'
        });
      }

      const idToken = authHeader.split('Bearer ')[1];

      if (!idToken) {
        return res.status(401).json({ 
          error: 'Unauthorized: No token provided',
          code: 'AUTH_NO_TOKEN'
        });
      }

      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Check for admin claim
      // You can set custom claims via: admin.auth().setCustomUserClaims(uid, { admin: true })
      if (!decodedToken.admin && !isAdminEmail(decodedToken.email)) {
        return res.status(403).json({
          error: 'Forbidden: Admin access required',
          code: 'ADMIN_ACCESS_DENIED'
        });
      }
      
      // Attach user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        admin: true,
        ...decodedToken,
      };

      // Call the original handler
      return handler(req, res);
      
    } catch (error) {
      console.error('Admin auth verification error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ 
          error: 'Unauthorized: Token expired',
          code: 'AUTH_TOKEN_EXPIRED'
        });
      }
      
      if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({ 
          error: 'Unauthorized: Token revoked',
          code: 'AUTH_TOKEN_REVOKED'
        });
      }
      
      if (error.code === 'auth/argument-error') {
        return res.status(401).json({ 
          error: 'Unauthorized: Invalid token format',
          code: 'AUTH_INVALID_TOKEN'
        });
      }

      return res.status(401).json({ 
        error: 'Unauthorized: Authentication failed',
        code: 'AUTH_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

/**
 * Check if email is in admin whitelist
 * Add your admin emails to environment variables
 */
function isAdminEmail(email) {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

export default withAdminAuth;
