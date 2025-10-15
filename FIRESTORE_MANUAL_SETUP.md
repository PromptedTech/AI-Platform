# Manual Firestore Setup - Step by Step

Follow these exact steps to set up Firestore for your AI Platform.

---

## Part 1: Enable Firestore Database

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project (or create a new one if you haven't)

### Step 2: Create Firestore Database
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"** button
3. **Start mode**: Select **"Start in production mode"** 
   - Don't worry, we'll add our custom rules next
4. **Location**: Choose the location closest to you
   - Example: `us-east1` for East Coast US
   - This cannot be changed later!
5. Click **"Enable"**
6. Wait 30-60 seconds for Firestore to initialize

---

## Part 2: Apply Security Rules

### Step 1: Copy Security Rules
1. Open the file `firestore.rules` in this project
2. Copy ALL the contents (Cmd+A, Cmd+C)

### Step 2: Apply in Firebase Console
1. In Firebase Console, go to **Firestore Database**
2. Click the **"Rules"** tab at the top
3. **Delete** all existing rules
4. **Paste** the contents from `firestore.rules`
5. Click **"Publish"** button
6. Wait for confirmation message

✅ **Security rules are now active!**

---

## Part 3: Create Composite Indexes

You have **TWO OPTIONS** - choose one:

---

### OPTION A: Automatic (Easier - Recommended)

1. **Skip this section for now**
2. Start your app (`npm run dev`)
3. Try to send a chat message
4. You'll see an error with a **blue link**
5. **Click the link** - it opens Firebase Console
6. Click **"Create Index"** button
7. Wait 2-3 minutes for the index to build
8. Repeat for images (generate an image)
9. Done! ✅

---

### OPTION B: Manual (If you want to set up now)

#### Index 1: Chat Messages

1. In Firebase Console, go to **Firestore Database**
2. Click the **"Indexes"** tab
3. Click **"Create Index"** button
4. Configure:
   - **Collection ID**: `chats`
   - Click **"Add field"**
   - **Field 1**: 
     - Field path: `userId`
     - Order: `Ascending`
   - Click **"Add field"** again
   - **Field 2**:
     - Field path: `timestamp`
     - Order: `Ascending`
   - **Query scope**: `Collection`
5. Click **"Create"**
6. Wait 2-5 minutes for "Building" to change to "Enabled"

#### Index 2: Images

1. Click **"Create Index"** button again
2. Configure:
   - **Collection ID**: `images`
   - Click **"Add field"**
   - **Field 1**: 
     - Field path: `userId`
     - Order: `Ascending`
   - Click **"Add field"** again
   - **Field 2**:
     - Field path: `timestamp`
     - Order: `Descending` ⚠️ (Note: DESCENDING, not ascending)
   - **Query scope**: `Collection`
3. Click **"Create"**
4. Wait 2-5 minutes for "Building" to change to "Enabled"

✅ **Both indexes are now ready!**

---

## Part 4: Verify Setup

### Check Security Rules
1. Go to **Firestore Database** → **Rules** tab
2. You should see the custom rules (not the default ones)
3. Status should show: "Active"

### Check Indexes
1. Go to **Firestore Database** → **Indexes** tab
2. You should see **2 composite indexes**:
   - `chats` collection: userId (Ascending), timestamp (Ascending)
   - `images` collection: userId (Ascending), timestamp (Descending)
3. Status should be: **"Enabled"** (not "Building")

---

## Part 5: Test Firestore

Now test that everything works:

### Test 1: Start Your App
```bash
npm run dev
```

### Test 2: Create Account
1. Go to http://localhost:3000
2. Sign up with email/password or Google
3. You should be redirected to dashboard

### Test 3: Check Users Collection
1. Open Firebase Console → Firestore Database → **Data** tab
2. You should see a `users` collection
3. Your user document should be there with your email

### Test 4: Test Chat
1. In your app, go to Chat tab
2. Send a message: "Hello, AI!"
3. Wait for GPT-4 response
4. Go to Firebase Console → Firestore → **Data** tab
5. You should see a `chats` collection with your messages

### Test 5: Test Images
1. In your app, go to Generate Images tab
2. Enter prompt: "A beautiful sunset over mountains"
3. Click "Generate Image"
4. Wait 10-30 seconds
5. Go to Firebase Console → Firestore → **Data** tab
6. You should see an `images` collection with your generated image

### Test 6: Test Real-time Sync
1. Open your app in two browser tabs
2. Send a chat message in Tab 1
3. The message should appear in Tab 2 instantly!

---

## Troubleshooting

### Error: "Missing or insufficient permissions"
**Solution**: 
- Check that security rules are published
- Make sure you're logged in
- Verify the rules in Firebase Console

### Error: "The query requires an index"
**Solution**: 
- Click the blue link in the error
- Or manually create the index (see Option B above)
- Wait for index to finish building

### Indexes stuck on "Building"
**Solution**: 
- Usually takes 2-5 minutes
- Refresh the page
- If stuck for >10 minutes, delete and recreate

### "Permission denied" when trying to read/write
**Solution**: 
- Verify security rules are correct
- Make sure `userId` field matches your auth user ID
- Check browser console for specific error

### Collections not appearing
**Solution**: 
- Collections only appear after first document is created
- Try sending a chat message or generating an image
- Refresh Firebase Console

---

## Quick Reference

### Firestore Collections Structure

```
📁 users/
  └── {userId}/
      ├── email: string
      └── createdAt: timestamp

📁 chats/
  └── {chatId}/
      ├── userId: string
      ├── role: "user" | "assistant"
      ├── content: string
      └── timestamp: ISO string

📁 images/
  └── {imageId}/
      ├── userId: string
      ├── imageUrl: string
      ├── prompt: string
      └── timestamp: ISO string
```

---

## ✅ Setup Complete Checklist

- [ ] Firestore Database enabled
- [ ] Security rules published
- [ ] Composite indexes created (or ready to create automatically)
- [ ] Tested user creation
- [ ] Tested chat persistence
- [ ] Tested image persistence
- [ ] Verified real-time sync works

---

## 🎉 You're Done!

Once all checkboxes above are checked, your Firestore is fully configured and ready to use!

**Next**: Start building features or deploy to production!

---

## Need Help?

If you encounter issues:
1. Check the error message in browser console (F12)
2. Verify your Firebase project is on Blaze (pay-as-you-go) plan if needed
3. Make sure you're using the correct Firebase project
4. Double-check that environment variables in `.env.local` match your Firebase config

---

**Remember**: Firestore has a generous free tier:
- 50,000 reads per day
- 20,000 writes per day
- 1 GB storage

Perfect for development and testing!

