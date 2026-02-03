# Motorlab.uz - Server Deploy Qo'llanma

## 1. Server Tayyorlash

### Kerakli dasturlarni o'rnatish:
```bash
# Node.js va npm o'rnatish (v18 yoki yuqori)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 o'rnatish
sudo npm install -g pm2

# Nginx o'rnatish
sudo apt update
sudo apt install nginx

# MongoDB o'rnatish (agar local kerak bo'lsa)
# Yoki MongoDB Atlas ishlatishingiz mumkin
```

## 2. Loyihani Serverga Ko'chirish

```bash
# Serverga SSH orqali kirish
ssh user@your-server-ip

# Loyiha uchun papka yaratish
sudo mkdir -p /var/www/motorlab
sudo chown -R $USER:$USER /var/www/motorlab
cd /var/www/motorlab

# Git orqali loyihani clone qilish
git clone your-repo-url .

# Yoki local dan scp orqali ko'chirish:
# scp -r /path/to/project user@server:/var/www/motorlab
```

## 3. Backend Sozlash

```bash
cd /var/www/motorlab/backend

# Dependencies o'rnatish
npm install

# .env faylini sozlash
nano .env
```

### Backend .env fayli (production):
```env
NODE_ENV=production
PORT=5000

# MongoDB (Atlas yoki local)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/motorlab?retryWrites=true&w=majority

# JWT secrets (kuchli parollar qo'ying!)
JWT_SECRET=your-very-strong-secret-key-here-change-this
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-very-strong-refresh-secret-key-here
JWT_REFRESH_EXPIRE=7d

# CORS (sizning domeningiz)
CORS_ORIGIN=https://motorlab.uz,https://www.motorlab.uz

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

```bash
# TypeScript build qilish
npm run build

# Build muvaffaqiyatli bo'lganini tekshirish
ls -la dist/
```

## 4. Frontend Sozlash

```bash
cd /var/www/motorlab/front

# Dependencies o'rnatish
npm install

# .env.local faylini yaratish
nano .env.local
```

### Frontend .env.local fayli:
```env
NEXT_PUBLIC_API_URL=https://motorlab.uz/api
```

```bash
# Production build qilish
npm run build

# Build muvaffaqiyatli bo'lganini tekshirish
ls -la .next/
```

## 5. PM2 bilan Ishga Tushirish

```bash
cd /var/www/motorlab

# PM2 logs papkasini yaratish
mkdir -p backend/logs
mkdir -p front/logs

# PM2 orqali ishga tushirish
pm2 start ecosystem.config.js

# Statusni tekshirish
pm2 status

# Loglarni ko'rish
pm2 logs

# Server restart bo'lganda avtomatik ishga tushishi uchun
pm2 startup
pm2 save
```

### PM2 Komandalar:
```bash
# Barcha applarni ko'rish
pm2 list

# Bitta appni restart qilish
pm2 restart motorlab-backend
pm2 restart motorlab-frontend

# Loglarni ko'rish
pm2 logs motorlab-backend
pm2 logs motorlab-frontend

# Appni to'xtatish
pm2 stop motorlab-backend

# Appni o'chirish
pm2 delete motorlab-backend

# Barcha applarni restart qilish
pm2 restart all

# Monitoring
pm2 monit
```

## 6. Nginx Sozlash

```bash
# Nginx konfiguratsiyasini ko'chirish
sudo cp nginx.conf /etc/nginx/sites-available/motorlab.uz

# Symbolic link yaratish
sudo ln -s /etc/nginx/sites-available/motorlab.uz /etc/nginx/sites-enabled/

# Default konfiguratsiyani o'chirish (agar kerak bo'lsa)
sudo rm /etc/nginx/sites-enabled/default

# Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# Nginx ni restart qilish
sudo systemctl restart nginx

# Nginx statusini tekshirish
sudo systemctl status nginx
```

## 7. SSL Sertifikat O'rnatish (Let's Encrypt)

```bash
# Certbot o'rnatish
sudo apt install certbot python3-certbot-nginx

# SSL sertifikat olish
sudo certbot --nginx -d motorlab.uz -d www.motorlab.uz

# Avtomatik yangilanish uchun test
sudo certbot renew --dry-run
```

## 8. Firewall Sozlash

```bash
# UFW firewall yoqish
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Statusni tekshirish
sudo ufw status
```

## 9. Yangilanishlar Deploy Qilish

```bash
cd /var/www/motorlab

# Yangi kodlarni olish
git pull origin main

# Backend yangilash
cd backend
npm install
npm run build
pm2 restart motorlab-backend

# Frontend yangilash
cd ../front
npm install
npm run build
pm2 restart motorlab-frontend

# Loglarni tekshirish
pm2 logs
```

## 10. Monitoring va Maintenance

### Loglarni ko'rish:
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Disk space tekshirish
df -h

# Memory usage
free -h

# PM2 monitoring
pm2 monit
```

### Database Backup:
```bash
# MongoDB backup (agar local bo'lsa)
mongodump --uri="mongodb://localhost:27017/motorlab" --out=/backup/motorlab-$(date +%Y%m%d)

# MongoDB Atlas ishlatayotgan bo'lsangiz, Atlas dashboard dan backup oling
```

## Muhim Eslatmalar:

1. **.env fayllarida kuchli parollar ishlating**
2. **MongoDB Atlas ishlatish tavsiya etiladi** (bepul tier yetarli)
3. **SSL sertifikat har 90 kunda avtomatik yangilanadi** (certbot)
4. **PM2 logs hajmini monitoring qiling** (pm2 install pm2-logrotate)
5. **Server backup rejasini tuzing**
6. **Firewall va security updatelarni kuzatib boring**

## Muammolarni Hal Qilish:

### Backend ishlamasa:
```bash
pm2 logs motorlab-backend
cd /var/www/motorlab/backend
npm run build
pm2 restart motorlab-backend
```

### Frontend ishlamasa:
```bash
pm2 logs motorlab-frontend
cd /var/www/motorlab/front
npm run build
pm2 restart motorlab-frontend
```

### Nginx ishlamasa:
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Port band bo'lsa:
```bash
# Qaysi process port ishlatayotganini topish
sudo lsof -i :5000
sudo lsof -i :3000

# Process ni to'xtatish
sudo kill -9 <PID>
```

## Yordam:
- PM2 docs: https://pm2.keymetrics.io/docs/usage/quick-start/
- Nginx docs: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/getting-started/
