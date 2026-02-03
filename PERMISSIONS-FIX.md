# Permission Fix - EMPLOYEE Role

## O'zgartirilgan Fayllar:

1. ✅ `backend/src/routes/oilProductRoutes.ts` - EMPLOYEE ga oil products bilan ishlash huquqi
2. ✅ `backend/src/routes/oilBrandRoutes.ts` - EMPLOYEE ga oil brands bilan ishlash huquqi
3. ✅ `backend/src/routes/filterRoutes.ts` - EMPLOYEE ga filters bilan ishlash huquqi
4. ✅ `backend/src/routes/filterBrandRoutes.ts` - EMPLOYEE ga filter brands bilan ishlash huquqi
5. ✅ `backend/src/routes/inventoryRoutes.ts` - Allaqachon EMPLOYEE ga ruxsat berilgan edi

## EMPLOYEE Role Huquqlari:

### ✅ Qila oladi:
- Oil products qo'shish, tahrirlash, stock yangilash
- Oil brands qo'shish, tahrirlash
- Filters qo'shish, tahrirlash, stock yangilash
- Filter brands qo'shish, tahrirlash, status o'zgartirish
- Inventory items qo'shish, tahrirlash, stock yangilash

### ❌ Qila olmaydi:
- Oil brands o'chirish (faqat ADMIN/SUPER_ADMIN)
- Oil products o'chirish (faqat ADMIN/SUPER_ADMIN)
- Filter brands o'chirish (faqat ADMIN/SUPER_ADMIN)
- Filters o'chirish (faqat ADMIN/SUPER_ADMIN)
- Inventory items o'chirish (faqat ADMIN/SUPER_ADMIN)

## Backend Restart Qilish:

### Development mode:
```bash
cd backend
npm run dev
```

### Production mode (PM2):
```bash
pm2 restart motorlab-backend
```

### Yoki barcha PM2 applarni:
```bash
pm2 restart all
```

## Tekshirish:

1. Backend restart qiling
2. Frontend dan login qiling (EMPLOYEE role bilan)
3. Oil yoki Filter qo'shishga harakat qiling
4. Endi "Forbidden: Insufficient permissions" xatosi bo'lmasligi kerak

## Xatolik Davom Etsa:

1. Backend loglarni tekshiring:
```bash
# Development
npm run dev

# Production
pm2 logs motorlab-backend
```

2. Token yangilang (logout/login qiling)
3. Browser cache tozalang
4. Network tab da request headerlarni tekshiring (Authorization: Bearer token)
