# Firestore Setup Guide

This guide will help you set up Firestore for the AI Platform.

## Step 1: Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left sidebar
4. Click **Create Database**
5. Choose **Start in production mode** (we'll add custom rules next)
6. Select your preferred location
7. Click **Enable**

## Step 2: Create Composite Indexes

The app uses queries that require composite indexes. Firebase will automatically prompt you to create these when you first run the app, but you can create them manually:

### For Chat Messages:
1. Go to **Firestore Database** → **Indexes** tab
2. Click **Create Index**
3. Configure:
   - Collection ID: `chats`
   - Fields to index:
     - `userId` (Ascending)
     - `timestamp` (Ascending)
   - Query scope: **Collection**
4. Click **Create**

### For Images:
1. Click **Create Index** again
2. Configure:
   - Collection ID: `images`
   - Fields to index:
     - `userId` (Ascending)
     - `timestamp` (Descending)
   - Query scope: **Collection**
3. Click **Create**

## Step 3: Set Up Security Rules

Replace the default Firestore security rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection - users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Chats collection - users can only access their own chat messages
    match /chats/{chatId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Images collection - users can only access their own generated images
    match /images/{imageId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
  }
}
```

### How to Apply Security Rules:

1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with the rules above
3. Click **Publish**

## Step 4: Verify Setup

After deploying your app, you can verify the setup:

1. Sign in to your app
2. Send a chat message - check if it appears in Firestore under `chats` collection
3. Generate an image - check if it appears in Firestore under `images` collection

## Collections Structure

### `users` Collection
```javascript
{
  userId: string (document ID),
  email: string,
  createdAt: timestamp
}
```

### `chats` Collection
```javascript
{
  chatId: string (auto-generated document ID),
  userId: string,
  role: "user" | "assistant",
  content: string,
  timestamp: ISO string
}
```

### `images` Collection
```javascript
{
  imageId: string (auto-generated document ID),
  userId: string,
  imageUrl: string,
  prompt: string,
  timestamp: ISO string
}
```

## Important Notes

1. **Indexes**: If you see an error about missing indexes when testing, Firebase will provide a direct link to create the required index. Click the link and wait for the index to build (usually takes a few minutes).

2. **Security**: The security rules ensure that users can only access their own data. Never disable these rules in production.

3. **Costs**: Firestore has a free tier:
   - 50K document reads/day
   - 20K document writes/day
   - 20K document deletes/day
   - 1 GB storage
   
   Monitor your usage to avoid unexpected charges.

4. **Data Persistence**: All chat messages and generated images are now automatically saved to Firestore and will persist across sessions.

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Make sure you're logged in
- Check that security rules are properly configured
- Verify the user is authenticated

### Error: "The query requires an index"
- Click the link in the error message
- Wait for the index to build (check the Indexes tab)
- Refresh your app after the index is complete

### Chat/Images not loading
- Check browser console for errors
- Verify Firestore is enabled
- Check that indexes are created and active
- Ensure security rules allow read access

