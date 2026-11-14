# Draf pilot kontribusi dataset: development lokal

Status terkini: **aktif secara lokal setelah persetujuan eksplisit pengguna**.
Pengujian lokal menggunakan rekaman sintetis; laporan hasil eksekusi tidak disertakan dalam repository.
Manifest tetap immutable untuk menjaga hash persetujuan; status runtime berada
pada receipt/database, dan consent tetap draf khusus pengujian.
Dokumen ini tidak menetapkan standar video BISINDO, persetujuan penelitian,
kompetensi kurator, atau kelayakan semantik rekaman.

## Audit aktual, 3 November 2026

Schema dibaca dari PostgreSQL 15.19 lokal dan dicocokkan dengan migration existing.

dataset_video_policies berisi id, version, min_duration_ms, max_duration_ms,
min_short_side_px, max_long_side_px, max_size_bytes, allowed_mime_types,
is_active, created_by, created_at, approved_at. Parameter boleh kosong saat
inactive, tetapi constraint aktivasi mewajibkan semuanya lengkap dan approved_at
terisi. Index parsial mengizinkan hanya satu policy aktif. created_by wajib
mengacu profiles(user_id). Policy API memakai VideoPolicy yang mewajibkan
nilai positif, rentang konsisten, dan MIME tidak kosong.

dataset_labels berisi id, code, display_name, description, is_active, created_by,
created_at. code unik berbentuk slug; created_by mengacu profiles. API katalog
membaca label aktif dengan JWT pengguna. Script tidak membuat tabel identitas,
mengubah model temporal, atau menambahkan kelas model.

Frontend membaca NEXT_PUBLIC_DATASET_CONSENT_TEXT dan
NEXT_PUBLIC_DATASET_CONSENT_VERSION melalui getDatasetConsent(). Kedua nilai harus
ada; versi maksimal 100 karakter. Payload upload mengirim consent:true dan
consent_version. Backend ContributionInput memeriksa versi tidak kosong/maksimal
100 karakter dan menyimpannya pada contribution. Belum ada registry server yang
mengikat versi consent ke izin penelitian/pelatihan: jangan menganggap validasi
format sebagai persetujuan penggunaan data untuk pelatihan/ekspor.

Preflight memverifikasi project signify-supabase-local, network signify-local-only,
binding loopback, API 127.0.0.1:55431, DB host 55432, dua bucket privat, empat
migration identik, dan PostgreSQL 15.19. URL frontend dan anon key cocok dengan
container lokal. Launcher backend mengikat URL/kredensial dari stack yang sama;
health backend 8001 dan Next.js localhost:3000 tersedia.
Nilai key, JWT, password, dan secret tidak dicetak.

Kondisi setelah plan READ ONLY: policy aktif 0; lima code label usulan belum ada;
consent frontend masih kosong. FFmpeg/FFprobe belum tersedia; prlimit tersedia.

## Usulan v1, sementara

| Field | Nilai pilot | Alasan pengujian |
| --- | --- | --- |
| version | dev-local-pilot-v1 | Snapshot terpisah dari konfigurasi final |
| min_duration_ms | 1000 | Uji batas bawah dan klip yang terlalu singkat |
| max_duration_ms | 10000 | Ruang uji mulai/stop kata dan ungkapan; bukan durasi BISINDO tervalidasi |
| min_short_side_px | 240 | Mencakup uji kamera beresolusi rendah; bukan ambang keterbacaan isyarat |
| max_long_side_px | 1280 | Membatasi beban decoding lokal untuk pilot awal |
| max_size_bytes | 16777216 (16 MiB) | Anggaran transfer/penyimpanan uji, masih perlu ukuran aktual lintas perangkat |
| allowed_mime_types | video/webm, video/mp4 | Cocok dengan pilihan MediaRecorder dan container validator existing |

Audit Storage juga menemukan batas global lokal 50 MiB (52428800 byte). Bucket
video tidak memiliki override ukuran/MIME; usulan 16 MiB berada di bawah batas
global tersebut. Batas ini perlu diperiksa kembali sebelum aktivasi bila
konfigurasi Storage berubah.

FPS harus positif/terbaca dan codec harus dapat didekode penuh oleh backend,
mengikuti validator existing. Schema belum mempunyai batas FPS atau allowlist
codec per policy; tidak ditambahkan batas baru. Frontend meminta audio:false;
ini bukan constraint audio baru pada database. Format browser dan durasi aktual
masih perlu diverifikasi pada pilot setelah tool tersedia.

Policy bukan default hardcode validator. Perubahan nilai memerlukan snapshot
versi baru (mis. dev-local-pilot-v2) dan persetujuan hash baru. Policy versi lama
tidak ditimpa; FK contribution tetap menunjuk versi saat ingestion.
approved_at pada seed menandai izin aktivasi konfigurasi uji lokal, bukan
pengesahan penelitian atau label.

## Lima label dari proposal

Sumber: LaporanProyekAkhir_3312401034_BungaCitraLestariSitumorang.docx,
bagian 3.1.1 Sumber Data, paragraf berawal
"Dataset baseline terdiri atas 40 label, yaitu".

| Display name persis inventaris | code lokal |
| --- | --- |
| Halo | halo |
| Apa Kabar | apa_kabar |
| Terima Kasih | terima_kasih |
| Saya | saya |
| Makan | makan |

Subset kecil mencakup kata tunggal dan ungkapan untuk menguji pemilihan label,
bukan menentukan urutan kelas model atau menjamin ketepatan peragaan.
Script memeriksa SHA-256 DOCX, anchor inventaris, jumlah 40 label, dan keanggotaan
setiap label. Proposal tidak diubah. Code adalah slug katalog, bukan indeks model.

## Consent draf

Versi: **dev-local-consent-draft-v1**.

Teks persis terdapat pada manifest dataset-pilot.local.json dan dicetak oleh
plan. Teks ditampilkan lengkap pada bagian akhir dokumen ini. Aktivasi akan
mengisi hanya dua variabel consent frontend, mempertahankan URL/key dan
konfigurasi lain. Next.js perlu restart agar nilai publik terbaca ulang.
Tidak ada consent penelitian final yang diasumsikan.

## Script, approval, dan idempotency

File:
- supabase/pilot/dataset-pilot.local.json: proposal parameter/label/consent/provenance.
- supabase/scripts/seed_dataset_pilot_local.py: plan, apply, deactivate.
- supabase/tests/support/test_seed_dataset_pilot_local.py: tes keselamatan tanpa DB.
- supabase/pilot/README.md: prosedur dan batas pengujian.

Dari root repository, PowerShell:

~~~powershell
rtk proxy wsl -d Ubuntu -- /home/bunga/miniconda3/envs/signify-backend/bin/python supabase/scripts/seed_dataset_pilot_local.py plan --offline
~~~

Hilangkan --offline untuk preflight + snapshot PostgreSQL dalam transaksi
READ ONLY yang diakhiri ROLLBACK. Plan tidak membuat receipt, mengubah environment,
membuat akun, memberi role/grant, atau menulis konfigurasi database.

SHA-256 konfigurasi yang disiapkan:
2300a3089c3b8b8b90897b1bd7ec681f40a6bc5ec2a2902d4a5634dda0d2a961

**Perintah berikut hanya untuk setelah pengguna menyetujui rancangan dan data uji.**
Pilih UUID profil admin lokal yang diizinkan untuk created_by; script tidak
memilih akun secara otomatis, membuat admin, atau memberi grant kurator.

~~~powershell
rtk proxy wsl -d Ubuntu -- /home/bunga/miniconda3/envs/signify-backend/bin/python supabase/scripts/seed_dataset_pilot_local.py apply --actor <UUID_ADMIN_LOKAL> --approve <SHA256_DARI_PLAN>
~~~

Aktivasi juga memerlukan FFmpeg, FFprobe, dan prlimit yang dapat dijalankan.
Script tidak menginstal tool. DATASET_FFMPEG/DATASET_FFPROBE dapat menunjuk binary
lokal khusus untuk pemeriksaan; jalankan backend dengan binary yang sama melalui
--ffmpeg/--ffprobe. Restart backend bila pengaturan tool berubah.

Target koneksi tidak menerima database URL, --linked, project remote, atau
password produksi. SQL hanya melalui Docker socket unix:///var/run/docker.sock
dan container supabase_db_signify-supabase-local yang dipreflight. Psql memakai
Unix socket lokal di dalam container; tidak menyentuh PostgreSQL Windows 5432.
Helper existing hanya dipakai untuk preflight/read/transport, tidak memanggil
create_accounts(), seed_data(), atau cleanup().

UUID policy deterministik berdasarkan versi; UUID label stabil berdasarkan code
dalam namespace pilot. Penerapan ulang cocok dengan snapshot yang sama dan tidak
membuat duplikat. Konflik code milik data lain, snapshot yang berubah, consent
existing berbeda, dan policy aktif lain menyebabkan penolakan; tidak ada force
atau auto-replace. PostgreSQL mengulang pemeriksaan di dalam transaksi, table
lock konfigurasi, dan advisory lock.

Receipt lokal di supabase/.temp/dataset-pilot/ (di-ignore Git) menyimpan ID,
hash, actor, phase, dan dua baris consent semula. Tidak ada salinan key, JWT,
password, atau seluruh .env. File environment ditulis atomik dan hanya dua
variabel yang dikelola diubah. Jika DB commit/file update terputus, jangan
menghapus receipt; ulangi rencana/hash yang sama untuk rekonsiliasi.
Tidak ada transaksi atomik tunggal lintas PostgreSQL dan filesystem.

## Rencana E2E setelah izin

1. Konfirmasi lima label, parameter, consent, UUID admin lokal, dan jenis data uji.
   Usulan awal: sumber kamera sintetis tanpa orang, hanya untuk uji pipeline.
   Rekaman peserta/kamera pribadi memerlukan izin khusus dari pemilik.
2. Siapkan FFmpeg/FFprobe lokal tanpa mengubah environment model Meiske.
   Verifikasi versi aktual dan jalankan backend dengan path tool yang benar.
3. Jalankan plan live lagi. Setelah persetujuan eksplisit, jalankan apply,
   cek satu policy aktif/lima label, lalu jalankan ulang apply untuk membuktikan
   jumlah row tidak bertambah. Tidak ada migration/reset.
4. Restart Next.js; login memakai akun kontributor uji lokal biasa.
   Buka http://localhost:3000/contributions/new. Periksa teks/versi consent,
   label dari API, kemampuan MIME, izin kamera, dan audio nonaktif.
5. Uji countdown, start/stop, preview, rekam ulang, track cleanup, lalu upload
   dengan izin penggunaan data uji. Catat durasi/resolusi/FPS/ukuran/hash aktual
   dan bandingkan policy. Jangan menganggap pola sintetis sebagai contoh BISINDO.
6. Pastikan response 201/PENDING dan contribution.consent_version persis
   dev-local-consent-draft-v1. Ulangi byte/metadata/key yang sama:
   harapkan 200/replayed dengan ID, row, dan objek yang sama.
7. Buka Koleksi Saya, detail, dan playback signed URL sebagai pemilik. Periksa
   expiry/pembaruan URL serta penolakan akun lain dan token invalid/expired.
8. Uji penolakan video rusak, tanpa stream video, durasi/resolusi/ukuran di luar
   policy menggunakan berkas sintetis yang diizinkan. Simpan laporan lokal
   hanya ID fixture/hasil teknis, tanpa token atau isi kredensial.
9. Jangan memanggil RPC approval kurasi atau ekspor; semua kandidat uji tetap
   PENDING, belum dinilai secara semantik. Catat dan isolasi data pilot.

## Membatalkan pilot tanpa menghapus existing

Perintah setelah pilot, memakai manifest/hash dan actor yang sama:

~~~powershell
rtk proxy wsl -d Ubuntu -- /home/bunga/miniconda3/envs/signify-backend/bin/python supabase/scripts/seed_dataset_pilot_local.py deactivate --actor <UUID_ADMIN_LOKAL> --approve <SHA256_DARI_PLAN>
~~~

Perintah hanya menonaktifkan policy/label yang ID, creator, dan snapshot-nya cocok
dengan pilot, lalu memulihkan dua baris consent dari receipt. Edit manual consent,
label yang bertabrakan, atau policy aktif lain menyebabkan penolakan agar tidak
menimpa perubahan existing. Tidak ada DELETE, TRUNCATE, CASCADE, perubahan RLS,
pemindahan role, penghapusan video, atau perubahan audit. Restart Next.js.

Menonaktifkan konfigurasi **tidak** menonaktifkan video yang sudah dikirim.
Untuk penarikan kontribusi uji:
- Cocokkan daftar UUID hasil E2E dengan video_policy_id pilot, consent_version,
  dan user_id akun uji yang diizinkan. Jangan memilih berdasarkan semua PENDING.
- Pemilik memakai sesi Auth nyata untuk RPC existing
  POST /rest/v1/rpc/dataset_soft_delete_contribution dengan p_contribution_id dan
  p_expected_revision aktual. Jangan memalsukan JWT/role dan jangan mengubah
  deleted_at secara bypass.
- Soft delete membatasi akses baru; signed URL sebelumnya menunggu kedaluwarsa.
  Berkas fisik/metadata/riwayat tetap ada. Penghapusan fisik, bila diminta pemilik,
  harus ditinjau terpisah per path/UUID dan referensi ekspor; script ini tidak
  menghapusnya.

Draf consent melarang pelatihan/publikasi/ekspor. Schema saat ini belum menerapkan
registry izin penggunaan berdasarkan consent_version. Menjaga PENDING dan tidak
menjalankan kurasi/ekspor merupakan batas pilot ini; jangan menganggap consent
draf otomatis disaring oleh semua fitur ekspor di masa depan.

## Verifikasi tahap persiapan sebelum aktivasi

28 tes pure/unit lulus: sumber label, kompatibilitas validator backend, gate hash
dan actor, versi/ID stabil, konflik existing, SQL konfigurasi saja, transaksi
read-only, media-tool gate, preservation/restore environment, receipt/rerun
melalui database palsu, serta plan offline tanpa koneksi.

Plan live READ ONLY berhasil pada PostgreSQL 15.19. Pada tahap persiapan belum ada eksekusi SQL seed,
aktivasi consent, rekaman peserta, atau E2E upload pada tahap persiapan ini.
Transaksi SQL apply/deactivate dan idempotency row PostgreSQL nyata kemudian
diverifikasi setelah persetujuan pada pengujian lokal. Tidak ada klaim video sudah dikurasi.

## Teks consent persis manifest

DRAF PERSETUJUAN UJI LOKAL - BELUM DISAHKAN UNTUK PENELITIAN. Saya memahami bahwa perekaman ini ditujukan untuk menguji alur teknis kontribusi Signify AI di lingkungan development lokal. Video dapat memuat wajah, tubuh bagian atas, dan tangan; audio dinonaktifkan. Video disimpan pada bucket privat Supabase lokal. Akses diberikan kepada pemilik kontribusi, kurator yang secara khusus diberi kewenangan, dan pengelola backend lokal untuk keperluan pengujian; status admin teknis tidak membuktikan kompetensi BISINDO. Data pilot tidak diizinkan untuk pelatihan model, publikasi, ekspor, atau penggunaan penelitian melalui draf ini. Saya dapat membatalkan sebelum mengirim dan meminta pengelola menonaktifkan kontribusi setelah dikirim melalui soft delete; tautan sementara yang telah diterbitkan dapat tetap berlaku sampai kedaluwarsa. Soft delete tidak langsung menghapus berkas fisik atau jejak audit; penghapusan fisik memerlukan konfirmasi dan pemeriksaan terpisah. Setelah pengujian selesai, data pilot ditinjau untuk penonaktifan dan tindak lanjut penghapusan. Saya tidak akan merekam orang lain atau data pribadi yang tidak diperlukan. Saya memahami bahwa label yang dipilih masih berupa usulan dan rekaman belum dinyatakan benar secara semantik atau layak untuk dataset pelatihan.


## Berkas sumber lokal

DOCX yang ditunjuk oleh field source.path pada dataset-pilot.local.json merupakan berkas lokal dan tidak ikut Git. Sebelum menjalankan seed pilot atau tes yang memvalidasi sumber proposal, sediakan DOCX tersebut pada path yang tercantum dengan SHA-256 yang sesuai. Aplikasi dataset tidak membutuhkan DOCX untuk dijalankan.
