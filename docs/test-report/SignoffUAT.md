# User Acceptance Test (UAT) Report

**Sign Off Document**

|  |  |
| --- | --- |
| **Project Information** | |
| Nama Projek | : Signify AI |
| Tanggal Dokumen | : 22 Juni 2026 |
| Tim penguji | : Meiske Priskilla Sahertian (3312401001) dan Bunga Citra Lestari Situmorang (3312401034) |
| Klien | : PBL Project |
| Status Dokumen | : UAT evidence lulus, menunggu tanda tangan approval |

# 1. Executive Summary

## 1.1 Testing Overview

Ringkasan ini mengacu pada lembar test case management dan eksekusi Playwright UAT evidence lokal pada 22 Juni 2026.

1. Total Test Cases: 12 UAT cases
2. Test Cases Passed: 12 (100%)
3. Test Cases Failed: 0 (0%)
4. Test Cases Blocked: 0 (0%)

Catatan:

- UAT berfokus pada pengalaman pengguna aplikasi produksi, yaitu frontend Next.js dengan browser inference menggunakan ONNX Runtime Web.
- Legacy/dev-only FastAPI tidak menjadi objek sign-off produksi. Backend tersebut hanya relevan untuk contract/parity testing internal.
- Pembagian UAT dilakukan silang: Meiske menguji modul dengan PIC/developer Bunga, dan Bunga menguji modul dengan PIC/developer Meiske.
- Screenshot setiap skenario UAT tersedia sebagai attachment Playwright report dari `apps/frontend/tests/e2e/uat.spec.ts`.
- Sign-off produksi formal tetap membutuhkan tanda tangan stakeholder pada bagian approval.

## 1.2 Recommendation from Developers

☐ **APPROVED** - System is ready for production deployment

☑ **APPROVED WITH CONDITIONS** - System can be deployed with minor issues to be fixed

☐ **REJECTED** - System requires significant fixes before deployment

Rekomendasi 22 Juni 2026: UAT frontend produksi lulus 12/12 dan aplikasi layak dilanjutkan ke deployment/staging dengan kondisi:

- Tanda tangan stakeholder/manajer proyek/dosen pengujian dilengkapi.
- Performance testing Locust dan usability SUS dilampirkan bila diwajibkan untuk final release.
- Backend legacy contract test sudah lulus pada conda env `signify-backend`; parity model internal tetap opsional bila diperlukan.

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

| Module/Feature | Total Cases | Passed | Failed | Blocked | Pass Rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Authentication dan protected route | 2 | 2 | 0 | 0 | 100% |
| Public route dan navigasi awal | 1 | 1 | 0 | 0 | 100% |
| Translate kamera dan ONNX browser inference | 3 | 3 | 0 | 0 | 100% |
| Sentence builder dan TTS | 2 | 2 | 0 | 0 | 100% |
| History | 1 | 1 | 0 | 0 | 100% |
| Practice dan reference | 1 | 1 | 0 | 0 | 100% |
| Preferences dan profile | 1 | 1 | 0 | 0 | 100% |
| Logout | 1 | 1 | 0 | 0 | 100% |
| **TOTAL** | **12** | **12** | **0** | **0** | **100%** |

## 3.2 Test Cases by Priority

| Priority | Total Cases | Passed | Failed | Blocked | Pass Rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Critical | 4 | 4 | 0 | 0 | 100% |
| High | 5 | 5 | 0 | 0 | 100% |
| Medium | 3 | 3 | 0 | 0 | 100% |
| Low | 0 | 0 | 0 | 0 | 0% |
| **TOTAL** | **12** | **12** | **0** | **0** | **100%** |

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

Tabel ini mengacu pada defect log di `docs/test-report/TestManagement.md` setelah retest 22 Juni 2026.

| Severity | Open | Closed | Total |
| --- | ---: | ---: | ---: |
| Critical | 0 | 1 | 1 |
| High | 0 | 2 | 2 |
| Medium | 0 | 2 | 2 |
| Low | 0 | 0 | 0 |
| **TOTAL** | **0** | **5** | **5** |

## 4.2 Critical and High Defects List

Daftar berikut adalah defect critical/high yang relevan dengan UAT setelah retest.

| Bug ID | Description | Severity | Status | Action |
| --- | --- | --- | --- | --- |
| BUG-UAT-001 | Production build lokal sebelumnya gagal pada static page generation. | Critical | Closed | Retest 22-06-2026: `pnpm build` lulus dan static generation 27/27 selesai. |
| BUG-UAT-002 | Hasil UAT sebelumnya belum tersedia. | High | Closed | Retest 22-06-2026: Playwright UAT evidence 12/12 pass dengan screenshot attachment. |
| BUG-UAT-003 | Playwright E2E/accessibility sebelumnya belum diverifikasi. | High | Closed | Retest 22-06-2026: Chromium E2E 27/27 pass dan axe serious/critical 0. |

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
- Foto atau screenshot pelaksanaan UAT: attachment Playwright report dari `apps/frontend/tests/e2e/uat.spec.ts`.
- Daftar peserta dan role tester.
- Bukti hasil skenario UAT, termasuk catatan saran tester.
- Link build/deployment staging yang digunakan saat UAT.
- Laporan Pengujian Perangkat Lunak: `docs/test-report/LaporanPengujianPerangkatLunak.md`.
