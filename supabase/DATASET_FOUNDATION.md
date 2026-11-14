# Fondasi database dataset Signify AI

Lingkup tahap ini: skema, integritas relasi, otorisasi, RLS, bucket privat, dan
pengujian SQL. Belum ada endpoint FastAPI, UI, decoding video, worker, atau ZIP.
Migration baru belum diterapkan ke database remote maupun database persisten lokal.

## Identitas dan kontrak integrasi

Identitas tetap public.profiles(user_id) -> auth.users(id). Tidak ada tabel users baru.

| Entitas | Tanggung jawab dan relasi |
| --- | --- |
| dataset_labels | Katalog label dataset dengan ID stabil. Tidak sama dengan urutan kelas model aktif. |
| dataset_contributions | Pemilik, label usulan/final, metadata media, consent, policy video, status, revisi, soft delete, dan review terkini. |
| dataset_curation_reviews | Riwayat keputusan append-only, peninjau, label/alasan, waktu, dan revisi kontribusi. |
| dataset_notifications | Inbox pemilik; FK memastikan penerima sesuai pemilik kontribusi atau pemohon ekspor. |
| dataset_exports | Metadata proses ekspor dan pemohon. Belum menghasilkan arsip. |
| dataset_export_items | Keanggotaan batch dan snapshot sumber, label final, review, hash, consent, dan metadata. |

Dua tabel pendukung diperlukan untuk ketentuan tahap ini:

- public.dataset_video_policies: konfigurasi teknis berversi tanpa batas final bawaan.
- private.dataset_curator_grants: penugasan kurator eksplisit, terpisah dari role admin.

recognition_event_id bertipe UUID dan nullable, tanpa FK ke tabel temporal yang
belum ada. Nilai NULL mendukung kontribusi mandiri. Nilai non-NULL hanya merupakan
referensi konteks: belum menjadi bukti bahwa peristiwa ada atau dimiliki pemohon.
API integrasi mendatang harus memeriksa konteks tersebut setelah kontrak dengan
Meiske disepakati. Tidak ada prediksi yang otomatis menjadi final_label_id.
Tidak ada daftar 40 label atau akun kurator yang ditebak/di-seed.

## Otorisasi dan RLS

| Pelaku | Hak normal |
| --- | --- |
| anon | Tidak mempunyai akses tabel dataset, RPC kurasi, atau objek bucket dataset. |
| User | Membaca kontribusi aktif dan review miliknya, membaca inbox sendiri, mengubah read_at, serta soft delete melalui RPC pemilik. |
| Admin teknis tanpa penugasan | Hak pemilik seperti user; tidak memperoleh antrean lintas pengguna atau hak kurasi. |
| Admin dengan penugasan aktif | Membaca antrean/video aktif dan audit; memutuskan kurasi melalui RPC dengan pemeriksaan revisi. |
| Backend tepercaya/service_role | Ingestion metadata, katalog/policy, metadata ekspor, snapshot item, dan notifikasi sesuai GRANT. Tidak memperoleh UPDATE status kontribusi atau UPDATE/DELETE audit. |
| Operator database tepercaya | Menetapkan/mencabut penugasan kurator dan menyiapkan versi policy berdasarkan keputusan pilot. |

Kurator harus sekaligus memiliki profiles.role = 'admin' dan penugasan yang belum
dicabut pada private.dataset_curator_grants. Mendukung banyak akun tanpa ID akun
yang di-hardcode. Penugasan adalah izin sistem, bukan sertifikasi kemampuan
BISINDO. Penentuan reviewer yang kompeten tetap tanggung jawab manusia.

Tabel private tidak diekspos sebagai schema API. Tidak ada RPC untuk mengangkat
role atau mengangkat diri sendiri sebagai kurator. Penugasan melalui operator atau
layanan tepercaya mencatat granted_by, qualification_note, granted_at, revoked_at.
Tidak ada penugasan otomatis pada migration.

Pembuatan kontribusi dibatasi ke backend tepercaya. Browser tidak boleh melewati
validasi teknis dengan INSERT metadata langsung. Untuk tahap API berikutnya,
backend harus mengambil user_id dari sesi tervalidasi, bukan mempercayai body.
Service key harus tetap di server; service_role merupakan batas kepercayaan dan
dapat melewati RLS. GRANT sempit tidak menggantikan otorisasi pada layanan server.

## Keputusan dan penghapusan

- Kontribusi baru wajib PENDING, tanpa label final/review, revision = 1, deleted_at NULL.
- APPROVED wajib label final aktif yang dipilih kurator.
- REJECTED wajib alasan nonkosong dan tidak mempunyai label final.
- FK komposit mengikat review terkini ke kontribusi, status, dan label final yang sama.
- dataset_review_contribution mengunci baris, memeriksa p_expected_revision,
  menyimpan review, memperbarui status, dan membuat notifikasi secara atomik.
- Review ulang memerlukan revisi terkini dan menambahkan audit baru.
- Konflik revisi mengembalikan SQLSTATE 40001. API mendatang harus menampilkan
  konflik dan meminta pembacaan data terbaru; jangan otomatis menimpa keputusan.
- dataset_soft_delete_contribution hanya untuk pemilik, idempoten setelah terhapus,
  menaikkan revisi, dan tidak mengubah keputusan kurasi.
- Audit review dan snapshot item tidak dapat diubah/dihapus melalui hak aplikasi.
- Public RPC memakai SECURITY INVOKER; fungsi istimewa ada di private dengan
  search_path kosong dan pemeriksaan identitas/hak eksplisit.

deleted_at menutup koleksi aktif, antrean, pembacaan video, dan keanggotaan ekspor
baru. Soft delete belum menghapus byte storage. Retensi, pembersihan objek,
anonimisasi akun, serta penanganan arsip yang pernah diunduh perlu kebijakan tahap
berikutnya. FK identitas/audit memakai RESTRICT untuk menjaga keterlacakan;
penghapusan akun dengan kontribusi/audit memerlukan alur retensi/anonimisasi yang
disepakati, bukan cascade yang menghapus jejak keputusan.

## Konfigurasi video

Tidak ada seed durasi, resolusi, ukuran maksimum, atau whitelist MIME final.
Policy draft boleh berisi NULL. Policy aktif wajib lengkap, memiliki approved_at,
dan hanya satu versi boleh aktif. Batas positif/urutan min-max diperiksa database.

Setelah pilot, operator menyiapkan versi dengan min_duration_ms, max_duration_ms,
min_short_side_px, max_long_side_px, max_size_bytes, dan allowed_mime_types.
Backend/antarmuka mendatang membaca versi aktif yang sama. Setiap kontribusi
menyimpan video_policy_id untuk keterlacakan. Buat versi baru ketika parameter
berubah; hak backend biasa hanya mengubah is_active, bukan isi versi lama.

Tanpa policy aktif, ingestion gagal tertutup. Trigger memeriksa metadata terhadap
policy. Backend mendatang tetap wajib melakukan decoding, memeriksa container dan
isi media, serta menghitung metadata/hash sendiri. Database tidak memeriksa piksel.

## Storage dan ekspor

Bucket migration:

- dataset-contribution-videos, privat, path: user_uuid/contribution_uuid/video.
- dataset-export-archives, privat, path: requester_uuid/export_uuid/archive.zip.

Tidak ada public URL video. Bucket tanpa limit media final pada tahap ini;
pembatasan ingestion dilakukan melalui konfigurasi dan backend mendatang.
Client tidak memperoleh INSERT/UPDATE/DELETE langsung. Restrictive policies menjaga
kedua bucket meskipun ada permissive policy luas untuk fitur lain. Bucket lain
tidak diubah haknya. Nama bucket yang sudah public menyebabkan migration gagal,
bukan diam-diam diubah.

Pemilik dan kurator berwenang dapat membaca video aktif yang sudah diregistrasi.
Path yang hanya menyerupai folder pemilik tanpa baris kontribusi tidak cukup.
Arsip hanya dapat dibaca pemohon yang masih menjadi kurator berwenang, dengan
processing_state READY, jumlah item sesuai, dan sumber yang belum dihapus atau
di-review ulang. Signed URL yang sudah diterbitkan dapat tetap berlaku sampai
kedaluwarsa; API mendatang harus memeriksa izin dan memberi TTL pendek.

processing_state ekspor (QUEUED/PROCESSING/READY/FAILED) adalah status pekerjaan,
terpisah dari status kurasi PENDING/APPROVED/REJECTED. Pemohon ekspor harus admin
yang ditugaskan, dan record baru mulai QUEUED tanpa artefak.
INSERT export_items hanya menerima sumber aktif APPROVED. Trigger mengunci baris
dan mengisi snapshot dari database; label/metadata palsu dari pemanggil tidak dipakai.
Satu kontribusi hanya sekali per batch, tetapi dapat masuk beberapa versi batch.

Belum ada pengemasan ZIP, penghitungan agregat otomatis, transisi worker, notifikasi
penyelesaian ekspor otomatis, atau batas batch final. Layanan ekspor berikutnya
harus memeriksa ulang keanggotaan/consent, ukuran/jumlah, file/hash, dan status sebelum
menandai READY dan sebelum menerbitkan unduhan.

## Pengujian lokal yang aman

Pola pgTAP mengikuti suite existing: transaksi BEGIN, fixture akun/role, pergantian
role authenticated/anon/service_role, assertion SQL, finish(), lalu ROLLBACK.

Tidak tersedia PostgreSQL, Supabase CLI, atau Docker lokal saat implementasi.
Pengujian yang dijalankan menggunakan PostgreSQL in-memory melalui
[PGlite](https://pglite.dev/docs/filesystems) dan
[ekstensi pgTAP](https://pglite.dev/extensions/#pgtap).
Dependensi diletakkan di folder sementara, bukan package.json aplikasi.

Harness: tests/support/run-dataset-isolated.cjs. Harness tidak membaca .env,
tidak menerima database URL, tidak membuka koneksi remote, dan tidak menjalankan
database reset. Semua migration direplay hanya di memori, lalu kedua suite
production_data_sync.test.sql dan dataset_foundation.test.sql dijalankan.

Contoh dari root repository, dengan dependensi pada direktori sementara:

~~~powershell
rtk proxy npm install --prefix '<temporary-prefix>' --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.13 @electric-sql/pglite-pgtap@0.0.14
rtk proxy node supabase/tests/support/run-dataset-isolated.cjs '<temporary-prefix>'
~~~

Batas pengujian: harness memakai fixture schema auth/storage dan role Supabase,
bukan stack Supabase lengkap. PostgreSQL yang diuji adalah 18.6 (WASM), sedangkan
config repository menetapkan PostgreSQL 15. Perlu verifikasi lanjutan pada Supabase
lokal lengkap yang terisolasi untuk kompatibilitas versi, PostgREST, Auth nyata,
Storage HTTP, dan signed URL. Tes revisi menguji penolakan request stale secara
berurutan; belum merupakan pengujian dua koneksi PostgreSQL bersamaan.

Jangan menjalankan reset, db push, atau migration ke project linked/remote untuk
memakai suite ini. Penyediaan Supabase lokal lengkap dan penerapan migration
persisten harus dipisahkan dari harness in-memory ini.
