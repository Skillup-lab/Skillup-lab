# SkillUp Lab Production Deployment Guide

This guide provides step-by-step instructions for deploying SkillUp Lab to production with PlanetScale database.

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <your-repo>
cd skillup-lab/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.production .env
# Edit .env with your production values

# 4. Setup database
npm run setup:production

# 5. Start production server
npm start
```

## 📋 Prerequisites

- **Node.js** v16 or higher
- **PlanetScale** account and database
- **Production domain** with SSL/TLS certificate
- **SMTP service** (optional, for email features)

## 🗄️ Database Setup (PlanetScale)

### 1. Create PlanetScale Database

```bash
# Install PlanetScale CLI
npm install -g @planetscale/cli

# Login to PlanetScale
pscale auth login

# Create database
pscale database create skillup-lab --region us-east

# Create production branch
pscale branch create skillup-lab main
```

### 2. Get Connection String

1. Go to [PlanetScale Dashboard](https://app.planetscale.com/)
2. Select your `skillup-lab` database
3. Go to "Connect" tab
4. Select "Node.js" as framework
5. Copy the connection string

## ⚙️ Environment Configuration

### 1. Create Production Environment File

```bash
cd backend
cp .env.production .env
```

### 2. Configure Required Variables

Edit `.env` file with your production values:

```env
# REQUIRED - Replace these values
DATABASE_URL=mysql://username:password@host.planetscale.com/skillup_lab?sslaccept=strict
JWT_SECRET=your_64_character_random_string_here
JWT_REFRESH_SECRET=your_different_64_character_random_string_here
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Generate Secure Secrets

```bash
# Generate JWT secrets (run twice for different secrets)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Validate Configuration

```bash
npm run validate:env
```

## 🛠️ Database Migration

### 1. Run Production Setup

```bash
npm run setup:production
```

This will:
- Create all database tables with proper indexes
- Insert system configuration settings
- Create admin user with secure random password
- Set up audit logging

**⚠️ IMPORTANT**: Save the admin credentials displayed after setup!

### 2. Verify Database Setup

```bash
# Test database connection
node -e "require('./config/database').testConnection().then(r => console.log('DB Status:', r ? '✅ Connected' : '❌ Failed'))"
```

## 🚀 Deployment Options

### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add

# Set environment variables in Railway dashboard
railway up
```

### Option 2: Render

1. Connect GitHub repository to Render
2. Create new Web Service
3. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Add all variables from `.env`

### Option 3: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Option 4: DigitalOcean App Platform

1. Connect GitHub repository
2. Configure app spec:
   ```yaml
   name: skillup-lab
   services:
   - name: api
     source_dir: backend
     github:
       repo: your-username/skillup-lab
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     # Add other environment variables
   ```

## 🌐 Frontend Deployment

### Option 1: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from root directory
netlify deploy --prod --dir .
```

### Option 2: Vercel

```bash
# Deploy from root directory
vercel --prod
```

### Option 3: GitHub Pages

1. Enable GitHub Pages in repository settings
2. Set source to main branch
3. Update API URLs in frontend to point to production backend

## 🔒 Security Configuration

### 1. SSL/TLS Certificate

Ensure your domain has a valid SSL certificate:
- Use Let's Encrypt for free certificates
- Configure HTTPS redirect
- Update CORS_ORIGIN to use https:// URLs

### 2. Environment Security

```bash
# Check for security vulnerabilities
npm run security:check

# Validate production configuration
npm run validate:env
```

### 3. Database Security

- Enable PlanetScale's built-in security features
- Use connection strings with SSL
- Regularly rotate database passwords
- Monitor database access logs

## 📊 Monitoring & Maintenance

### 1. Health Checks

Your application includes a health check endpoint:
```
GET https://yourdomain.com/health
```

### 2. Logging

Configure log aggregation:
- Use services like LogDNA, Papertrail, or Loggly
- Monitor error rates and performance
- Set up alerts for critical issues

### 3. Database Monitoring

- Monitor PlanetScale dashboard for performance
- Set up alerts for connection issues
- Regular backup verification

### 4. Performance Monitoring

Optional integrations:
- **Sentry** for error tracking
- **New Relic** for APM
- **DataDog** for infrastructure monitoring

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check connection string format
   echo $DATABASE_URL
   
   # Test connection
   npm run validate:env
   ```

2. **CORS Errors**
   ```bash
   # Verify CORS_ORIGIN includes your frontend domain
   echo $CORS_ORIGIN
   ```

3. **JWT Token Issues**
   ```bash
   # Ensure JWT secrets are properly set
   node -e "console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0)"
   ```

4. **Environment Variables Not Loading**
   ```bash
   # Check .env file exists and is readable
   ls -la .env
   cat .env | head -5
   ```

### Debug Mode

For troubleshooting, temporarily enable debug logging:
```env
LOG_LEVEL=debug
ENABLE_QUERY_LOGGING=true
```

## 📝 Post-Deployment Checklist

- [ ] Database connection successful
- [ ] Admin user created and password saved
- [ ] Frontend can communicate with backend API
- [ ] CORS configured for production domain
- [ ] SSL certificate installed and working
- [ ] Health check endpoint responding
- [ ] Error monitoring configured
- [ ] Backup strategy implemented
- [ ] Performance monitoring active
- [ ] Security headers enabled
- [ ] Rate limiting functional
- [ ] Email functionality tested (if enabled)

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# 1. Test changes locally
npm test

# 2. Validate configuration
npm run validate:env

# 3. Deploy to staging first
# 4. Deploy to production

# 5. Run database migrations if needed
npm run migrate
```

### Regular Maintenance

- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and rotate secrets
- **Annually**: Review and update security policies

## 🆘 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment configuration
4. Test database connectivity
5. Check PlanetScale dashboard for issues

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Rotate secrets regularly** (quarterly recommended)
3. **Monitor access logs** for suspicious activity
4. **Keep dependencies updated** with security patches
5. **Use HTTPS everywhere** in production
6. **Enable audit logging** for compliance
7. **Implement proper backup strategy**
8. **Regular security audits** of the application

---

**🎉 Congratulations!** Your SkillUp Lab application is now running in production with enterprise-grade security and scalability.
