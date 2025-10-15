# 🚀 Deployment Guide - AI Platform v1.0

## Pre-Deployment Checklist

### 1. Environment Variables ✅
Ensure all required environment variables are set in Vercel:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenAI API
OPENAI_API_KEY=sk-proj-...

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_... or rzp_live_...
RAZORPAY_KEY_SECRET=your_secret

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 2. Firebase Setup ✅
- [x] Create Firebase project
- [x] Enable Authentication (Email/Password, Google)
- [x] Create Firestore database
- [x] Deploy Firestore rules: `firebase deploy --only firestore`
- [x] Enable Analytics (optional)

### 3. Branding Assets 📦

Required files (create before deploying):

```
public/
  ├── favicon.ico (32x32)
  ├── favicon-16x16.png
  ├── favicon-32x32.png
  ├── apple-touch-icon.png (180x180)
  ├── android-chrome-192x192.png
  ├── android-chrome-512x512.png
  ├── og-image.png (1200x630 for OpenGraph)
  └── twitter-card.png (1200x600 for Twitter)
```

### 4. Legal Pages ✅
- [x] Privacy Policy (`/privacy`)
- [x] Terms of Service (`/terms`)
- [x] Update with your company information

## Vercel Deployment Steps

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy to Production

```bash
# Initial deployment
vercel

# Production deployment
vercel --prod
```

### Step 4: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Update DNS records as instructed

### Step 5: Set Environment Variables

1. Go to Vercel Dashboard > Settings > Environment Variables
2. Add all variables from `.env.local`
3. Select environments: Production, Preview, Development

### Step 6: Update Firestore Rules for Production

```bash
# Switch to production Firebase project
firebase use production

# Deploy rules
firebase deploy --only firestore
```

## Post-Deployment Tasks

### 1. Update Brand Configuration

Edit `config/brand.js`:
```javascript
url: 'https://your-actual-domain.com',
domain: 'your-actual-domain.com',
email: 'support@your-domain.com',
```

### 2. Update robots.txt

Edit `public/robots.txt`:
```
Sitemap: https://your-actual-domain.com/sitemap.xml
```

### 3. Setup OpenAI Billing

- Go to https://platform.openai.com/account/billing
- Add payment method
- Set usage limits
- Monitor API usage

### 4. Razorpay Production Mode

1. Go to Razorpay Dashboard
2. Complete KYC verification
3. Switch to Live mode
4. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with live keys
5. Configure webhooks (optional)

### 5. Analytics Setup (Optional)

- Google Analytics
- Firebase Analytics
- Vercel Analytics

### 6. Monitoring

- Setup error tracking (Sentry, Bugsnag)
- Monitor API usage
- Track user metrics

## Testing in Production

### 1. Signup Flow
- [ ] Email/password signup works
- [ ] Google signup works
- [ ] 50 free credits awarded
- [ ] Profile created in Firestore

### 2. Chat Feature
- [ ] Can send messages
- [ ] AI responds correctly
- [ ] Credits deducted properly
- [ ] Chat history saved
- [ ] Thread management works

### 3. Image Generation
- [ ] Can generate images
- [ ] Images display correctly
- [ ] Credits deducted (5 per image)
- [ ] Image history saved
- [ ] Library view works

### 4. Payment System
- [ ] Can purchase credits
- [ ] Razorpay checkout works
- [ ] Credits added after payment
- [ ] Transaction recorded

### 5. Sharing Features
- [ ] Can share chat conversations
- [ ] Can share images
- [ ] Public share links work
- [ ] Download with watermark works

### 6. Demo Mode
- [ ] Demo accessible from homepage
- [ ] Can ask one question
- [ ] Signup CTA appears

## Performance Optimization

### 1. Next.js Optimizations

Already configured:
- Image optimization
- Code splitting
- Server-side rendering
- Static generation

### 2. Additional Optimizations

```bash
# Analyze bundle size
npm run build
npm run analyze
```

### 3. Caching Strategy

- Static assets cached by Vercel CDN
- API responses use appropriate cache headers
- Images optimized and cached

## Security Checklist

- [x] Environment variables secured
- [x] Firestore rules properly configured
- [x] API routes protected
- [x] HTTPS enforced
- [x] CORS properly configured
- [x] XSS protection headers added
- [x] SQL injection not applicable (using Firestore)
- [x] Rate limiting (consider adding)

## Rollback Plan

If deployment fails:

```bash
# Rollback to previous deployment
vercel rollback
```

Or:
1. Go to Vercel Dashboard
2. Select Deployments
3. Choose previous successful deployment
4. Click "Promote to Production"

## Continuous Deployment

### Auto-deploy on Git Push

1. Connect GitHub repo to Vercel
2. Enable automatic deployments
3. Set production branch (main/master)
4. Preview deployments on PRs

### Git Workflow

```bash
# Development
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature

# Create PR → Vercel creates preview deployment
# Merge PR → Auto-deploys to production
```

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
vercel logs

# Function logs
vercel logs --function api/chat

# Specific deployment
vercel logs [deployment-url]
```

### Analytics

- Vercel Analytics (built-in)
- Firebase Analytics
- Custom event tracking

## Troubleshooting

### Build Fails

1. Check build logs in Vercel
2. Verify all dependencies in `package.json`
3. Test build locally: `npm run build`
4. Check for TypeScript/ESLint errors

### Runtime Errors

1. Check function logs
2. Verify environment variables
3. Test API endpoints
4. Check Firestore rules

### Performance Issues

1. Check Vercel Analytics
2. Monitor OpenAI API latency
3. Optimize database queries
4. Review bundle size

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Firebase Docs: https://firebase.google.com/docs

## Version Control

- Tag releases: `git tag v1.0.0`
- Create changelog
- Document breaking changes
- Keep deployment notes

---

**Deployment Completed**: [Date]  
**Version**: 1.0.0  
**Deployed By**: [Your Name]  
**Production URL**: https://your-domain.vercel.app

