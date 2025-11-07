# 🔐 API Authentication Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NOVA AI PLATFORM                         │
│                    Secure API Authentication                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                    ┌──────────────────────┐
│                      │                    │                      │
│   CLIENT (Browser)   │◄──────────────────►│   FIREBASE AUTH      │
│   React/Next.js      │    Login/Signup    │   User Management    │
│                      │                    │                      │
└──────────┬───────────┘                    └──────────────────────┘
           │                                           │
           │ 1. User logs in                          │
           │    via Firebase Auth                     │
           │                                           │
           ▼                                           │
    ┌──────────────┐                                  │
    │ Auth Context │                                  │
    │ user.uid     │                                  │
    └──────┬───────┘                                  │
           │                                           │
           │ 2. Get ID Token                          │
           │    await user.getIdToken()               │
           │                                           │
           ▼                                           │
    ┌──────────────────────────────────┐              │
    │  lib/authClient.js               │              │
    │  ┌────────────────────────────┐  │              │
    │  │ authenticatedPost()        │  │              │
    │  │ authenticatedGet()         │  │              │
    │  │ authenticatedUpload()      │  │              │
    │  └────────────────────────────┘  │              │
    └──────────┬───────────────────────┘              │
               │                                       │
               │ 3. API Request                       │
               │    Authorization: Bearer <token>     │
               │                                       │
               ▼                                       │
┌──────────────────────────────────────────┐          │
│         NEXT.JS API ROUTES               │          │
│         /pages/api/*                     │          │
│  ┌────────────────────────────────────┐  │          │
│  │  Middleware Layer                  │  │          │
│  │  (lib/authMiddleware.js)           │  │          │
│  │                                    │  │          │
│  │  withAuth() / withAdminAuth()      │◄─┼──────────┘
│  │                                    │  │ 4. Verify Token
│  │  ┌──────────────────────────────┐ │  │    via Firebase Admin SDK
│  │  │ 4a. Extract Token            │ │  │
│  │  │     from Authorization header│ │  │
│  │  ├──────────────────────────────┤ │  │
│  │  │ 4b. Verify with              │ │  │
│  │  │     admin.auth().verifyToken │ │  │
│  │  ├──────────────────────────────┤ │  │
│  │  │ 4c. Attach req.user          │ │  │
│  │  │     { uid, email, ... }      │ │  │
│  │  └──────────────────────────────┘ │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │  Route Handler                     │  │
│  │  async handler(req, res)           │  │
│  │  {                                 │  │
│  │    const userId = req.user.uid;    │  │
│  │    // Secure logic here            │  │
│  │    return res.json({...});         │  │
│  │  }                                 │  │
│  └────────────────────────────────────┘  │
└───────────────────────┬───────────────────┘
                        │
                        │ 5. Response
                        │    { reply: "...", ... }
                        │
                        ▼
             ┌──────────────────┐
             │  CLIENT          │
             │  Display Result  │
             └──────────────────┘
```

---

## Detailed Request Flow

```
STEP 1: USER AUTHENTICATION
═══════════════════════════════════════════════════════
┌─────────────┐
│   Browser   │
│             │
│ ┌─────────┐ │     Firebase Auth
│ │ Login   │ │────────────────►  User Signs In
│ └─────────┘ │                   (Email/Google/etc)
│             │
│   User ID   │◄─────────────────  Session Created
│   Email     │                   ID Token Generated
│   Token     │
└─────────────┘


STEP 2: API CALL PREPARATION
═══════════════════════════════════════════════════════
┌─────────────────────────────────────────┐
│  Client Code (React Component)          │
│                                          │
│  const sendMessage = async () => {       │
│    const response = await              │
│      authenticatedPost('/api/chat', {   │
│        messages: [...]                  │
│      });                                │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  lib/authClient.js                      │
│                                          │
│  1. Get current user from auth.current  │
│  2. Call user.getIdToken()              │
│  3. Add to Authorization header         │
│  4. Make fetch request                  │
│                                          │
│  headers: {                             │
│    'Authorization': 'Bearer eyJhb...'   │
│    'Content-Type': 'application/json'   │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               │ HTTP POST /api/chat
               │ Authorization: Bearer eyJhb...
               │ Body: { messages: [...] }
               │
               ▼


STEP 3: SERVER-SIDE VERIFICATION
═══════════════════════════════════════════════════════
┌─────────────────────────────────────────┐
│  Next.js API Route                      │
│  /pages/api/chat.js                     │
│                                          │
│  export default withAuth(handler);      │◄── Middleware wraps handler
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│  lib/authMiddleware.js - withAuth()                │
│                                                      │
│  1. Extract token from req.headers.authorization    │
│     const token = authHeader.split('Bearer ')[1]    │
│                                                      │
│  2. Verify with Firebase Admin SDK                  │
│     const decoded = await admin.auth()              │
│                      .verifyIdToken(token)          │
│                                                      │
│  3. Attach user to request                          │
│     req.user = {                                    │
│       uid: decoded.uid,                             │
│       email: decoded.email,                         │
│       emailVerified: decoded.email_verified         │
│     }                                               │
│                                                      │
│  4. Call original handler(req, res)                 │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Route Handler Function                  │
│                                          │
│  async function handler(req, res) {      │
│    const userId = req.user.uid;  ✅     │
│    const email = req.user.email; ✅     │
│                                          │
│    // Secure logic using verified userId│
│    const result = await processChat(    │
│      userId,                            │
│      req.body.messages                  │
│    );                                   │
│                                          │
│    return res.json(result);             │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               │ Response: { reply: "..." }
               │
               ▼
┌─────────────────────────────────────────┐
│  Client receives response                │
│  Display AI reply to user                │
└─────────────────────────────────────────┘
```

---

## Error Handling Flow

```
TOKEN EXPIRED SCENARIO
═══════════════════════════════════════════════════════

Client                  API Route              Firebase Admin
  │                        │                         │
  │  Request (expired)     │                         │
  ├───────────────────────►│                         │
  │  Bearer: old_token     │                         │
  │                        │  verifyIdToken()        │
  │                        ├────────────────────────►│
  │                        │                         │
  │                        │  ❌ Token expired       │
  │                        │◄────────────────────────┤
  │                        │                         │
  │  401 Unauthorized      │                         │
  │◄───────────────────────┤                         │
  │  { code: 'AUTH_TOKEN_EXPIRED' }                  │
  │                        │                         │
  │  Auto-retry            │                         │
  │  getIdToken(true) ───► Firebase Auth             │
  │                        │                         │
  │  New token             │                         │
  │◄───────────────────────┤                         │
  │                        │                         │
  │  Retry with new token  │                         │
  ├───────────────────────►│                         │
  │  Bearer: fresh_token   │                         │
  │                        │  verifyIdToken()        │
  │                        ├────────────────────────►│
  │                        │                         │
  │                        │  ✅ Valid               │
  │                        │◄────────────────────────┤
  │                        │                         │
  │  200 OK                │                         │
  │◄───────────────────────┤                         │
  │  { reply: "..." }      │                         │
```

---

## Security Comparison

```
❌ BEFORE (INSECURE)
═══════════════════════════════════════════════════════
Client                               Server
  │                                    │
  │  POST /api/chat                    │
  │  {                                 │
  │    userId: "abc123",  ◄────────────┼── Anyone can change this!
  │    messages: [...]                 │
  │  }                                 │
  ├───────────────────────────────────►│
  │                                    │
  │                                    │  ❌ Trust client's userId
  │                                    │     No verification!
  │                                    │
  │  Response                          │
  │◄───────────────────────────────────┤
  │                                    │

Vulnerability: Attacker can impersonate any user by changing userId!


✅ AFTER (SECURE)
═══════════════════════════════════════════════════════
Client                               Server
  │                                    │
  │  POST /api/chat                    │
  │  Authorization: Bearer <token>     │
  │  {                                 │
  │    messages: [...]                 │
  │  }  (no userId in body!)          │
  ├───────────────────────────────────►│
  │                                    │
  │                                    │  ✅ Verify token with
  │                                    │     Firebase Admin SDK
  │                                    │
  │                                    │  Extract verified userId
  │                                    │  from decoded token
  │                                    │
  │  Response                          │
  │◄───────────────────────────────────┤
  │                                    │

Security: Server-side verification ensures userId is authentic!
```

---

## Admin Route Protection

```
ADMIN ROUTE FLOW
═══════════════════════════════════════════════════════

Request to /api/admin/add-credits
    │
    ▼
┌───────────────────────────┐
│ withAdminAuth()           │
│                           │
│ 1. Verify token ✅        │
│ 2. Check admin claim      │◄──── Firebase custom claims
│    OR email whitelist     │      OR ADMIN_EMAILS env var
│                           │
│ If admin: req.user.admin  │
│ If not: 403 Forbidden     │
└───────┬───────────────────┘
        │
        ▼ (if admin)
┌───────────────────────────┐
│ Handler executes          │
│ Add credits to any user   │
└───────────────────────────┘
```

---

## Token Lifecycle

```
TOKEN GENERATION & REFRESH
═══════════════════════════════════════════════════════

┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Firebase Auth              │
│  Generates ID Token         │
│  Validity: 1 hour           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Token stored in memory     │
│  (auth.currentUser)         │
└────────┬────────────────────┘
         │
         │ Time passes...
         │ Token about to expire
         │
         ▼
┌─────────────────────────────┐
│  Auto-refresh trigger       │
│  user.getIdToken(true)      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  New token generated        │
│  Valid for another hour     │
└─────────────────────────────┘
```

---

## File Upload Flow (Special Case)

```
MULTIPART FORM DATA WITH AUTH
═══════════════════════════════════════════════════════

Client
  │
  │  const formData = new FormData();
  │  formData.append('file', file);
  │  // ❌ NO: formData.append('uid', userId)  // Removed!
  │
  ▼
┌─────────────────────────────────────┐
│  authenticatedUpload()              │
│                                     │
│  1. Get ID token                    │
│  2. Create multipart request        │
│     Headers:                        │
│       Authorization: Bearer <token> │
│       Content-Type: multipart/...   │
│                                     │
│  3. Send FormData                   │
└──────────┬──────────────────────────┘
           │
           ▼
Server
┌─────────────────────────────────────┐
│  /api/upload (withAuth)             │
│                                     │
│  1. Middleware verifies token       │
│  2. Extract: const uid = req.user.uid│
│  3. Parse FormData with formidable  │
│  4. Store file under verified uid   │
│                                     │
│  Firestore: users/{uid}/files/...   │
└─────────────────────────────────────┘
```

This visual guide should help understand the complete authentication flow! 🎯
