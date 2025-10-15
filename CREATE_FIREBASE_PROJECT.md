# Create Your Firebase Project - Quick Guide

## 🚀 Step-by-Step Instructions

### 1. Go to Firebase Console
**URL**: https://console.firebase.google.com/

### 2. Create New Project

Click: **"Add project"** or **"Create a project"**

### 3. Project Setup (3 screens)

#### Screen 1: Project Name
```
Enter your project name:
┌─────────────────────────┐
│ ai-platform             │  ← Your choice (e.g., "ai-platform", "my-ai-app")
└─────────────────────────┘

Your project ID will be: ai-platform-xxxxx (auto-generated)

[ Continue ]
```

#### Screen 2: Google Analytics
```
Enable Google Analytics for this project?

☑ Yes (recommended)
☐ No

[ Continue ]
```

#### Screen 3: Analytics Account
```
Select or create account:
● Create a new account
  Account name: ai-platform
  
☑ Accept terms

[ Create project ]
```

### 4. Wait
Project creation takes 30-60 seconds.

### 5. Done!
Click **"Continue"** when ready.

---

## 📋 What You Need to Remember

After creating the project, note down:

1. **Project ID**: (shown in project settings)
   - Example: `ai-platform-abc123`
   - You'll need this for `.firebaserc`

2. **Project Location**: 
   - Example: `us-central1`

---

## ✅ Next Steps After Creating Project

### Step 1: Get Your Project ID

1. In Firebase Console, click ⚙️ (Settings icon) → **Project settings**
2. Copy the **Project ID** (not the project name!)
   - Example: `ai-platform-abc123`

### Step 2: Update .firebaserc

Edit the file `.firebaserc` in your project:

**Before:**
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

**After:**
```json
{
  "projects": {
    "default": "ai-platform-abc123"  ← Your actual project ID
  }
}
```

### Step 3: Enable Required Services

In Firebase Console:

1. **Enable Authentication**
   - Click "Authentication" in sidebar
   - Click "Get started"
   - Enable "Email/Password"
   - Enable "Google"

2. **Enable Firestore**
   - Click "Firestore Database" in sidebar
   - Click "Create database"
   - Select "Start in production mode"
   - Choose location (e.g., us-central)
   - Click "Enable"

### Step 4: Get Firebase Config

1. In Project Settings
2. Scroll to "Your apps"
3. Click </> (Web app icon)
4. Register app with nickname: "ai-platform-web"
5. Copy the config values
6. Put them in your `.env.local` file

---

## 🔄 Then Try Firebase Deploy Again

Once you've:
- ✅ Created the project
- ✅ Updated `.firebaserc` with real project ID
- ✅ Enabled Authentication and Firestore

Run:
```bash
firebase deploy --only firestore
```

---

## 💡 Alternative: Create Project via CLI

If you prefer CLI:

```bash
# List available projects (in case you already have one)
firebase projects:list

# Or login again if needed
firebase login --reauth

# Then use the web console method above (easier for first time)
```

---

## 🆘 Troubleshooting

### "No projects found"
- You haven't created a Firebase project yet
- Use the web console to create one (easier)
- URL: https://console.firebase.google.com/

### Can't find Project ID
- Go to Firebase Console
- Click ⚙️ → Project settings
- Project ID is shown at the top

### Wrong Project ID format
- Should look like: `my-project-12345`
- NOT just: `my-project`
- The numbers are auto-generated

---

## ✅ Quick Checklist

- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add project"
- [ ] Enter project name
- [ ] Enable Analytics (optional)
- [ ] Wait for project creation
- [ ] Copy Project ID from settings
- [ ] Update `.firebaserc` with Project ID
- [ ] Enable Authentication
- [ ] Enable Firestore
- [ ] Copy config to `.env.local`
- [ ] Run `firebase deploy --only firestore`

---

**Ready?** Go to: https://console.firebase.google.com/

Create your project and come back to update `.firebaserc`!

