# Undangan Alpian & Damay — Ucapan & Doa via JSON

Bagian "Beri Doa & Ucapan Terbaikmu" sudah tidak lagi mengirim ke
`https://invitation.tigadara.com/wp-comments-post.php`. Sekarang form itu
dikirim ke server Node.js sendiri, dan semua ucapan disimpan di:

```
data/comments.json
```

## Cara menjalankan

```bash
npm install
npm start
```

Lalu buka `http://localhost:3000`.

## Cara kerja

- `server.js` menjalankan server Express yang:
  - Menyajikan file di `public/` (termasuk `public/index.html`, undangannya).
  - `GET /api/comments` → membaca `data/comments.json` dan mengembalikannya
    sebagai JSON (terbaru di atas).
  - `POST /api/comments` → menerima `{ author, comment, konfirmasi }`,
    memvalidasi, lalu menambahkannya ke `data/comments.json`.
- Di `public/index.html`, script tambahan di bagian "Beri Doa & Ucapan
  Terbaikmu":
  - Mengganti form lama supaya event submit bawaan plugin WeddingPress
    (yang tadinya mengarah ke `wp-comments-post.php`) tidak terpasang lagi.
  - Saat form disubmit, data dikirim lewat `fetch()` ke `POST /api/comments`.
  - Saat halaman dibuka / setelah kirim ucapan baru, daftar ucapan diambil
    lewat `GET /api/comments` dan dirender ke dalam `<ul id="wdp-container-comment-5855">`.
  - Jumlah "Ucapan" di link pembuka otomatis diperbarui sesuai jumlah data.

## Format satu entri di `comments.json`

```json
{
  "id": "m1abcxyz12",
  "author": "Nama Tamu",
  "comment": "Selamat menempuh hidup baru!",
  "konfirmasi": "Hadir",
  "date": "2026-09-03T10:00:00.000Z"
}
```

## Deploy

Karena ini server Node.js (bukan file statis murni), deploy ke platform yang
menjalankan proses Node terus-menerus (VPS, Railway, Render, Fly.io, dsb).
Kalau pakai Vercel, `data/comments.json` di filesystem serverless bersifat
sementara (hilang tiap deploy/berpindah instance) — untuk itu sebaiknya pakai
VPS biasa, atau pindahkan penyimpanan ke database/KV store kalau memang harus
di platform serverless.

## Moderasi manual (opsional)

Untuk hapus satu ucapan (misalnya spam), kirim:

```
DELETE /api/comments/<id>
```

`id` bisa dilihat dari isi `data/comments.json`.
