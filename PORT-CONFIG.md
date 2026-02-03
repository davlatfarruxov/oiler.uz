# Next.js Port Sozlash Qo'llanmasi

Next.js da portni o'zgartirish uchun 3 ta yo'l mavjud:

## 1️⃣ package.json da (Tavsiya etiladi)

**Fayl:** `front/package.json`

```json
"scripts": {
  "dev": "next dev -p 3000",
  "start": "next start -p 3000"
}
```

**Boshqa portlar uchun:**
```json
"scripts": {
  "dev": "next dev -p 4000",
  "start": "next start -p 4000"
}
```

## 2️⃣ .env faylida

**Fayl:** `front/.env.local` (development uchun)

```env
PORT=3000
```

**Fayl:** `front/.env.production` (production uchun)

```env
PORT=3000
```

## 3️⃣ PM2 konfiguratsiyasida (Production)

**Fayl:** `ecosystem.config.js`

```javascript
{
  name: 'motorlab-frontend',
  script: 'node_modules/next/dist/bin/next',
  args: 'start -p 3000',  // Bu yerda portni o'zgartiring
  cwd: './front',
  env: {
    NODE_ENV: 'production',
    PORT: 3000  // Yoki bu yerda
  }
}
```

## 4️⃣ Terminalda to'g'ridan-to'g'ri

```bash
# Development
npm run dev -- -p 4000
# yoki
next dev -p 4000

# Production
npm run start -- -p 4000
# yoki
next start -p 4000
```

## 🔧 Nginx bilan ishlatganda

Agar portni o'zgartirsangiz, Nginx konfiguratsiyasini ham yangilang:

**Fayl:** `nginx.conf`

```nginx
upstream frontend {
    server 127.0.0.1:3000;  # Bu yerda yangi portni yozing
    keepalive 64;
}
```

Keyin Nginx ni restart qiling:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 📋 Misol: Portni 4000 ga o'zgartirish

### Development uchun:

1. **front/package.json:**
```json
"scripts": {
  "dev": "next dev -p 4000"
}
```

2. **front/.env.local:**
```env
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

3. **Ishga tushirish:**
```bash
cd front
npm run dev
```

### Production uchun:

1. **ecosystem.config.js:**
```javascript
{
  name: 'motorlab-frontend',
  args: 'start -p 4000',
  env: {
    PORT: 4000
  }
}
```

2. **nginx.conf:**
```nginx
upstream frontend {
    server 127.0.0.1:4000;
}
```

3. **Deploy:**
```bash
pm2 restart motorlab-frontend
sudo systemctl restart nginx
```

## ⚠️ Muhim Eslatmalar:

1. **Port band bo'lsa:**
```bash
# Qaysi process ishlatayotganini topish
sudo lsof -i :3000

# Process ni to'xtatish
sudo kill -9 <PID>
```

2. **Firewall sozlash (agar kerak bo'lsa):**
```bash
sudo ufw allow 3000/tcp
```

3. **Port prioriteti:**
   - CLI argument (`-p 4000`) eng yuqori prioritet
   - .env faylida PORT
   - Default: 3000

## 🎯 Tavsiyalar:

- **Development:** 3000 port (default)
- **Production:** 3000 port (Nginx orqali 80/443 ga proxy)
- **Multiple apps:** Har bir app uchun alohida port (3000, 3001, 3002...)

## 🔍 Port tekshirish:

```bash
# Port ochiq yoki yo'qligini tekshirish
netstat -tuln | grep 3000

# Next.js ishlab turganini tekshirish
curl http://localhost:3000

# PM2 orqali
pm2 list
pm2 logs motorlab-frontend
```
