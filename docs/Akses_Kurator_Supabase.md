# Kurator melalui UUID Supabase

Mulai 12 November 2026, sumber izin kurator adalah `public.profiles.role = 'curator'`.
Panduan ini menggantikan alur pemberian grant melalui halaman admin sebelumnya.
Tidak ada batas satu akun: satu, dua, tiga, atau lebih akun dapat menjadi kurator.
Kurator dapat membuka antrean seluruh kontributor, video privat yang terdaftar,
ringkasan kontribusi, dan memberi keputusan serta label final. Akses ini tidak
memberikan akses infrastruktur Supabase, log server, atau ekspor khusus admin.

## Penerapan

Terapkan migrasi `20261112090000_curator_profile_role.sql` setelah migrasi sebelumnya.
Migrasi mempertahankan reviewer lama yang memiliki grant aktif dengan memindahkan
role profilnya ke `curator`. Tidak membuat akun atau memilih akun baru secara otomatis.
Grant lama disimpan untuk riwayat; setelah migrasi, role profil menjadi sumber izin.
RPC pengelolaan kurator lama dinonaktifkan. URL `/admin/curators` menuju `/curator`.

## Menambahkan akun Google

1. Login Google melalui SignifyAI sekali agar akun dan profil dibuat.
2. Salin User UID dari Supabase Authentication > Users.
3. Di SQL Editor, gunakan UUID yang benar (kolom profil bernama `user_id`, bukan `id`):

```sql
update public.profiles
set role = 'curator'
where user_id in (
  'UUID_AKUN_1'::uuid,
  'UUID_AKUN_2'::uuid,
  'UUID_AKUN_3'::uuid
)
returning user_id, display_name, role;
```

Sisakan hanya baris UUID akun yang ingin ditugaskan. Periksa hasil `returning`.
Muat ulang aplikasi: menu Panel kurasi video muncul dan `/curator` dapat dibuka.
Login Google ke tujuan default membuka panel kurator; tujuan eksplisit seperti
riwayat tetap dipertahankan. Akun baru lainnya tetap mendapat role `user`.

## Mencabut akses

```sql
update public.profiles set role = 'user'
where user_id = 'UUID_AKUN'::uuid
returning user_id, role;
```

Backend, RLS, Storage, dan RPC keputusan membaca role database. Perubahan berlaku
pada permintaan berikutnya tanpa menunggu JWT kedaluwarsa. URL video sementara
yang telah terbit dapat berlaku sampai kedaluwarsa. Profil dari browser hanya
bisa mengubah nama tampilan/avatar; role tidak dapat dipilih saat login atau lewat URL.
