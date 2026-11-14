# Dataset API

API FastAPI terpisah dari inferensi model; tidak mengimpor YOLO/Torch.
Frontend production tetap di Vercel dan database/Auth/Storage di Supabase hosted.
Panduan deployment: [deployment.md](../../docs/deployment.md#dataset-production).

## Production

Gunakan Python 3.11, Linux, FFmpeg/FFprobe 6 atau lebih baru, dan prlimit.
Install requirements-dataset.txt, isi environment sesuai
.env.dataset.production.example, lalu jalankan dari apps/backend:

~~~bash
python scripts/start_dataset.py
~~~

PORT mengikuti hosting. Tambahkan --check untuk memeriksa konfigurasi, tool media,
dan akses tulis volume tanpa menghubungi Supabase.

Production memakai DATASET_ENVIRONMENT=production, URL Supabase HTTPS dan
daftar origin frontend HTTPS eksplisit. File .env.dataset.local tidak dibaca.
Jalankan satu instance/proses dengan DATASET_WORK_DIR pada volume persisten.
Jurnal operasi dan secret idempotency harus bertahan saat redeploy.
Video asli disimpan di bucket privat Supabase, bukan di repository.

DATASET_ANON_KEY menerima publishable key/legacy anon;
DATASET_SERVICE_ROLE_KEY menerima server secret key/legacy service-role.
Key opaque dikirim melalui apikey; JWT pengguna melalui Authorization.
ES256/RS256 diverifikasi melalui JWKS dari project yang dikonfigurasi.
Untuk user JWT legacy HS256, isi DATASET_JWT_HS256_SECRET di backend.

## Endpoint

Semua endpoint /api/v1/ memerlukan JWT pengguna, selain preflight OPTIONS.
GET /health melaporkan proses API; tidak membuktikan kesiapan database.

| Endpoint | Kegunaan |
| --- | --- |
| GET /api/v1/dataset/access | Izin akun dan ketersediaan kurator |
| GET /api/v1/dataset/video-policy | Policy video aktif |
| GET /api/v1/dataset/labels | Katalog label aktif |
| POST /api/v1/contributions | Multipart file, metadata, dan Idempotency-Key |
| GET /api/v1/contributions | Koleksi pemilik dengan pencarian/pagination |
| GET /api/v1/contributions/summary | Ringkasan koleksi pemilik |
| GET /api/v1/contributions/{id} | Detail yang diizinkan RLS |
| GET /api/v1/contributions/{id}/video | Video privat/pratinjau browser |
| POST /api/v1/contributions/{id}/video-access | Signed URL kompatibilitas |
| GET /api/v1/dataset/review-info | Kesiapan dan target peninjauan |
| GET /api/v1/dataset/review-queue | Antrean kurator |
| GET /api/v1/dataset/review-summary | Ringkasan kurasi |
| POST /api/v1/dataset/reviews/{id} | Keputusan dengan expected revision |

Penugasan kurator memakai profiles.role = 'curator'; lihat
[panduan kurator](../../docs/Akses_Kurator_Supabase.md).
RPC pengelolaan grant lama dinonaktifkan oleh migrasi role kurator.

## Pengujian dan development

~~~bash
python -m pytest tests/dataset -q
~~~

Tes unit menggunakan HTTP mock dan video sintetis. Tes integrasi nyata bersifat
opt-in. Pengujian lokal boleh memakai .env.dataset.local.example atau
scripts/run_dataset_local.py; launcher itu tidak dipakai production.
Policy/consent pilot lokal tidak disalin otomatis ke production.

Referensi: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
dan [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys).
