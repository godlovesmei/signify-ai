# User Acceptance Test (UAT) Report

**Sign Off Document**

|  |  |
| --- | --- |
| **Project Information** | |
| Nama Projek | : Signify AI |
| Tanggal Dokumen | : 20 Juni 2026 |
| Tim penguji | : Meiske Priskilla Sahertian (3312401001) dan Bunga Citra Lestari Situmorang (3312401034) |
| Klien | : PBL Project |
| Status Dokumen | : Draft, menunggu pelaksanaan UAT dan tanda tangan approval |

# 1. Executive Summary

## 1.1 Testing Overview

Ringkasan ini mengacu pada lembar spreadsheet test case management. Karena UAT aktual belum terdokumentasi di repository, angka passed, failed, blocked, dan pass rate perlu diisi setelah sesi UAT selesai.

1. Total Test Cases: 12 planned UAT cases
2. Test Cases Passed: [Isi jumlah] ([Isi persentase]%)
3. Test Cases Failed: [Isi jumlah] ([Isi persentase]%)
4. Test Cases Blocked: [Isi jumlah] ([Isi persentase]%)

Catatan:

- UAT berfokus pada pengalaman pengguna aplikasi produksi, yaitu frontend Next.js dengan browser inference menggunakan ONNX Runtime Web.
- Legacy/dev-only FastAPI tidak menjadi objek sign-off produksi. Backend tersebut hanya relevan untuk contract/parity testing internal.
- Pembagian UAT dilakukan silang: Meiske menguji modul dengan PIC/developer Bunga, dan Bunga menguji modul dengan PIC/developer Meiske.
- Sign-off produksi belum dapat diberikan sebelum hasil UAT, bukti pelaksanaan, dan approval stakeholder tersedia.

## 1.2 Recommendation from Developers

☐ **APPROVED** - System is ready for production deployment

☐ **APPROVED WITH CONDITIONS** - System can be deployed with minor issues to be fixed

☐ **REJECTED** - System requires significant fixes before deployment

Rekomendasi sementara sebelum UAT final: belum dipilih. Berdasarkan laporan pengujian perangkat lunak, aplikasi dapat dilanjutkan ke proses UAT/staging, tetapi sign-off produksi harus menunggu:

- Seluruh skenario UAT selesai dan disetujui.
- `pnpm build` produksi lulus.
- Bukti UAT, dokumentasi foto/screenshot, dan tanda tangan stakeholder dilampirkan.
- Defect critical/high yang masih terbuka sudah ditutup atau disetujui sebagai conditional release.

# 2. UAT Test Scope

## 2.1 In Scope

- Login pengguna melalui Google OAuth/Supabase.
- Redirect aman dari route workspace untuk pengguna anonim.
- Akses route publik: landing page, how it works, research, dan terms condition.
- Akses workspace setelah login: translate, practice, history, reference, dan profile.
- Translate dengan kamera browser dan browser inference YOLO11n ONNX melalui ONNX Runtime Web.
- Tampilan state kamera/inference: idle, loading, ready, detecting, dan error.
- Sentence builder: tambah hasil deteksi, spasi, hapus karakter, clear, dan text-to-speech.
- History: melihat daftar histori, pagination/load more, hapus satu histori, dan clear history.
- Practice dan reference: menjalankan latihan, menyimpan progress, reset progress, dan melihat statistik huruf.
- Preferences/profile: theme, contrast, text scale, pengaturan TTS, dan data profil pengguna.
- Logout dan pembatasan akses setelah session berakhir.
- Aksesibilitas dasar pada alur utama: keyboard navigation, fokus dialog, label tombol, dan keterbacaan status.

## 2.2 Out of Scope

- Legacy/dev-only FastAPI inference sebagai dependency produksi.
- Contract test `/api/v1/translate/predict`, parity `.pt` versus ONNX, dan endpoint backend internal.
- Training ulang model YOLO, perubahan dataset, dan evaluasi akurasi model baru.
- Performance/load testing Locust.
- Security penetration testing penuh.
- Pengujian browser lama yang tidak didukung.
- Search/filter umum, editable CRUD umum, dan UI file-picker upload karena fitur tersebut tidak tersedia pada aplikasi.
- Validasi infrastruktur cloud dan deployment provider di luar alur pengguna UAT.

# 3. Test Execution Summary

## 3.1 Test Cases by Module

Angka passed, failed, blocked, dan pass rate perlu diperbarui setelah UAT dieksekusi.

| Module/Feature | Total Cases | Passed | Failed | Blocked | Pass Rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Authentication dan protected route | 2 | [N] | [N] | [N] | [%] |
| Public route dan navigasi awal | 1 | [N] | [N] | [N] | [%] |
| Translate kamera dan ONNX browser inference | 3 | [N] | [N] | [N] | [%] |
| Sentence builder dan TTS | 2 | [N] | [N] | [N] | [%] |
| History | 1 | [N] | [N] | [N] | [%] |
| Practice dan reference | 1 | [N] | [N] | [N] | [%] |
| Preferences dan profile | 1 | [N] | [N] | [N] | [%] |
| Logout | 1 | [N] | [N] | [N] | [%] |
| **TOTAL** | **12** | **[N]** | **[N]** | **[N]** | **[%]** |

## 3.2 Test Cases by Priority

| Priority | Total Cases | Passed | Failed | Blocked | Pass Rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Critical | 4 | [N] | [N] | [N] | [%] |
| High | 5 | [N] | [N] | [N] | [%] |
| Medium | 3 | [N] | [N] | [N] | [%] |
| Low | 0 | [N] | [N] | [N] | [%] |
| **TOTAL** | **12** | **[N]** | **[N]** | **[N]** | **[%]** |

## 3.3 Recommended UAT Scenario List

| UAT ID | Module/Feature | Priority | Scenario | Expected Result | Developer/PIC Implementasi | Tester |
| --- | --- | --- | --- | --- | --- | --- |
| UAT-001 | Authentication | Critical | Pengguna membuka login dan masuk melalui Google OAuth. | Session terbentuk dan pengguna masuk ke workspace/return path yang aman. | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) |
| UAT-002 | Protected route | Critical | Pengguna anonim membuka `/translate`, `/history`, atau route workspace lain. | Pengguna diarahkan ke login dan tidak melihat data workspace sebelum login. | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) |
| UAT-003 | Public route | Medium | Pengguna membuka landing page, how it works, research, dan terms condition. | Semua halaman tampil, navigasi jelas, dan tidak meminta login. | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) |
| UAT-004 | Translate camera | Critical | Pengguna membuka translate dan mengaktifkan kamera. | Status kamera berubah jelas sampai siap/detecting atau menampilkan error yang mudah dipahami. | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) |
| UAT-005 | ONNX browser inference | Critical | Pengguna memperagakan huruf BISINDO di kamera. | Aplikasi menampilkan prediksi huruf, confidence, dan bounding box tanpa membutuhkan backend FastAPI. | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) |
| UAT-006 | Inference recovery | High | Kamera/model gagal atau izin kamera ditolak. | Aplikasi menampilkan pesan error dan opsi pemulihan yang bisa diikuti pengguna. | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) |
| UAT-007 | Sentence builder | High | Pengguna menyusun kalimat dari hasil deteksi, menambah spasi, menghapus, dan clear. | Kalimat berubah sesuai aksi dan tidak menghasilkan state yang membingungkan. | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) |
| UAT-008 | Text-to-speech | Medium | Pengguna menekan tombol TTS pada kalimat yang sudah terbentuk. | Browser membacakan kalimat atau memberi status jika TTS tidak tersedia. | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) |
| UAT-009 | History | High | Pengguna membuka history, melihat detail, menghapus satu item, dan clear history. | Data histori tampil sesuai akun, aksi hapus berjalan, dan state empty/error jelas. | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) |
| UAT-010 | Practice/reference | High | Pengguna menjalankan latihan, melihat hasil, reset progress, dan membuka reference. | Progress/statistik sesuai aksi dan referensi huruf mudah dipahami. | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) |
| UAT-011 | Preferences/profile | Medium | Pengguna mengubah theme, contrast, text scale, TTS settings, dan membuka profile. | Preferensi diterapkan dan tersimpan pada session/data pengguna. | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) |
| UAT-012 | Logout | High | Pengguna logout lalu mencoba membuka route workspace. | Session berakhir dan route workspace kembali meminta login. | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) |

# 4. Defect Summary

## 4.1 Defects by Priority

Tabel ini harus mengacu pada spreadsheet bug tracking setelah UAT selesai.

| Severity | Open | Closed | Total |
| --- | ---: | ---: | ---: |
| Critical | [N] | [N] | [N] |
| High | [N] | [N] | [N] |
| Medium | [N] | [N] | [N] |
| Low | [N] | [N] | [N] |
| **TOTAL** | **[N]** | **[N]** | **[N]** |

## 4.2 Critical and High Defects List

Daftar awal berikut berasal dari verifikasi laporan pengujian perangkat lunak, bukan dari eksekusi UAT final. Perbarui setelah bug tracking UAT tersedia.

| Bug ID | Description | Severity | Status | Action |
| --- | --- | --- | --- | --- |
| BUG-UAT-001 | Production build lokal gagal pada fase static page generation dengan pesan `Next.js build worker exited with code: 1`. | Critical | Open | Investigasi dan perbaiki sebelum production sign-off. |
| BUG-UAT-002 | Hasil UAT belum tersedia: belum ada bukti pelaksanaan, statistik pass/fail, saran tester, dan tanda tangan stakeholder. | High | Open | Laksanakan sesi UAT dan lengkapi dokumen sign-off. |
| BUG-UAT-003 | Backend legacy pytest belum diverifikasi ulang di environment aktif karena dependency `ultralytics` belum tersedia. | Medium | Open | Jalankan ulang pada conda env `signify-backend`; tidak memblokir UAT produksi frontend jika tidak menjadi dependency produksi. |

# 5. Sign-Off Approval

## 5.1 UAT Team Sign-Off

Saya menyatakan bahwa User Acceptance Testing (UAT) telah selesai dilaksanakan sesuai dengan rencana pengujian dan kriteria penerimaan yang telah ditetapkan.

Catatan: bagian ini hanya boleh ditandatangani setelah seluruh skenario UAT selesai dieksekusi dan hasilnya sudah disetujui.

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Ketua UAT | Meiske Priskilla Sahertian (3312401001) |  | [Tanggal] |
| Anggota UAT | Bunga Citra Lestari Situmorang (3312401034) |  | [Tanggal] |

## 5.2 Business Stakeholder Sign-Off

Berdasarkan hasil UAT yang telah disajikan, dengan ini saya menerima sistem tersebut untuk dilanjutkan ke tahap deployment produksi (go-live).

| Role | Name | Signature | Date | Approval Decision |
| --- | --- | --- | --- | --- |
| Product Owner/Client Representative | [Nama] |  | [Tanggal] | ☐ Approved  ☐ Conditional  ☐ Rejected |
| Manajer Proyek | [Nama] |  | [Tanggal] | ☐ Approved  ☐ Conditional  ☐ Rejected |
| Dosen Pengujian Perangkat Lunak | [Nama] |  | [Tanggal] | ☐ Approved  ☐ Conditional  ☐ Rejected |

# 6. Required Attachments

- Spreadsheet test case management UAT.
- Draft test management: `docs/test-report/TestManagement.md`.
- Spreadsheet bug tracking/defect log.
- Foto atau screenshot pelaksanaan UAT.
- Daftar peserta dan role tester.
- Bukti hasil skenario UAT, termasuk catatan saran tester.
- Link build/deployment staging yang digunakan saat UAT.
- Laporan Pengujian Perangkat Lunak: `docs/test-report/LaporanPengujianPerangkatLunak.md`.
