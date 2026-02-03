# Debug: Forbidden Error

## Muammoni Topish

### 1. Browser Console da Token Tekshirish
```javascript
// Browser console da bajaring:
console.log('Token:', localStorage.getItem('accessToken'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

### 2. Token Decode Qilish
- Token ni copy qiling
- https://jwt.io ga o'ting
- Token ni paste qiling
- Payload da `role` ni tekshiring - `super_admin` bo'lishi kerak

### 3. Backend Restart Qilish
```bash
# Development da:
cd backend
npm run dev

# Production da (PM2):
pm2 restart motorlab-backend
pm2 logs motorlab-backend
```

### 4. Network Tab da Request Tekshirish
1. Browser DevTools ni oching (F12)
2. Network tab ga o'ting
3. Oil qo'shishga harakat qiling
4. `/api/v1/oil-products` POST request ni toping
5. Headers tab da tekshiring:
   - `Authorization: Bearer <token>` bor yoki yo'q?
6. Response tab da xato xabarini ko'ring

### 5. Backend Logs
Men authorize middleware ga console.log qo'shdim. Endi backend logs da ko'rasiz:
```
User role: super_admin
Required roles: [ 'admin', 'super_admin' ]
Role check: true/false
```

Agar `Role check: false` bo'lsa, demak role string formati mos kelmayapti.

## Yechimlar

### Yechim 1: Qayta Login Qiling
Eski token noto'g'ri bo'lishi mumkin:
1. Logout qiling
2. Qayta login qiling
3. Qayta harakat qiling

### Yechim 2: Token Format Tekshirish
Agar JWT da role `super_admin` emas, balki `SUPER_ADMIN` yoki boshqa format bo'lsa:

Backend da `backend/src/utils/jwt.ts` faylini tekshiring va role ni to'g'ri format da saqlayotganini ko'ring.

### Yechim 3: Database da Role Tekshirish
MongoDB da user ni tekshiring:
```javascript
db.users.findOne({ email: "your-email@example.com" })
```

Role `super_admin` bo'lishi kerak (kichik harflar bilan).

## Tezkor Test

Backend console da ko'ring:
```
User role: <bu yerda sizning rollingiz>
Required roles: [ 'admin', 'super_admin' ]
```

Agar role mos kelmasa, database da user ni update qiling:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "super_admin" } }
)
```

Keyin qayta login qiling!
