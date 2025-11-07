# 🚀 RAG Quick Start - 5 Minutes to Working System

## Step 1: Verify Setup (30 seconds)

```bash
# Check environment variables
cat .env.local | grep -E "OPENAI_API_KEY|FIREBASE"

# Should see:
# OPENAI_API_KEY=sk-...
# FIREBASE_ADMIN_PROJECT_ID=...
# etc.
```

## Step 2: Start Development Server (10 seconds)

```bash
npm run dev
```

Visit: http://localhost:3000

## Step 3: Test File Upload (2 minutes)

1. **Navigate to Knowledge Base**
   - Go to http://localhost:3000/knowledge
   - Or add link to your navigation

2. **Upload a Document**
   - Click "Manage Files" tab
   - Drag & drop a PDF/DOCX/TXT file
   - Wait for "Successfully uploaded" message
   - See file appear in list with chunk count

3. **Verify in Firestore** (optional)
   - Open Firebase Console
   - Go to Firestore Database
   - Check `users/{userId}/files`
   - Check `users/{userId}/embeddings`

## Step 4: Test Chat with Knowledge (2 minutes)

1. **Switch to Chat Tab**
   - Click "Chat" tab at top

2. **Configure Chat**
   - Select model: "GPT-4o Mini" (recommended)
   - Toggle "Knowledge: ON" (green)

3. **Ask Questions**
   ```
   Example: "What topics are covered in this document?"
   Example: "Summarize the main points"
   Example: "What does it say about [specific topic]?"
   ```

4. **Verify Sources**
   - See source badges below AI response
   - Click to expand and see chunks used
   - Hover to preview chunk text

## Step 5: Integration (30 seconds)

### Add to Navigation

```jsx
// In your layout/header component
<Link href="/knowledge">
  <a className="nav-link">Knowledge Base</a>
</Link>
```

### Use Components Elsewhere

```jsx
// In any page
import ChatComposer from '../components/ChatComposer';
import SourceBadge from '../components/SourceBadge';

<ChatComposer
  onSend={({ content, model, useKnowledge }) => {
    // Handle message
  }}
/>

<SourceBadge sources={message.sources} />
```

---

## ✅ That's It!

Your RAG system is now working. You can:

- ✅ Upload documents (PDF/DOCX/TXT)
- ✅ Chat with AI using your documents
- ✅ See which sources were used
- ✅ Choose from 5 different models
- ✅ Toggle knowledge on/off

---

## 🎯 Next Steps

### Make It Your Own

1. **Branding**: Update in `/config/brand.js`
2. **Styling**: Customize Tailwind classes
3. **Models**: Adjust in `ChatComposer.js`
4. **Chunking**: Tweak in `lib/chunkText.js`

### Add Features

1. **Dashboard Widget**: Show recent uploads
2. **Search**: Find specific files
3. **Tags**: Organize documents
4. **Share**: Share knowledge bases

### Deploy

```bash
# Build
npm run build

# Deploy to Vercel
vercel deploy --prod

# Configure env vars in Vercel dashboard
```

---

## 🐛 Troubleshooting

### Upload Fails
- Check file type (PDF/DOCX/TXT only)
- Check file size (<10MB)
- Check OpenAI API key valid

### No Sources Shown
- Verify "Knowledge: ON" is enabled
- Check files uploaded successfully
- Try broader questions

### Chat Errors
- Check browser console for errors
- Check server logs: `vercel logs`
- Verify Firebase auth working

---

## 📚 Documentation

- **Full Guide**: `RAG_IMPLEMENTATION.md`
- **Deployment**: `RAG_DEPLOYMENT.md`
- **Complete Summary**: `RAG_COMPLETE_SUMMARY.md`

---

## 💡 Pro Tips

1. **Better Answers**: Upload more specific documents
2. **Faster Response**: Use GPT-4o Mini
3. **Best Quality**: Use GPT-4o
4. **Save Money**: Turn off knowledge when not needed
5. **Organize**: Delete old files you don't need

---

**Happy Building! 🎉**
