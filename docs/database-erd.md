# Database ERD Implementation (Phase 1)

Dokumen ini menjelaskan implementasi awal skema relasional Signify AI.

## Tujuan

- Memindahkan data penting dari penyimpanan lokal browser ke database.
- Menyediakan fondasi untuk history lintas device, analytics, dan audit model.
- Menjaga isolasi data pengguna dengan Row Level Security (RLS).

## Lokasi Migration

- `supabase/migrations/20260422090000_init_signify_erd.sql`

## Entitas yang Dibuat

- `profiles`
- `model_versions`
- `letters`
- `translation_sessions`
- `translation_entries`
- `practice_attempts`
- `user_preferences`
- view `practice_letter_stats`

## Catatan Desain

- `profiles.user_id` mereferensikan `auth.users.id` (Supabase Auth).
- `letters` di-seed otomatis untuk A-Z.
- `translation_entries` mempertahankan urutan commit melalui `sequence_no`.
- `model_versions` memiliki partial unique index agar hanya 1 versi aktif per nama model.

## Security

- Semua tabel utama mengaktifkan RLS.
- Data user hanya dapat diakses user pemilik (`auth.uid() = user_id`).
- `letters` dan `model_versions` dapat dibaca umum (read-only policy).

## Cara Menjalankan Migration

Jalankan dari root repository:

```bash
MIGRATION_CMD="supabase db push" bash scripts/migrate-db.sh
```

Jika Anda belum login Supabase CLI:

```bash
supabase login
supabase link --project-ref <your-project-ref>
MIGRATION_CMD="supabase db push" bash scripts/migrate-db.sh
```

## Langkah Lanjutan yang Disarankan

- Tambahkan API write/read untuk `translation_sessions` dan `translation_entries`.
- Pindahkan `apps/frontend/lib/userData.ts` dari localStorage ke Supabase table.
- Tambahkan service role flow untuk sinkronisasi `model_versions` saat deploy model baru.
