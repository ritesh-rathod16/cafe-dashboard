# Deploying Cafe Republic to Vercel

This guide walks you through deploying the Cafe Republic application to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- Your GitHub repository connected to Vercel
- Supabase project credentials
- (Optional) Stripe API keys if using payment features

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Your Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository: `rr-industries/cafe-republic`
   - Vercel will auto-detect Next.js configuration

2. **Configure Environment Variables**
   
   Add the following environment variables in the Vercel dashboard:

   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://mkvznwyhdccqxwfzjruj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   DATABASE_URL=your_database_url_here
   
   # Better Auth
   BETTER_AUTH_SECRET=generate_a_secure_random_string_here
   BETTER_AUTH_URL=https://your-app.vercel.app
   
   # Stripe (if using)
   STRIPE_SECRET_KEY=your_stripe_secret_key_here
   ```

   > **Important**: For `BETTER_AUTH_SECRET`, generate a secure random string (32+ characters). You can use:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > ```

3. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)
   - Your app will be live at `https://your-app.vercel.app`

4. **Update BETTER_AUTH_URL**
   - After first deployment, go to Settings → Environment Variables
   - Update `BETTER_AUTH_URL` to your actual Vercel URL
   - Redeploy to apply changes

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add DATABASE_URL
   vercel env add BETTER_AUTH_SECRET
   vercel env add BETTER_AUTH_URL
   vercel env add STRIPE_SECRET_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update Better Auth URL

After your first deployment:
- Note your production URL (e.g., `https://cafe-republic.vercel.app`)
- Update the `BETTER_AUTH_URL` environment variable in Vercel dashboard
- Trigger a new deployment

### 2. Configure Supabase Authentication

1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Vercel URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### 3. Test Authentication

1. Visit your deployed app
2. Try logging in with the superadmin account: `CAFEREPUBLIC@gmail.com`
3. Verify admin panel access works

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) | ✅ Yes |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `BETTER_AUTH_SECRET` | Secret for Better Auth sessions | ✅ Yes |
| `BETTER_AUTH_URL` | Your production URL | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe API key | ⚠️ If using Stripe |

## Continuous Deployment

Once connected, Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## Troubleshooting

### Build Fails with TypeScript Errors

The project is configured to ignore TypeScript errors during build (`ignoreBuildErrors: true`). If this causes issues:
1. Check the build logs in Vercel dashboard
2. Fix critical errors locally
3. Push changes to trigger new deployment

### Authentication Not Working

1. Verify `BETTER_AUTH_URL` matches your production URL
2. Check Supabase redirect URLs are configured correctly
3. Ensure all environment variables are set in Vercel

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check Supabase project is not paused
3. Ensure RLS policies allow authenticated access

### Images Not Loading

The project uses `unoptimized: true` for images. If you want to use Vercel's image optimization:
1. Remove `unoptimized: true` from `next.config.ts`
2. Update image components to use Next.js Image component properly

## Performance Optimization

### Recommended Vercel Settings

- **Region**: Choose closest to your users (default: `iad1` - US East)
- **Node.js Version**: 18.18.0 or higher (specified in `package.json`)
- **Build Cache**: Enabled by default

### Monitoring

- Enable Vercel Analytics for performance insights
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor Supabase usage and quotas

## Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `BETTER_AUTH_URL` to your custom domain
5. Update Supabase redirect URLs

## Security Checklist

- ✅ Never commit `.env.local` to Git
- ✅ Use strong `BETTER_AUTH_SECRET` (32+ characters)
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secure
- ✅ Regularly rotate API keys
- ✅ Enable Vercel's security headers
- ✅ Review Supabase RLS policies

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)

## Quick Commands

```bash
# Local development
npm run dev

# Build locally (test before deploying)
npm run build

# Start production server locally
npm start

# Deploy to Vercel
vercel --prod
```

---

**Ready to deploy?** Follow Method 1 above for the easiest deployment experience! 🚀
