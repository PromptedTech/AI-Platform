# Quick Start Guide: Sharing & Demo Features

## 🚀 For Users

### How to Share a Chat Conversation

1. **Have a conversation** with the AI in the dashboard
2. **Look for the share icon** (↗️) next to any AI response
3. **Click the share icon** → dropdown menu appears
4. **Click "Copy share link"** → link copied to clipboard!
5. **Paste and share** the link anywhere (social media, email, etc.)

**What recipients see:**
- Your question and the AI's response
- Clean, readable format
- No login required
- "Try AI Platform" button to encourage signups

### How to Share an Image

1. **Generate an image** in the Images tab
2. **Click the share icon** on any image
3. Choose an option:
   - **"Copy share link"**: Get a shareable URL
   - **"Download with watermark"**: Get image with "Made with AI Platform" text

**What recipients see:**
- Full-size image
- The prompt used to generate it
- Option to download
- "Try AI Platform" button

### How to Try the Demo (for visitors)

1. **Visit the homepage** (not logged in)
2. **Click "Try Demo"** button
3. **Ask one free question** to the AI
4. **Get an instant response** - no signup required!
5. **Sign up** for unlimited access

---

## 👨‍💻 For Developers

### Quick Implementation

#### Add Share Button to Any Content

```jsx
import ShareButton from '../components/ShareButton';

// For chat messages
<ShareButton
  type="chat"
  userId={user.uid}
  message="User's question"
  response="AI's response"
  model="gpt-4o-mini"
/>

// For images
<ShareButton
  type="image"
  userId={user.uid}
  prompt="Image generation prompt"
  imageUrl="https://example.com/image.png"
/>
```

#### Add Demo Mode to Landing Page

```jsx
import { useState } from 'react';
import DemoMode from '../components/DemoMode';

const [showDemo, setShowDemo] = useState(false);

<button onClick={() => setShowDemo(true)}>
  Try Demo
</button>

{showDemo && (
  <DemoMode onClose={() => setShowDemo(false)} />
)}
```

#### Create Share Links Programmatically

```javascript
import { shareChatMessage, shareImage } from '../lib/share';

// Share a chat
const chatUrl = await shareChatMessage(
  userId,
  "What is AI?",
  "AI is artificial intelligence...",
  "gpt-4o-mini"
);

// Share an image
const imageUrl = await shareImage(
  userId,
  "A sunset over mountains",
  "https://example.com/sunset.png"
);
```

### Firestore Setup

Already configured! The rules are:

```javascript
match /sharedContent/{shareId} {
  allow read: if true;              // Anyone can view
  allow create: if isAuthenticated(); // Only logged-in users can create
  allow update, delete: if false;    // Immutable
}
```

Deploy with:
```bash
firebase deploy --only firestore
```

---

## 🎨 Customization

### Change Watermark Text

Edit `/lib/share.js`:

```javascript
const watermarkText = 'Made with AI Platform'; // ← Change this
```

### Customize Share Button Style

Edit `/components/ShareButton.js`:

```javascript
className="p-2 rounded-lg hover:bg-gray-100..."
```

### Modify Demo Limits

Edit `/components/DemoMode.js`:

```javascript
const response = await fetch('/api/chat', {
  body: JSON.stringify({
    model: 'gpt-3.5-turbo', // ← Change model
    max_tokens: 500,        // ← Change token limit
    // ...
  })
});
```

---

## 📱 Mobile Tips

### Share on Mobile
1. Tap share icon
2. Copy link appears
3. Use native share sheet if needed

### Demo on Mobile
- Fullscreen experience
- Touch-optimized
- Easy to type questions

---

## 🔥 Pro Tips

### For Marketing
- Share impressive AI results on social media
- Use watermarked images for brand awareness
- Demo mode converts visitors to users

### For Users
- Share educational AI responses
- Download images with watermark for attribution
- Try demo before committing to signup

### For Developers
- Add Open Graph tags for better social previews
- Track shares for analytics
- Consider expiring links for sensitive content

---

## ❓ FAQ

**Q: Can shared content be deleted?**  
A: Not currently - it's immutable for security. Consider adding admin controls.

**Q: Is demo mode rate-limited?**  
A: One try per session. Add IP-based rate limiting for production.

**Q: Do shared links expire?**  
A: No, they're permanent. You can add TTL logic if needed.

**Q: Can I customize the watermark?**  
A: Yes! Edit the text in `/lib/share.js`.

**Q: Does demo mode cost credits?**  
A: No, it's free and doesn't deduct user credits.

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Verify Firestore rules are deployed
3. Test in incognito mode
4. Review `/SHARING_DEMO_FEATURES.md` for detailed docs

---

**Ready to go!** 🎉 Start sharing and demoing your AI platform.

