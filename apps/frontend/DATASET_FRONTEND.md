# Kontribusi dataset

Frontend memakai workspace, login Google/Supabase, dan navigasi aplikasi yang sama.

- /contributions/new: rekam, tinjau, beri persetujuan, lalu kirim video.
- /contributions: Koleksi Saya, pencarian/filter, status dan alasan penolakan.
- /contributions/{id}: detail dan video privat.
- /curator: panel peninjauan bagi akun dengan role kurator.
- /admin/curators dan /contributions/review: pengalihan ke panel kurator.
- Prefix /en/ menyediakan bahasa Inggris.

## Production

Tetapkan environment Vercel sebelum build:

~~~dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-key
NEXT_PUBLIC_DATASET_API_URL=https://your-dataset-api.example.com
NEXT_PUBLIC_DATASET_LOCAL=false
NEXT_PUBLIC_DATASET_CONSENT_VERSION=
NEXT_PUBLIC_DATASET_CONSENT_TEXT=
~~~

Gunakan project Supabase production existing dan URL backend yang sudah online.
Isi consent dengan versi/teks yang disetujui sebelum menerima kontribusi.
Seluruh NEXT_PUBLIC_* terbuka di browser; server secret, service-role dan JWT
secret hanya boleh berada di environment backend.

URL API dan Supabase harus berupa origin HTTPS tanpa path, query, atau kredensial.
Backend harus mengizinkan origin frontend pada DATASET_ALLOWED_ORIGINS.
JWT sesi pengguna dikirim ke backend dan diverifikasi lagi melalui Supabase.
Login password development tidak tersedia pada build production.

Setelah mengubah environment publik, rebuild/redeploy frontend.
Langkah infrastruktur ada di [deployment.md](../../docs/deployment.md#dataset-production).

## Video dan akses

Perekaman menggunakan kamera tanpa audio, countdown 3 detik, dan durasi 3-7 detik.
Backend memeriksa file melalui dekode penuh; ukuran, resolusi, MIME dan policy
tetap ditentukan server. Status awal PENDING, bukan persetujuan otomatis.
Katalog kontribusi terpisah dari indeks kelas model pengenalan.

Pemutaran mengambil Blob melalui API dengan JWT; RLS membatasi pemilik/kurator.
Realtime memberi sinyal untuk mengambil ulang data yang sudah diotorisasi.
Tidak ada video privat atau key server yang dimasukkan ke bundle frontend.

Akses kurator: [panduan Supabase](../../docs/Akses_Kurator_Supabase.md).

## Development dan tes

Mode lokal hanya aktif bila NEXT_PUBLIC_DATASET_LOCAL=true dan URL API/Auth
berupa http://127.0.0.1:<port>; mode itu ditolak dalam build production.
Skrip tests/e2e/*.local.mjs hanya alat pengujian, bukan langkah deployment.

~~~bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
~~~
