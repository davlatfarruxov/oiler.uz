# "Oiler" — Moy Almashtirish Xizmati Avtomatlashtirish Platformasi

## 1. Loyiha Haqida Umumiy Ma'lumot

**Oiler** — moy almashtirish va avtomobil texnik xizmati ko'rsatish markazlari uchun ishlab chiqilgan to'liq funksional veb-ilova. Platforma bir nechta mustaqil kompaniyalarga (multi-tenant) xizmat ko'rsatadi: har bir kompaniya o'z ma'lumotlari, xodimlari, inventari va mijozlari bilan alohida ishlaydi.

---

## 2. Texnologik Stek

### Backend

| Texnologiya | Versiya | Maqsad |
|---|---|---|
| Node.js + Express.js | ^4.18 | REST API server |
| TypeScript | ^5.3 | Tip xavfsizligi |
| MongoDB + Mongoose | ^8.0 | Ma'lumotlar bazasi |
| JWT (jsonwebtoken) | ^9.0 | Autentifikatsiya |
| bcryptjs | ^2.4 | Parol shifrlash (12 round) |
| Helmet | ^7.1 | HTTP xavfsizlik sarlavhalari |
| express-rate-limit | ^7.5 | Brute-force himoyasi |
| cookie-parser | ^1.4 | HttpOnly cookie |
| express-validator | ^7.0 | Input validatsiya |
| uuid | ^13.0 | QR kod uchun public UUID |

### Frontend

| Texnologiya | Versiya | Maqsad |
|---|---|---|
| Next.js | 16.0 | React framework (App Router) |
| React | 19.2 | UI kutubxonasi |
| TypeScript | ^5 | Tip xavfsizligi |
| Tailwind CSS | ^4.1 | Stillar |
| Radix UI | turli | Accessible komponentlar |
| Redux Toolkit | ^2.11 | Global state boshqaruvi |
| React Hook Form + Zod | ^7.60 / 3.25 | Forma validatsiyasi |
| Recharts | 2.15 | Grafiklar va diagrammalar |
| QRCode.react | ^4.2 | QR kod generatsiyasi |
| Axios | ^1.13 | HTTP so'rovlar |
| react-to-print | ^3.2 | Chop etish |

---

## 3. Arxitektura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                │
│  Dashboard │ Kiosk │ Public Pages │ Login/Register  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (HTTP/JSON)
                       │ JWT Bearer Token
┌──────────────────────▼──────────────────────────────┐
│              BACKEND (Express.js + TypeScript)       │
│  Auth │ Middleware │ Controllers │ Services │ Routes │
└──────────────────────┬──────────────────────────────┘
                       │ Mongoose ODM
┌──────────────────────▼──────────────────────────────┐
│                  MongoDB Database                    │
│  Multi-tenant: har bir hujjatda tenantId maydoni    │
└─────────────────────────────────────────────────────┘
```

### Multi-Tenant Arxitekturasi

Har bir MongoDB hujjatida `tenant: ObjectId` maydoni mavjud. Barcha so'rovlar avtomatik ravishda joriy foydalanuvchining `tenantId` si bilan filtrlanadi. Bu bitta ma'lumotlar bazasida bir nechta mustaqil kompaniyani izolyatsiya qilish imkonini beradi (Shared Database, Separate Data pattern).

---

## 4. Ma'lumotlar Bazasi Sxemalari

### 4.1 Tenant (Kompaniya)

```
Tenant {
  companyName: String (required)
  businessEmail: String (required)
  businessPhone: String (required)
  address: String (required)
  subdomain: String (unique, optional)
  plan: enum['free', 'premium', 'enterprise']
  maxEmployees: Number (default: 5)
  maxVehicles: Number (default: 100)
  settings: {
    currency: String (default: 'USD')
    timezone: String
    exchangeRate: Number (default: 12500 — 1 USD = 12500 UZS)
    lowStockThreshold: Number
    defaultOilType: String
    serviceIntervalKm: Number
    serviceIntervalMonths: Number
  }
  isActive: Boolean
  expiresAt: Date
}
```

### 4.2 User (Foydalanuvchi)

```
User {
  name: String
  email: String (unique per tenant)
  phone: String (unique)
  password: String (bcrypt, 12 round)
  role: enum['employee', 'admin', 'super_admin']
  tenant: ObjectId → Tenant
  assignedRole: ObjectId → Role
  isTenantOwner: Boolean
  isActive: Boolean
  emailNotifications, smsNotifications,
  lowStockAlerts, dailyReport: Boolean
}
```

### 4.3 Session (Sessiya)

```
Session {
  user: ObjectId → User
  tenant: ObjectId → Tenant
  refreshTokenHash: String
  userAgent: String
  ip: String
  revokedAt: Date
  lastUsedAt: Date
}
```

### 4.4 Role (Rol)

```
Role {
  tenant: ObjectId → Tenant
  name: String (unique per tenant)
  description: String
  permissions: [PermissionKey]  // 50+ granular ruxsat
  isSystem: Boolean
}
```

### 4.5 Employee (Xodim)

```
Employee {
  tenant: ObjectId → Tenant
  name, email, phone: String
  role: enum['employee', 'admin', 'super_admin']
  commissionRate: Number (0-100%)
  active: Boolean
  startDate: Date
  isArchived: Boolean
}
```

### 4.6 Customer (Mijoz)

```
Customer {
  tenant: ObjectId → Tenant
  name: String
  phone: String
}
```

### 4.7 Vehicle (Avtomobil)

```
Vehicle {
  tenant: ObjectId → Tenant
  plateNumber: String (unique per tenant, uppercase)
  brand: String
  vehicleModel: String
  engineType: enum['petrol','diesel','hybrid','electric','propane','methane']
  customer: ObjectId → Customer
  isArchived: Boolean
}
```

### 4.8 OilChange (Moy Almashtirish)

```
OilChange {
  tenant: ObjectId → Tenant
  publicUuid: String (UUID, QR kod uchun)
  vehicle: ObjectId → Vehicle
  customer: ObjectId → Customer
  employees: [ObjectId → Employee]
  employeeCommissions: [{
    employee, commissionRate, commissionAmount,
    commissionStatus: 'pending'|'paid', paidAt
  }]
  oilProduct: ObjectId → OilProduct (optional)
  oilProductCustomerProvided: Boolean
  oilQuantityUsed: Number
  oilFilter, airFilter, cabinFilter, fuelFilter: ObjectId → Filter
  *FilterCustomerProvided: Boolean (har biri uchun)
  additionalProducts: [{ product, quantity, price }]
  customProducts: [{ name, quantity, price }]
  mileage: Number
  nextServiceMileage: Number
  laborCost: Number
  price: Number
  commissionRate: Number
  status: 'active'|'completed'
  paymentStatus: 'paid'|'partial'|'unpaid'
  amountPaid, amountDue: Number
  dueDate: Date
  isArchived: Boolean
}
```

### 4.9 Service (Umumiy Xizmat — Work Session)

```
Service {
  tenant: ObjectId → Tenant
  publicUuid: String (UUID)
  vehicle: ObjectId → Vehicle
  customer: ObjectId → Customer
  services: [{
    serviceName: String
    items: [{ itemName, itemType, inventoryId, quantity, unitPrice, totalPrice }]
    laborCost: Number
    employees: [ObjectId → Employee]
    employeeCommissions: [...]
    totalPrice: Number
  }]
  mileage: Number
  notes: String
  status: 'active'|'completed'
  totalPrice: Number
  paymentStatus: 'paid'|'partial'|'unpaid'
  amountPaid, amountDue: Number
  dueDate: Date
  isArchived: Boolean
}
```

### 4.10 OilProduct (Moy Mahsuloti)

```
OilProduct {
  tenant: ObjectId → Tenant
  brand: ObjectId → OilBrand
  viscosity: String (masalan: 10W-40)
  apiGrade: String (masalan: SN, SP)
  volume: Number (litr)
  costPrice: Number
  costCurrency: 'USD'|'UZS'
  exchangeRateUsed: Number
  price: Number (sotish narxi, UZS)
  stock: Number
  reorderLevel: Number
  active: Boolean
}
```

### 4.11 Filter (Filtr)

```
Filter {
  tenant: ObjectId → Tenant
  brandName: String
  filterType: enum['oil_filter','air_filter','cabin_filter','fuel_filter']
  partNumber: String
  quality: String
  compatibleVehicles: [String]
  costPrice: Number
  costCurrency: 'USD'|'UZS'
  exchangeRateUsed: Number
  price: Number (UZS)
  stock: Number
  reorderLevel: Number
  active: Boolean
}
```

### 4.12 Inventory (Ombor — Umumiy Mahsulotlar)

```
Inventory {
  tenant: ObjectId → Tenant
  productType: enum['oil','filter','other']
  name: String
  stock: Number
  reorderLevel: Number
  costPrice: Number
  costCurrency: 'USD'|'UZS'
  price: Number
}
```

### 4.13 Payment (To'lov)

```
Payment {
  tenant: ObjectId → Tenant
  customer: ObjectId → Customer
  oilChange: ObjectId → OilChange (yoki)
  service: ObjectId → Service
  serviceType: 'oilChange'|'service'
  amount: Number
  paymentDate: Date
  paymentMethod: enum['cash','card','transfer','check','other']
  notes: String
  recordedBy: ObjectId → User
}
```

### 4.14 Settings (Sozlamalar)

```
Settings {
  tenant: ObjectId → Tenant (unique — 1 ta tenant, 1 ta sozlama)
  defaultOilType: String
  serviceIntervalKm: Number (default: 5000)
  serviceIntervalMonths: Number (default: 6)
  lowStockThreshold: Number
  currency: String
  exchangeRate: Number (default: 12500)
  employeeCommissionRate: Number (default: 30%)
}
```

### 4.15 Archive (Arxiv)

```
Archive {
  tenant: ObjectId → Tenant
  entityType: 'Vehicle'|'OilChange'|'Service'
  entityId: ObjectId
  action: 'created'|'updated'|'archived'
  changes: [{ field, oldValue, newValue }]
  snapshot: Mixed (to'liq nusxa)
  performedBy: ObjectId → User
  performedAt: Date
  reason: String
}
```

---

## 5. Ma'lumotlar Bazasi Munosabatlari (ER Diagramma)

```
Tenant ──┬── User (1:N)
         ├── Role (1:N)
         ├── Employee (1:N)
         ├── Customer (1:N)
         ├── Vehicle (1:N)
         ├── OilChange (1:N)
         ├── Service (1:N)
         ├── OilProduct (1:N)
         ├── OilBrand (1:N)
         ├── Filter (1:N)
         ├── FilterBrand (1:N)
         ├── Inventory (1:N)
         ├── Payment (1:N)
         ├── Settings (1:1)
         └── Archive (1:N)

Customer ──── Vehicle (1:N)
Vehicle  ──── OilChange (1:N)
Vehicle  ──── Service (1:N)
Employee ──── OilChange (N:M, commissions orqali)
OilBrand ──── OilProduct (1:N)
OilChange ─── Payment (1:N)
Service   ─── Payment (1:N)
User      ─── Session (1:N)
User      ─── Role (N:1, assignedRole)
```

---

## 6. API Endpointlar

Barcha endpointlar `/api/v1/` prefiksi bilan boshlanadi.

| Modul | Endpoint | Tavsif |
|---|---|---|
| **Auth** | POST /auth/register | Ro'yxatdan o'tish |
| | POST /auth/login | Kirish (HttpOnly cookie) |
| | POST /auth/refresh | Token yangilash |
| | POST /auth/logout | Chiqish |
| | GET /auth/profile | Profil ma'lumotlari |
| **Vehicles** | GET/POST /vehicles | Avtomobillar |
| | GET /vehicles/search/:plate | Raqam bo'yicha qidirish |
| | GET /vehicles/:id/unified-history | Xizmat tarixi |
| **Oil Changes** | GET/POST /oil-changes | Moy almashtirish |
| | GET /oil-changes/today-count | Bugungi hisobot |
| | GET /oil-changes/monthly-revenue | Oylik daromad |
| **Services** | GET/POST /services | Umumiy xizmatlar |
| **Employees** | GET/POST /employees | Xodimlar |
| | GET /employees/debt/total | Komissiya qarzi |
| **Payments** | GET/POST /payments | To'lovlar |
| | GET /payments/overdue | Muddati o'tgan |
| **Inventory** | GET/POST /inventory | Ombor |
| | GET /inventory/low-stock | Kam qolgan mahsulotlar |
| **Oil Products** | CRUD /oil-products | Moy mahsulotlari |
| **Oil Brands** | CRUD /oil-brands | Moy brendlari |
| **Filters** | CRUD /filters | Filtrlar |
| **Filter Brands** | CRUD /filter-brands | Filtr brendlari |
| **Roles** | CRUD /roles | Rollar va ruxsatlar |
| **Tenant Users** | CRUD /tenant-users | Foydalanuvchilar |
| **Settings** | GET/PUT /settings | Sozlamalar |
| **Archives** | GET /archives | Arxiv tarixi |
| **Employee Payments** | CRUD /employee-payments | Xodim to'lovlari |
| **Public** | GET /public/service/:uuid | Ochiq xizmat sahifasi (autentifikatsiyasiz) |

---

## 7. Xavfsizlik Tizimi

### Autentifikatsiya

- **Access Token**: JWT, qisqa muddatli (Authorization header)
- **Refresh Token**: JWT, uzun muddatli, HttpOnly cookie sifatida saqlanadi
- **Session**: Har bir kirish uchun alohida sessiya yaratiladi, IP va User-Agent saqlanadi
- **Parol**: bcrypt, 12 ta salt round

### Avtorizatsiya (RBAC)

Uch darajali rol tizimi:
1. `employee` — asosiy xodim
2. `admin` — boshqaruvchi
3. `super_admin` — to'liq huquq

Bundan tashqari, **granular ruxsatlar** tizimi (50+ ta ruxsat kaliti):
- `dashboard.view`, `service.edit`, `payments.view`, `roles.manage` va boshqalar
- UI darajasida ham ruxsatlar: `ui.dashboard.stats_kpis`, `ui.inventory.tab_oil` va h.k.

### Himoya Choralari

- Rate limiting: auth yo'llarida 5 urinish / 15 daqiqa
- Helmet: XSS, CSRF, Clickjacking himoyasi
- CORS: faqat ruxsat etilgan originlar
- Input validatsiya: barcha yo'llarda express-validator

---

## 8. Funksional Imkoniyatlar

### 8.1 Bosh Sahifa (Dashboard)

- Bugungi xizmatlar soni
- Jami avtomobillar soni
- Oylik daromad
- Kam qolgan mahsulotlar ogohlantirishi
- Mijozlar qarzi (jami va muddati o'tgan)
- Xodimlarga to'lanmagan komissiya
- Faol (tugallanmagan) xizmatlar ro'yxati
- Daromad va xizmatlar grafigi (BarChart, LineChart)
- Moy turlari taqsimoti (PieChart)

### 8.2 Moy Almashtirish Xizmati

- Avtomobil raqami bo'yicha qidirish
- Yangi moy almashtirish yozuvi yaratish
- Ishlatilgan moy mahsuloti va miqdori
- 4 turdagi filtr (moy, havo, salon, yoqilg'i) — ombordan yoki mijoz o'zi keltirgan
- Qo'shimcha mahsulotlar (ombordan yoki qo'lda kiritish)
- Probeg va keyingi xizmat probegi
- Mehnat haqi (labor cost)
- Xodimlar tayinlash va komissiya hisoblash
- To'lov holati kuzatuvi (to'langan / qisman / to'lanmagan)
- Muddati belgilash

### 8.3 Umumiy Xizmatlar (General Services)

- Bir sessiyada bir nechta xizmat turi
- Har bir xizmat uchun alohida xodimlar va komissiya
- Inventardan mahsulot tanlash yoki qo'lda kiritish
- Mehnat haqi va umumiy narx avtomatik hisoblash

### 8.4 Xodimlar Boshqaruvi

- Xodim qo'shish, tahrirlash, arxivlash
- Komissiya stavkasi belgilash
- Xodim bo'yicha komissiya hisoboti
- To'lanmagan komissiyalar kuzatuvi

### 8.5 Ombor Boshqaruvi

- Moy mahsulotlari (brend, qovushqoqlik, API daraja, hajm)
- Filtrlar (4 tur, part number, mos avtomobillar)
- Umumiy mahsulotlar
- Minimal qoldiq ogohlantirishi
- USD/UZS valyuta konvertatsiyasi (kurs bilan)

### 8.6 To'lovlar Tizimi

- Naqd, karta, o'tkazma, chek, boshqa usullar
- Qisman to'lov imkoniyati
- Muddati o'tgan to'lovlar hisoboti
- Mijoz bo'yicha to'lov tarixi

### 8.7 QR Kod va Ochiq Sahifa

- Har bir moy almashtirish/xizmat uchun noyob UUID
- Mijoz QR kodni skanerlaydi → autentifikatsiyasiz ochiq sahifa
- Sahifada: avtomobil ma'lumotlari, xizmat sanasi, probeg, keyingi xizmat, moy va filtr ma'lumotlari

### 8.8 Kiosk Rejimi

- To'liq ekran rejimi (xizmat markazidagi monitor uchun)
- Avtomobil raqami kiritilganda avtomatik qidirish
- Yangi mijoz yoki mavjud mijoz ko'rsatiladi
- Xizmat ma'lumotlari katta shrift bilan ko'rsatiladi (devor ekrani uchun)

### 8.9 Arxiv Tizimi

- Barcha o'zgarishlar tarixi saqlanadi
- Arxivlangan avtomobillar, moy almashtirishlar, xizmatlar
- Kim, qachon, nima o'zgartirganini kuzatish

### 8.10 Rollar va Ruxsatlar

- Yangi rollar yaratish
- 50+ granular ruxsatlarni rolga biriktirish
- Foydalanuvchiga rol tayinlash
- UI elementlari ham ruxsatlar bilan boshqariladi

### 8.11 Sozlamalar

- Kompaniya ma'lumotlari
- Valyuta va valyuta kursi
- Standart moy turi va xizmat intervali
- Minimal ombor chegarasi
- Standart komissiya stavkasi
- Obuna rejimi (Free / Premium / Enterprise)

### 8.12 Sessiyalar Boshqaruvi

- Faol sessiyalar ro'yxati
- Sessiyani bekor qilish imkoniyati
- IP va qurilma ma'lumotlari

---

## 9. Frontend Sahifalar Tuzilmasi

```
/login                    — Kirish
/register                 — Ro'yxatdan o'tish
/dashboard                — Bosh sahifa (statistika, grafiklar)
/dashboard/oil-changes    — Moy almashtirish ro'yxati
/dashboard/service        — Umumiy xizmatlar
/dashboard/service/add    — Yangi xizmat qo'shish
/dashboard/service/[id]   — Avtomobil xizmat sahifasi
/dashboard/employees      — Xodimlar
/dashboard/employees/[id] — Xodim profili
/dashboard/inventory      — Ombor
/dashboard/filters        — Filtrlar
/dashboard/filter-brands  — Filtr brendlari
/dashboard/roles          — Rollar
/dashboard/tenant-users   — Foydalanuvchilar
/dashboard/sessions       — Sessiyalar
/dashboard/settings       — Sozlamalar
/dashboard/archives       — Arxiv
/kiosk                    — Kiosk rejimi
/public/service/[uuid]    — Ochiq xizmat sahifasi (QR)
```

---

## 10. Loyihaning Asosiy Afzalliklari

1. **Multi-tenancy** — bitta platforma, ko'p kompaniya
2. **Granular ruxsatlar** — har bir UI elementi va API yo'li uchun alohida ruxsat
3. **QR kod integratsiyasi** — mijoz o'z xizmat ma'lumotlarini ko'rishi
4. **Kiosk rejimi** — xizmat markazidagi ekran uchun maxsus interfeys
5. **Valyuta konvertatsiyasi** — USD/UZS, real vaqt kursi bilan
6. **Komissiya tizimi** — xodimlar uchun avtomatik komissiya hisoblash
7. **Arxivlash** — barcha o'zgarishlar tarixi
8. **Qarz kuzatuvi** — mijozlar va xodimlar bo'yicha
