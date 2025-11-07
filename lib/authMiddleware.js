// Firebase Admin SDK authentication middleware for API routes
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  try {
    // Check if we have a service account JSON file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      // Alternative: Use individual environment variables
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
 * Middleware to verify Firebase ID token from Authorization header
 * Attaches decoded user to req.user on success
 * 
 * @param {Function} handler - The API route handler function
 * @returns {Function} - Wrapped handler with auth verification
 */
export function withAuth(handler) {
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
      
      // Attach user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        ...decodedToken,
      };

      // Call the original handler
      return handler(req, res);
      
    } catch (error) {
      console.error('Auth verification error:', error);
      
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
 * Optional middleware for routes that work with or without auth
 * Attaches user if token is valid, but doesn't reject if missing
 */
export function withOptionalAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        
        if (idToken) {
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            ...decodedToken,
          };
        }
      }
      
      // Call handler regardless of auth status
      return handler(req, res);
      
    } catch (error) {
      console.error('Optional auth verification error:', error);
      // Continue without user info
      return handler(req, res);
    }
  };
}

export default withAuth;
