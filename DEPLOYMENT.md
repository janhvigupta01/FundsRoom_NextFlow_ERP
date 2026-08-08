# NexFlow | Deployment & Server Setup Guide

This document outlines the step-by-step procedure to deploy the **NexFlow Operations Portal** to production.

---

## 📌 Architecture in Production

```mermaid
graph LR
    User([Browser Client]) -->|HTTPS| Frontend[Vercel / AWS CloudFront]
    Frontend -->|REST API Calls /api/*| Backend[Render / AWS EC2 Container]
    Backend -->|Prisma Connection Pool| DB[(Supabase PostgreSQL / AWS RDS)]
```

---

## 🚀 Deployment Option 1: 100% Free Cloud Deployment (10-Minute Setup) ⭐ Recommended

The assignment allows free hosting platforms (Vercel, Render, Supabase). Here is how to get your live URLs:

### Step 1: Create Free PostgreSQL Database (Supabase or Neon)
1. Go to [supabase.com](https://supabase.com) (or [neon.tech](https://neon.tech)) and create a free project.
2. Under **Project Settings > Database**, copy your `Connection URI` (e.g., `postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`).

---

### Step 2: Deploy Backend to Render (Free Web Service)
1. Go to [render.com](https://render.com) and create a free account.
2. Click **New + > Web Service** and connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push && npm run seed && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
4. Add the following **Environment Variables** in the Render dashboard:
   - `DATABASE_URL`: *(Your Supabase connection string from Step 1)*
   - `JWT_SECRET`: `super_secure_production_jwt_key_2026`
   - `JWT_EXPIRES_IN`: `7d`
   - `PORT`: `5000`
   - `CORS_ORIGIN`: `*`
5. Click **Create Web Service**. Once deployed, copy your Live Backend URL (e.g. `https://nexflow-api.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel (Free)
1. Go to [vercel.com](https://vercel.com) and import your GitHub repository.
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
3. Add **Environment Variables**:
   - `VITE_API_URL`: `https://nexflow-api.onrender.com`
4. Click **Deploy**. Vercel will provide your Live Frontend URL (e.g. `https://nexflow-portal.vercel.app`).

---

## ☁️ Deployment Option 2: AWS Deployment (EC2 + Docker)

If you prefer deploying to AWS (treated as a bonus):

### 1. Launch an AWS EC2 Instance
- **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
- **Instance Type**: `t2.micro` or `t3.micro` (AWS Free Tier eligible)
- **Security Group Inbound Rules**:
  - `SSH` (Port 22) from your IP
  - `HTTP` (Port 80) from `0.0.0.0/0`
  - `HTTPS` (Port 443) from `0.0.0.0/0`
  - `Custom TCP` (Port 5000) from `0.0.0.0/0`

### 2. Connect & Install Docker on EC2
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update packages and install Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git

# Add user to docker group
sudo usermod -aG docker ubuntu
newgrp docker
```

### 3. Clone Repository & Run Containers
```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Start both Backend and Frontend containers
docker compose up -d --build
```

### 4. Configure Free SSL / HTTPS (Certbot + Nginx)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 📋 Environment Variables Reference

### Backend (`/backend/.env`)
| Variable | Description | Production Example |
|---|---|---|
| `PORT` | Listening server port | `5000` |
| `DATABASE_URL` | Database Connection URI | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing auth tokens | `a_long_random_hash_string` |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed origin for frontend | `https://nexflow-portal.vercel.app` |

---

## 📦 Submission Checklist

When submitting your case study, provide:
1. **GitHub Repository Link**: `https://github.com/...`
2. **Live Frontend URL**: `https://...` (or note: *Local Setup with Screen Recording*)
3. **Live Backend API URL**: `https://.../api`
4. **Test Credentials**:
   - `admin@erp.com` / `password123` (Admin)
   - `sales@erp.com` / `password123` (Sales)
   - `warehouse@erp.com` / `password123` (Warehouse)
   - `accounts@erp.com` / `password123` (Accounts)
5. **Postman Collection**: `Mini_ERP_CRM_Postman_Collection.json` (already in root folder)
