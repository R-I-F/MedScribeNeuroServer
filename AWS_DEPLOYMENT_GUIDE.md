# AWS Deployment Guide for MedScribeNeuroServer

## Overview
This guide covers deploying your Node.js/Express/TypeScript backend to AWS using the most affordable options.

## Option 1: AWS Lightsail (Recommended - $3.50-10/month)

### Prerequisites
- AWS Account
- MongoDB Atlas account (free tier) or MongoDB on Lightsail
- Domain name (optional, for custom domain)

### Step 1: Set Up MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 - 512MB storage)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for Lightsail instance)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Step 2: Create Lightsail Instance
1. Go to AWS Lightsail Console
2. Click "Create instance"
3. Choose:
   - **Platform**: Linux/Unix
   - **Blueprint**: Node.js
   - **Instance plan**: $3.50/month (512MB RAM) or $5/month (1GB RAM)
   - **Instance name**: `medscribe-backend`
4. Click "Create instance"

### Step 3: Configure Environment Variables
1. In Lightsail, go to your instance → "Networking" tab
2. Add custom ports: `3000` (or your PORT)
3. Go to "Connect using SSH" → Open browser-based SSH

### Step 4: Deploy Application
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (if not pre-installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone your repository (or upload files)
git clone <your-repo-url>
cd MedScribeNeuroServer

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .env file
nano .env
```

### Step 5: Configure Environment Variables
Add to `.env`:
```env
PORT=3000
MONGODB_URL=your_mongodb_atlas_connection_string
DB_NAME=your_database_name
CORS_ORIGIN=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRETIME=your_jwt_expire_time
SERVER_REFRESH_TOKEN_EXPIRETIME=604800
# Add other required environment variables
```

### Step 6: Start Application with PM2
```bash
# Start application
pm2 start dist/index.js --name medscribe-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

### Step 7: Configure Static IP and Domain (Optional)
1. In Lightsail → Networking → Create static IP
2. Attach static IP to your instance
3. Point your domain to the static IP (A record)

### Step 8: Enable HTTPS (SSL)
1. Install Certbot:
```bash
sudo apt install certbot
```

2. Use Lightsail's built-in SSL certificate (recommended):
   - Go to Lightsail → Networking → SSL/TLS certificates
   - Create certificate for your domain
   - Attach to your instance

### Step 9: Configure Firewall
In Lightsail → Networking:
- Open port 80 (HTTP)
- Open port 443 (HTTPS)
- Open port 3000 (if needed, or use reverse proxy)

### Step 10: Setup Nginx Reverse Proxy (Recommended)
```bash
# Install Nginx
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/medscribe-backend
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/medscribe-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Option 2: AWS EC2 (Free Tier Eligible - $0-10/month)

### Step 1: Launch EC2 Instance
1. Go to EC2 Console → Launch Instance
2. Choose:
   - **AMI**: Amazon Linux 2023 or Ubuntu Server 22.04 LTS
   - **Instance type**: t2.micro (free tier) or t3.micro
   - **Key pair**: Create new or use existing
   - **Security group**: Allow SSH (22), HTTP (80), HTTPS (443), Custom TCP (3000)
3. Launch instance

### Step 2: Connect to Instance
```bash
# Using SSH
ssh -i your-key.pem ec2-user@your-instance-ip
# or for Ubuntu:
ssh -i your-key.pem ubuntu@your-instance-ip
```

### Step 3: Install Dependencies
```bash
# For Amazon Linux
sudo yum update -y
sudo yum install -y nodejs npm git

# For Ubuntu
sudo apt update
sudo apt install -y nodejs npm git

# Install Node.js 18+ (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### Step 4-10: Follow Steps 4-10 from Lightsail guide above

---

## Option 3: AWS App Runner (~$7-15/month)

### Prerequisites
- Dockerize your application
- Container registry (ECR or Docker Hub)

### Step 1: Create Dockerfile
Create `Dockerfile` in project root:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

### Step 2: Create .dockerignore
```
node_modules
dist
.env
.git
*.md
```

### Step 3: Build and Push to ECR
```bash
# Install AWS CLI
# Configure AWS credentials
aws configure

# Create ECR repository
aws ecr create-repository --repository-name medscribe-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t medscribe-backend .
docker tag medscribe-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/medscribe-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/medscribe-backend:latest
```

### Step 4: Create App Runner Service
1. Go to AWS App Runner Console
2. Create service
3. Choose "Container registry" → ECR
4. Select your image
5. Configure:
   - **Service name**: medscribe-backend
   - **Port**: 3000
   - **Environment variables**: Add all from your .env
6. Deploy

---

## Option 4: AWS Lambda + API Gateway (Serverless - $0-5/month)

**Note**: Requires significant refactoring. Your Express app needs to be wrapped for Lambda.

### Required Changes
1. Install `serverless-http`:
```bash
npm install serverless-http
```

2. Create `lambda.ts`:
```typescript
import serverless from 'serverless-http';
import app from './index'; // Your Express app

export const handler = serverless(app);
```

3. Create `serverless.yml`:
```yaml
service: medscribe-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    MONGODB_URL: ${env:MONGODB_URL}
    DB_NAME: ${env:DB_NAME}
    # ... other env vars

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

4. Deploy:
```bash
npm install -g serverless
serverless deploy
```

**Limitations**:
- 15-minute timeout limit
- Cold starts
- May need to refactor for Lambda patterns

---

## Cost Comparison

| Option | Monthly Cost | Best For |
|--------|-------------|----------|
| **Lightsail** | $3.50-10 | **Best balance** - Simple, affordable |
| **EC2 (t2.micro)** | $0 (first year), then ~$7 | Full control, free tier |
| **App Runner** | ~$7-15 | Container-based, auto-scaling |
| **Lambda** | ~$0-5 | Low traffic, serverless |
| **MongoDB Atlas** | $0 (free tier) | Database hosting |

---

## Recommended Setup

**Most Affordable**: AWS Lightsail ($3.50/month) + MongoDB Atlas (Free)
- **Total**: ~$3.50/month
- Simple setup
- Fixed pricing
- Good performance

**Best Value**: AWS EC2 t2.micro (Free for 12 months) + MongoDB Atlas (Free)
- **Total**: $0/month (first year), then ~$7/month
- Full control
- More flexible

---

## Environment Variables Checklist

Make sure to set these in your deployment:
- `PORT` - Server port (default: 3000)
- `MONGODB_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `CORS_ORIGIN` - Frontend URL
- `FRONTEND_URL` - Frontend URL
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRETIME` - JWT expiration time
- `SERVER_REFRESH_TOKEN_EXPIRETIME` - Refresh token expiration
- Any other environment variables your app requires

---

## Security Best Practices

1. **Never commit `.env` files** - Use environment variables in hosting platform
2. **Use HTTPS** - Enable SSL/TLS certificates
3. **Restrict MongoDB access** - Whitelist only your server IPs
4. **Use strong JWT secrets** - Generate random, secure keys
5. **Keep dependencies updated** - Regularly run `npm audit`
6. **Use firewall rules** - Only open necessary ports
7. **Enable CloudWatch monitoring** - Monitor logs and metrics

---

## Monitoring and Maintenance

### PM2 Commands
```bash
pm2 list              # List all processes
pm2 logs              # View logs
pm2 restart all       # Restart all processes
pm2 stop all          # Stop all processes
pm2 monit             # Monitor resources
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart medscribe-backend
```

---

## Troubleshooting

### Application won't start
- Check PM2 logs: `pm2 logs medscribe-backend`
- Verify environment variables are set
- Check MongoDB connection
- Verify port is not in use: `netstat -tulpn | grep 3000`

### Can't connect to database
- Verify MongoDB Atlas IP whitelist includes server IP
- Check connection string format
- Verify database credentials

### CORS errors
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check CORS configuration in `src/index.ts`

---

## Additional Resources

- [AWS Lightsail Documentation](https://docs.aws.amazon.com/lightsail/)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Reverse Proxy Guide](https://nginx.org/en/docs/)

