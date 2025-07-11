# MoneyMind Deployment Guide

This guide covers deploying MoneyMind to production environments.

## Prerequisites

- Node.js 16+ installed
- MongoDB 4.4+ (local or cloud instance)
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)
- Process manager (PM2 recommended)

## Environment Setup

### Production Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/moneymind_prod
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/moneymind

# Security
SESSION_SECRET=your-super-secure-random-string-here-min-32-chars
CORS_ORIGIN=https://yourdomain.com

# Optional: Email configuration for notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Environment Variables

Create a `.env.production` file in the frontend directory:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=MoneyMind
VITE_APP_VERSION=1.0.0
```

## Database Setup

### Local MongoDB

1. Install MongoDB:
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS with Homebrew
brew install mongodb-community

# Windows - Download from MongoDB website
```

2. Start MongoDB service:
```bash
# Linux
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

3. Create production database:
```bash
mongo
use moneymind_prod
db.createUser({
  user: "moneymind_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Set up database user and password
4. Whitelist your server IP address
5. Get connection string and update `MONGODB_URI`

## Backend Deployment

### Option 1: Traditional Server Deployment

1. **Prepare the server:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

2. **Deploy the application:**
```bash
# Clone repository
git clone <your-repo-url>
cd MoneyMind/backend

# Install dependencies
npm ci --only=production

# Set up environment
cp .env.example .env
# Edit .env with production values

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

3. **Create PM2 ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'moneymind-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Option 2: Docker Deployment

1. **Create Dockerfile** (backend):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

USER node

CMD ["node", "server.js"]
```

2. **Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/moneymind
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    restart: unless-stopped

volumes:
  mongo_data:
```

3. **Deploy with Docker:**
```bash
docker-compose up -d
```

## Frontend Deployment

### Option 1: Static Hosting (Netlify/Vercel)

1. **Build the application:**
```bash
cd frontend
npm ci
npm run build
```

2. **Deploy to Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

3. **Deploy to Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 2: Nginx Static Hosting

1. **Build and copy files:**
```bash
cd frontend
npm ci
npm run build

# Copy to web directory
sudo cp -r dist/* /var/www/html/
```

2. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

1. **Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Obtain certificate:**
```bash
sudo certbot --nginx -d yourdomain.com
```

3. **Auto-renewal:**
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Reverse Proxy Setup

### Nginx Configuration for Full Stack

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

## Monitoring and Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Restart application
pm2 restart moneymind-backend

# View process status
pm2 status
```

### Log Rotation

```bash
# Install logrotate configuration
sudo nano /etc/logrotate.d/moneymind

# Add configuration:
/path/to/moneymind/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup Strategy

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db moneymind_prod --out /backups/mongodb_$DATE
tar -czf /backups/mongodb_$DATE.tar.gz /backups/mongodb_$DATE
rm -rf /backups/mongodb_$DATE

# Keep only last 7 days
find /backups -name "mongodb_*.tar.gz" -mtime +7 -delete
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Performance Optimization

### Backend Optimizations

1. **Enable compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Set up caching headers:**
```javascript
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));
```

### Frontend Optimizations

1. **Build optimizations** (already configured in Vite)
2. **CDN setup** for static assets
3. **Service worker** for caching

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Session security configured

## Troubleshooting

### Common Issues

**Application won't start:**
- Check environment variables
- Verify database connection
- Check port availability
- Review error logs

**Database connection issues:**
- Verify MongoDB is running
- Check connection string
- Verify network access
- Check authentication credentials

**Frontend not loading:**
- Check build process
- Verify static file serving
- Check API proxy configuration
- Review browser console errors

### Health Checks

Create health check endpoints:

```javascript
// Backend health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## Scaling Considerations

### Horizontal Scaling
- Load balancer setup
- Multiple backend instances
- Session store (Redis)
- Database clustering

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layers
- Monitor performance metrics

---

**Production Checklist:**
- [ ] Environment variables configured
- [ ] Database secured and backed up
- [ ] SSL certificate installed
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Security measures implemented
- [ ] Performance optimized
- [ ] Health checks working
- [ ] Backup strategy in place
