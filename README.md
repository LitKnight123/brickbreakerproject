# 🧱 Brick Breaker Pro

Game Brick Breaker klasik dengan fitur modern, leaderboard, dan panel admin. Dibangun dengan Next.js, React, Tailwind CSS, dan SQLite.

## ✨ Fitur

### 🎮 Gameplay
- Brick Breaker klasik dengan controls keyboard (← →) dan mouse
- Sistem level dengan brick yang semakin sulit
- Power-up: **Multi Ball** dan **Explosive**
- Efek partikel dan animasi yang menarik
- Pause/Resume permainan

### 👤 User
- Registrasi dan Login
- Dashboard dengan statistik pribadi dan global
- **Ubah Username** dan **Ubah Password**
- Papan Skor (Leaderboard)
- Tracking waktu bermain per sesi

### 🛡️ Admin
- Panel Admin khusus untuk mengelola pengguna
- **Ubah Username** dan **Password** pengguna lain
- **Ubah Role** (User ↔ Admin)
- **Hapus Pengguna**
- Grafik visualisasi: waktu bermain, sesi, skor, distribusi role
- Detail waktu bermain per user

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 3. Build untuk Production

```bash
npm run build
npm start
```

---

## 🔐 Login Admin

### Cara Membuat Akun Admin

Setelah server berjalan, buka browser dan akses endpoint berikut untuk membuat akun admin default:

```
POST http://localhost:3000/api/admin/seed
```

Bisa menggunakan curl:

```bash
curl -X POST http://localhost:3000/api/admin/seed
```

Atau buka browser → Developer Tools (F12) → Console, lalu jalankan:

```javascript
fetch('/api/admin/seed', { method: 'POST' }).then(r => r.json()).then(console.log)
```

### Login sebagai Admin

| Field    | Value      |
|----------|------------|
| Username | `admin` |
| Password | `admin` |

> ⚠️ **Penting:** Ganti password admin setelah login pertama kali untuk keamanan!

### Akses Panel Admin

Setelah login sebagai admin:
1. Klik **Profil Saya** di dashboard
2. Klik tombol **Panel Admin** (hanya muncul untuk role admin)
3. Atau langsung akses: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📁 Struktur Project

```
src/
├── app/
│   ├── admin/           → Panel Admin
│   ├── api/
│   │   ├── admin/       → API Admin (CRUD users)
│   │   ├── auth/        → Login, Register, Logout
│   │   ├── playtime/    → Tracking waktu bermain
│   │   ├── scores/      → Skor & leaderboard
│   │   └── user/        → Profil user
│   ├── dashboard/       → Dashboard user
│   ├── game/            → Halaman permainan
│   ├── leaderboard/     → Papan skor
│   ├── login/           → Login
│   └── register/        → Registrasi
├── lib/
│   ├── auth.ts          → Fungsi autentikasi & admin
│   ├── db.ts            → Database SQLite
│   ├── game.ts          → Logic permainan
│   └── leaderboard.ts   → Fungsi skor & statistik
└── middleware.ts         → Proteksi route & role check
```

## 🛠 Tech Stack

- **Framework:** Next.js 16
- **UI:** React 19, Tailwind CSS 4
- **Database:** SQLite (better-sqlite3)
- **Auth:** bcryptjs, cookies (httpOnly)
- **Language:** TypeScript
