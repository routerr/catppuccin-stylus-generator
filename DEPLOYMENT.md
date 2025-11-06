# Deployment Guide

Complete guide for deploying the Catppuccin Theme Generator to various platforms.

## Table of Contents

- [GitHub Pages](#github-pages)
- [Vercel](#vercel)
- [Netlify](#netlify)
- [Self-Hosted](#self-hosted)

---

## GitHub Pages

### Prerequisites
- GitHub account
- Repository pushed to GitHub

### Automatic Deployment (Recommended)

1. **Update the base path in `vite.config.ts`**
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/catppuccin-stylus-generator-claude-code/', // Replace with your repo name
     build: {
       outDir: 'dist',
     },
   })
   ```

2. **Enable GitHub Actions**
   - Go to your repository on GitHub
   - Navigate to **Settings** > **Pages**
   - Under **Source**, select **GitHub Actions**

3. **Push your changes**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages"
   git push origin main
   ```

4. **Wait for deployment**
   - Go to **Actions** tab to see deployment progress
   - Once complete, your site will be at:
     `https://yourusername.github.io/catppuccin-stylus-generator-claude-code/`

### Manual Deployment

If you prefer manual deployment:

```bash
# Install gh-pages package
npm install -D gh-pages

# Build and deploy
npm run deploy
```

---

## Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/catppuccin-stylus-generator-claude-code)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow prompts**
   - Link to existing project or create new
   - Set framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

4. **Production deployment**
   ```bash
   vercel --prod
   ```

### Vercel Configuration

Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## Netlify

### Drag & Drop Deployment

1. Build your project locally:
   ```bash
   npm run build
   ```

2. Go to https://app.netlify.com/drop

3. Drag the `dist` folder to deploy

### CLI Deployment

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Git-Based Deployment

1. **Connect repository**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Choose your repository

2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

### Netlify Configuration

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Self-Hosted

### Prerequisites
- Node.js 18+ installed on server
- Domain name (optional)
- Reverse proxy (nginx/Apache)

### Build for Production

```bash
# Build the project
npm run build

# The dist folder contains all static files
```

### Using nginx

1. **Copy dist folder to server**
   ```bash
   scp -r dist/* user@server:/var/www/catppuccin-generator/
   ```

2. **Configure nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/catppuccin-generator;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Gzip compression
       gzip on;
       gzip_types text/css application/javascript application/json;
   }
   ```

3. **Restart nginx**
   ```bash
   sudo systemctl restart nginx
   ```

### Using Apache

1. **Copy dist folder to server**
   ```bash
   scp -r dist/* user@server:/var/www/catppuccin-generator/
   ```

2. **Create .htaccess** in the dist folder:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

3. **Configure Apache virtual host**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /var/www/catppuccin-generator

       <Directory /var/www/catppuccin-generator>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

4. **Restart Apache**
   ```bash
   sudo systemctl restart apache2
   ```

### Using Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine as build

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**
   ```nginx
   events {
       worker_connections 1024;
   }

   http {
       include /etc/nginx/mime.types;
       default_type application/octet-stream;

       server {
           listen 80;
           server_name localhost;
           root /usr/share/nginx/html;
           index index.html;

           location / {
               try_files $uri $uri/ /index.html;
           }
       }
   }
   ```

3. **Build and run**
   ```bash
   docker build -t catppuccin-generator .
   docker run -d -p 80:80 catppuccin-generator
   ```

---

## Environment-Specific Configuration

### Update Base Path

For subdirectory deployments, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: process.env.BASE_URL || '/subdirectory/',
  // ...
})
```

### Production Optimizations

Already included in the build:

- ✅ Minification
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Gzip compression support

---

## Troubleshooting

### Blank page after deployment
- Check browser console for errors
- Verify `base` path in `vite.config.ts` matches your deployment path
- Ensure all assets load from correct paths

### 404 errors on page refresh
- Configure your server to route all requests to index.html
- See server-specific configurations above

### Build fails
- Check Node.js version (18+ required)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

### CORS errors
- CORS errors are expected when calling external APIs
- Some crawler services may not support client-side requests
- This is a limitation of client-side deployment

---

## Monitoring

### Analytics

Add analytics to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking

Add Sentry for error tracking:

```bash
npm install @sentry/react
```

```typescript
// In main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

---

## Continuous Deployment

### GitHub Actions (Already configured)

The included workflow automatically deploys on push to main branch.

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
pages:
  stage: deploy
  script:
    - npm ci
    - npm run build
    - mv dist public
  artifacts:
    paths:
      - public
  only:
    - main
```

---

## SSL/HTTPS

### GitHub Pages
- Automatic HTTPS with GitHub's certificate
- Enable in Settings > Pages > Enforce HTTPS

### Vercel/Netlify
- Automatic HTTPS with free SSL certificates

### Self-Hosted with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Performance Optimization

### CDN Setup

Use a CDN for better global performance:

1. **Cloudflare** (Free)
   - Sign up at cloudflare.com
   - Add your site
   - Update nameservers

2. **Configure caching**
   - Static assets: Cache for 1 year
   - HTML: Cache for 1 hour

### Preload Critical Assets

Add to `index.html`:

```html
<link rel="preconnect" href="https://api.openrouter.ai">
<link rel="preconnect" href="https://api.firecrawl.dev">
```

---

## Need Help?

- Check [README.md](README.md) for more information
- Open an issue on GitHub
- Join the Catppuccin Discord community
