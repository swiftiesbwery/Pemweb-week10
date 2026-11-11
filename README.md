# Pustaka — Daftar Bacaan

Aplikasi CRUD untuk mencatat buku bacaan.

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **ORM:** Prisma
- **Database:** PostgreSQL di Neon

## 1. Persiapan Neon

1. Buka [Neon Console](https://console.neon.tech/) dan login atau buat akun.
2. Buat project PostgreSQL baru.
3. Pada dashboard project, pilih **Connect**.
4. Salin connection string PostgreSQL. Pastikan opsi SSL aktif (`sslmode=require`).
5. Buat file `.env` di folder utama project (sejajar dengan `package.json`).
6. Isi `DATABASE_URL` dengan connection string milik project Neon. Jangan membagikan file `.env` atau memasukkannya ke GitHub.

Contoh format `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require"
PORT=3000
```

Gunakan URL yang diberikan Neon, bukan teks contoh di atas. Untuk aplikasi lokal, URL pooled maupun direct dapat digunakan. Simpan URL direct untuk menjalankan migrasi jika konfigurasi pooled mengalami kendala.

## 2. Instalasi dan setup database

Jalankan perintah berikut dari terminal di folder project:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

- `npm install`: memasang dependency.
- `prisma generate`: membuat Prisma Client.
- `prisma migrate dev`: membuat tabel `books` di database Neon.
- `db:seed`: memasukkan data awal dari `data/books.json` jika database masih kosong.

> ZIP ini sudah menyertakan migration awal. Jika migration tersebut sudah diterapkan, Prisma akan mengenalinya dan tidak membuat tabel duplikat.

## 3. Menjalankan aplikasi

```bash
npm start
```

Buka http://localhost:3000.

## 4. Prisma Studio

Untuk melihat dan mengelola isi tabel database melalui antarmuka browser:

```bash
npx prisma studio
```

## API Endpoints

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/books` | Menampilkan seluruh buku |
| POST | `/api/books` | Menambahkan buku |
| PUT | `/api/books/:id` | Mengubah data buku |
| DELETE | `/api/books/:id` | Menghapus buku |

## Struktur penting

```text
.
├── data/books.json              # Data awal untuk seed
├── prisma/
│   ├── migrations/              # Riwayat struktur database
│   ├── schema.prisma            # Model Prisma
│   └── seed.js                  # Memasukkan data awal
├── public/                      # Frontend
├── .env.example                 # Contoh konfigurasi environment
├── server.js                    # Express API + Prisma Client
└── package.json
```

## Catatan keamanan

- Jangan commit `.env` ke repository.
- Gunakan `.env.example` untuk membagikan format konfigurasi tanpa password.
- Jangan menaruh connection string Neon di frontend (`public/`).
