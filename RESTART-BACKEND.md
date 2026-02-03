# Backend Restart Qilish

## ✅ O'zgarishlar tugallandi!

Barcha route fayllar to'g'rilandi va `authorize([...])` array formatida ishlatildi.

## Backend ni restart qiling:

### Development mode:
```bash
cd backend
npm run dev
```

### Production mode (PM2):
```bash
pm2 restart motorlab-backend
pm2 logs motorlab-backend
```

## Tekshirish:

1. Backend restart qiling
2. Frontend dan **logout** qiling
3. Qaytadan **login** qiling (yangi token olish uchun)
4. Oil yoki Filter qo'shishga harakat qiling

## Console loglarni ko'rish:

Backend terminalda quyidagilar ko'rinadi:
```
User role: employee
Required roles: [ 'employee', 'admin', 'super_admin' ]
Role check: true
```

Agar `Role check: false` bo'lsa, demak sizning user rolingiz to'g'ri emas.

## User rolini tekshirish:

MongoDB da yoki database da user rolini tekshiring:
```javascript
// MongoDB shell
db.users.find({ email: "your-email@example.com" })
```

Yoki backend API orqali:
```bash
# Login qiling va token oling
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'

# Token ni decode qiling (jwt.io saytida)
```

## Agar muammo davom etsa:

1. Browser cache tozalang
2. Logout/Login qiling
3. Backend loglarni tekshiring: `pm2 logs motorlab-backend`
4. Network tab da request/response ko'ring (F12 -> Network)
