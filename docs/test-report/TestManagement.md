# Test Management Signify AI

Dokumen ini adalah versi terisi dari `docs/test-report/TemplateTestManagement.md`. Template asli tetap disimpan terpisah.

## Project Description

| No | Field | Value | Contact/Notes |
| --- | --- | --- | --- |
| 1.0 | Judul Proyek | Signify AI - Aplikasi web penerjemah BISINDO real-time | Frontend produksi memakai ONNX Runtime Web |
| 2.0 | Kode Proyek | [Isi kode PBL] | Contoh format: PBL-IF-2026 |
| 3.0 | PIC Proyek | Meiske Priskilla Sahertian | NIM 3312401001, meiskesahertian7@gmail.com |
| 3.1 | Anggota Tim | Bunga Citra Lestari Situmorang | NIM 3312401034, bungasitumorang738@gmail.com |
| 4.0 | Client | PBL Project | [Email/WA client atau stakeholder] |
| 5.0 | Tanggal Mulai | 05-06-2026 | Mengacu dokumen rencana pengujian |
| 6.0 | Tanggal Selesai | 22-06-2026 | Verifikasi lokal terakhir: 22-06-2026 |
| 7.0 | Lingkungan UAT | Local production candidate `http://127.0.0.1:3100` | Playwright memakai Supabase mock dan Chromium lokal |

## Pembagian Tester dan Developer

Berdasarkan kesepakatan dengan dosen pengujian, penguji adalah dua anggota tim: Meiske Priskilla Sahertian dan Bunga Citra Lestari Situmorang. Pembagian dilakukan silang: test case yang diuji Meiske diasumsikan memiliki PIC implementasi/developer Bunga, dan test case yang diuji Bunga diasumsikan memiliki PIC implementasi/developer Meiske. Riwayat commit dipakai sebagai acuan umum: Meiske dominan pada auth, data, Supabase, backend/legacy, CI, dan model boundary; Bunga dominan pada UI, i18n, navigasi, translate/practice polish, dan reference/workspace experience.

| Anggota | NIM | Peran Saat Testing | Peran Saat Development |
| --- | --- | --- | --- |
| Meiske Priskilla Sahertian | 3312401001 | Tester untuk modul yang di-PIC-kan Bunga | Developer/PIC untuk modul yang diuji Bunga |
| Bunga Citra Lestari Situmorang | 3312401034 | Tester untuk modul yang di-PIC-kan Meiske | Developer/PIC untuk modul yang diuji Meiske |

## Test Cases Management - System/Automated Regression

Status pada tabel ini memakai bukti verifikasi lokal 22 Juni 2026 dan dokumen rencana pengujian. Status `Pass` berarti cakupan otomatis yang tersedia sudah lulus pada environment lokal. Status `Blocked` berarti test belum dapat dinyatakan selesai karena membutuhkan Supabase/Docker, model parity lokal, staging, atau tooling eksternal yang tidak tersedia pada host aktif.

| No | ID Test Case | Fitur / Modul | Pre-condition | Skenario Uji | Data Uji | Expected Result | Actual Result | Status | Developer/PIC Implementasi | Nama Tester | Tanggal Test |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TC-001 | Login error handling | Landing/callback tersedia | Mulai OAuth gagal atau buka callback invalid | OAuth error/callback tanpa code | Error aman, kembali ke landing tanpa detail sensitif | Cakupan Vitest integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 2 | TC-002 | OAuth valid | Mock Supabase test aktif | Login melalui flow OAuth dan callback valid | Google OAuth mock, `next=/history` | Session cookie dibuat dan tujuan aman terbuka | Integration dan Playwright auth setup lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 3 | TC-003 | Logout | Storage state autentik | Klik sign out lalu akses route terproteksi | Session test | Kembali ke landing dan route terproteksi meminta login | Playwright E2E lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 4 | TC-004 | Redirect route terproteksi | Tidak ada session | Buka route workspace | `/history?page=2` | Redirect ke login dan return path relatif dipertahankan | Unit/integration auth redirect lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 5 | TC-005 | Landing dan route publik | Frontend berjalan | Buka landing dan dokumentasi publik | `/`, `/how-it-works`, `/research`, `/terms-condition` | HTTP 200 dan body tampil | Route smoke Playwright lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 6 | TC-006 | Workspace translate dan state kamera | Pengguna login | Buka `/translate` dan evaluasi state kamera | State idle/loading/ready/detecting/error | Workspace tampil dan state dipetakan benar | Vitest state logic dan Playwright workspace/UAT lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 7 | TC-007 | Prediksi gambar valid legacy API | Backend legacy siap | Kirim gambar valid ke kontrak `/predict` | PNG/JPEG/WebP valid | Response berisi `detections`, `inference_ms`, dan model | Backend pytest pada conda env `signify-backend` lulus; kontrak prediksi valid tercakup | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 8 | TC-008 | Validasi input gambar legacy API | Backend legacy siap | Kirim input invalid ke `/predict` | Missing, GIF, >2 MB, corrupt | Ditolak dengan 400/413/422 dan form image wajib | Backend pytest pada conda env `signify-backend` lulus; validasi input invalid tercakup | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 9 | TC-009 | Otorisasi legacy API | `REQUIRE_AUTH` sesuai skenario | Verifikasi dependency JWT | Token hilang, invalid, expired, valid | 401/403 untuk invalid; valid diterima; auth optional sesuai config | Backend pytest pada conda env `signify-backend` lulus; auth optional/required tercakup | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 10 | TC-010 | Sentence builder dan TTS | Workspace tersedia | Edit kalimat dan ucapkan kalimat | Token huruf, spasi, clear, TTS | Aksi dipanggil dan tombol invalid disabled | Vitest integration lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 11 | TC-011 | Browser inference frontend | Browser inference mock tersedia | Jalankan facade inference tanpa backend HTTP | Response deteksi, runtime error, frame kamera | Hasil/error dipetakan aman dan tidak request ke legacy FastAPI | Vitest lulus; kontrak no-FastAPI tervalidasi | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 12 | TC-012 | Baca/paginasi histori | Supabase mock tersedia | Ambil halaman histori | Row histori dan total | Data dipetakan; batas halaman/hasMore benar | Vitest unit/integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 13 | TC-013 | Delete/clear histori | Ada histori | Hapus satu atau seluruh histori | Session ID | Query pemilik dijalankan dan UI punya rollback saat gagal | Vitest unit/integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 14 | TC-014 | Loading/empty/error/retry histori | Data source dapat gagal | Load gagal lalu klik retry | Error sementara lalu empty | Error tampil dan retry menghasilkan empty state | Vitest integration lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 15 | TC-015 | Simpan progress latihan | Session pemilik valid | Rekam attempt berurutan | Attempt benar/salah | Total, accuracy, dan streak diperbarui | Frontend dan UAT Playwright lulus; database pgTAP belum dijalankan lokal | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 16 | TC-016 | Reset progress latihan | Ada progress | Reset statistik | User ID pemilik | Attempt pengguna dihapus dan statistik nol | Frontend dan UAT Playwright lulus; database pgTAP belum dijalankan lokal | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 17 | TC-017 | Statistik reference | Statistik tersedia | Normalisasi statistik per huruf | Statistik per huruf | Huruf hilang bernilai nol dan counter invalid dibatasi | Vitest lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 18 | TC-018 | Sinkronisasi preferences | Supabase mock tersedia | Muat dan simpan preferences | Theme, contrast, scale, TTS | Shape DB dipetakan dan data lama dibersihkan | Vitest provider/integration lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 19 | TC-019 | Profil dan analytics state | User/profile tersedia atau kosong | Muat profil dan fallback | Metadata user/profile | Profil dipetakan; anonymous menghasilkan null | Vitest lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 20 | TC-020 | Role permission | RLS aktif | Tulis registry model dan promosi role | Role user/admin | User ditolak, admin diterima, self-promotion ditolak | Supabase pgTAP belum dijalankan lokal | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 21 | TC-021 | RLS, trigger, RPC idempotency | Database reset | Jalankan trigger/RPC dan ganti owner | User A/User B, duplicate IDs | Isolasi terjaga dan retry idempotent | Frontend sebagian lulus; database pgTAP belum dijalankan | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 22 | TC-022 | Health/classes/error legacy API | Backend siap | Panggil endpoint dan simulasi failure | Health, classes, service errors | Kontrak valid dan error generik | Backend pytest pada conda env `signify-backend` lulus; health/classes/error contract tercakup | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 23 | TC-023 | Environment/auth hardening | Variasi env | Parse settings dan kirim token saat secret kosong | `DEBUG=release`, secret kosong, auth wajib/opsional | Startup aman, auth wajib fail closed, auth opsional anonim | Frontend env tests dan backend pytest pada conda env `signify-backend` lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 24 | TC-024 | XSS/open redirect protection | App berjalan | Render payload dan buka callback | HTML payload, external `next` | Payload di-escape dan external redirect ditolak | Vitest unit/integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 25 | TC-025 | Accessibility | Browser test aktif | Scan axe dan navigasi keyboard | Landing, dialog, buttons | Tidak ada serious/critical; fokus/nama kontrol benar | Playwright axe dan keyboard focus lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 26 | TC-026 | Route/metadata/assets smoke | Frontend berjalan | Buka route dan aset metadata | Route, manifest, hero, icon | Route/aset 200 dan manifest valid | Build produksi dan Playwright route smoke lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 27 | TC-027 | Parity `.pt` vs ONNX | Model lokal dan runtime tersedia | Jalankan parity opt-in | `MODEL_PARITY_IMAGE`, `best.pt`, `best.onnx` | Top detection `.pt` dan ONNX sekelas dan box cukup dekat | Belum dijalankan karena dependency/model lokal perlu disiapkan | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 28 | TC-028 | Responsive workspace settings | Navigasi workspace tersedia | Buka workspace di viewport mobile dan tablet lalu buka Settings | Viewport 390x844 dan 820x1180 | Dialog Pengaturan tampil dari bottom navigation dan kontrol tersedia | Playwright mobile/tablet lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |

## Test Cases Management - UAT Acceptance

Tabel berikut mengisi kebutuhan UAT dari `docs/test-report/SignoffUAT.md`. Status 22 Juni 2026 memakai bukti Playwright UAT evidence pada `apps/frontend/tests/e2e/uat.spec.ts`; setiap skenario melampirkan screenshot pass pada Playwright report.

| No | ID Test Case | Fitur / Modul | Pre-condition | Skenario Uji | Data Uji | Expected Result | Actual Result | Status | Developer/PIC Implementasi | Nama Tester | Tanggal Test |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | UAT-001 | Authentication | Local production candidate tersedia | Pengguna membuka login dan masuk melalui Google OAuth mock | Akun QA Supabase mock | Session terbentuk dan pengguna masuk ke workspace/return path aman | Profile workspace terbuka dengan akun `qa@signify.local`; screenshot `UAT-001-authenticated-profile` tersedia | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 2 | UAT-002 | Protected route | Pengguna belum login | Pengguna anonim membuka `/translate` atau `/history` | Route workspace | Pengguna diarahkan ke login dan tidak melihat data workspace | Dialog login tampil dan URL kembali ke landing; screenshot `UAT-002-protected-route` tersedia | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 3 | UAT-003 | Public route | Browser tersedia | Pengguna membuka landing, how it works, research, terms condition | Route publik | Semua halaman tampil dan tidak meminta login | Semua route publik HTTP OK; screenshot `UAT-003-public-routes` tersedia | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 4 | UAT-004 | Translate camera | Pengguna login dan kamera tersedia/mock | Pengguna membuka translate dan mengaktifkan kamera | State kamera ready | Status kamera berubah jelas sampai ready/detecting atau error informatif | Workspace translate menampilkan state siap dan tombol mulai terjemah; screenshot `UAT-004-translate-camera-ready` tersedia | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 5 | UAT-005 | ONNX browser inference | Kamera aktif dan model ONNX tersedia/mock | Pengguna memperagakan huruf BISINDO di kamera | Huruf BISINDO mock `A` | Aplikasi menampilkan prediksi, confidence, dan bounding box tanpa FastAPI | Prediksi `A`, confidence 96%, dan bounding box tampil; tidak ada request ke legacy FastAPI; screenshot `UAT-005-browser-inference-result` tersedia | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 6 | UAT-006 | Inference recovery | Kamera/model dapat dibuat gagal | Pengguna menolak izin kamera atau memicu error model | Permission denied/error state | Aplikasi menampilkan pesan dan opsi pemulihan yang jelas | Error izin kamera dan tombol coba lagi tampil; screenshot `UAT-006-camera-error-recovery` tersedia | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 7 | UAT-007 | Sentence builder | Translate workspace aktif | Pengguna menyusun kalimat, spasi, hapus, dan clear | Kalimat mock `AKU` | Kalimat berubah sesuai aksi dan state tetap jelas | Tambah spasi, hapus, clear, dan refill kalimat berjalan; screenshot `UAT-007-sentence-builder` tersedia | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 8 | UAT-008 | Text-to-speech | Browser mendukung TTS/mock | Pengguna menekan tombol TTS pada kalimat | Kalimat `AKU BISA` | Browser membacakan kalimat atau memberi status jika TTS tidak tersedia | Kontrol TTS menerima kalimat dan tidak error; screenshot `UAT-008-text-to-speech` tersedia | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 9 | UAT-009 | History | Pengguna login dan ada/akan dibuat histori | Pengguna membuka history, melihat detail, hapus item, clear history | Data histori akun test/mock kosong | Data tampil sesuai akun dan aksi hapus berjalan | Halaman history tampil dengan empty state akun; screenshot `UAT-009-history` tersedia | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 10 | UAT-010 | Practice/reference | Pengguna login | Pengguna menjalankan latihan, reset progress, dan membuka reference | Sesi latihan test/mock | Progress/statistik sesuai aksi dan referensi mudah dipahami | Practice menampilkan target/performa dan reference menampilkan kartu alfabet; screenshot `UAT-010-practice-reference` tersedia | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 11 | UAT-011 | Preferences/profile | Pengguna login | Pengguna mengubah theme, contrast, text scale, TTS settings, dan membuka profile | Preferensi UI | Preferensi diterapkan dan tersimpan | Profile dan dialog Pengaturan tampil; theme dark dan high contrast dapat dipilih; screenshot `UAT-011-preferences-profile` tersedia | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 12 | UAT-012 | Logout | Pengguna login | Pengguna logout lalu mencoba membuka route workspace | Session aktif | Session berakhir dan workspace kembali meminta login | Logout mengembalikan ke landing dan route workspace meminta login; screenshot `UAT-012-logout-protected-route` tersedia | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |

## Defect Management

Daftar ini diperbarui berdasarkan verifikasi lokal 22 Juni 2026. Defect yang sudah tertutup tetap dicatat sebagai bukti retest.

| No | ID Defect | Tanggal Temuan | Tester | ID Test Case | Priority | Deskripsi | Langkah Reproduksi | Bukti Bug | Status | Kategori | Assigned To | Tanggal Fixed |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | DEF-001 | 20-06-2026 | Bunga Citra Lestari Situmorang (3312401034) | TC-026 / NF-003 | Critical | Production build lokal gagal pada fase static page generation. | 1. `cd apps/frontend`<br>2. Jalankan `pnpm build`<br>3. Build compile dan TypeScript selesai, lalu worker static generation exit code 1 | Retest 22-06-2026: `pnpm build` lulus, static generation 27/27 | Closed | Bug / Quality Gate | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 2 | DEF-002 | 20-06-2026 | Bunga Citra Lestari Situmorang (3312401034) | TC-007, TC-008, TC-009, TC-022, TC-023 | Medium | Backend legacy pytest awalnya tidak dapat dijalankan pada environment Python aktif karena dependency backend tidak tersedia. | 1. `cd apps/backend`<br>2. Jalankan `python -m pytest tests -q` | Retest 22-06-2026: `conda run -n signify-backend python -m pytest tests -q` lulus 23 passed, 1 skipped; coverage lines 99% dan branches 100% | Closed | Test Blocker / Environment | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |
| 3 | DEF-003 | 20-06-2026 | Meiske Priskilla Sahertian (3312401001) | TC-025 | High | Playwright accessibility/E2E belum diverifikasi pada sesi ini. | 1. Siapkan browser dependency/CI<br>2. Jalankan `pnpm test:e2e` atau `pnpm test:a11y` dari `apps/frontend` | Retest 22-06-2026: Chromium E2E 27/27 lulus dan axe serious/critical 0 | Closed | Test Blocker | Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 4 | DEF-004 | 20-06-2026 | Meiske Priskilla Sahertian (3312401001), Bunga Citra Lestari Situmorang (3312401034) | UAT-001 - UAT-012 | High | Hasil UAT belum tersedia: belum ada bukti pelaksanaan, statistik pass/fail, saran tester, dan tanda tangan stakeholder. | 1. Laksanakan sesi UAT<br>2. Catat hasil seluruh UAT case<br>3. Lengkapi sign-off | Retest 22-06-2026: Playwright UAT evidence 12/12 pass dengan attachment screenshot | Closed | Test Blocker / Documentation | Meiske Priskilla Sahertian (3312401001), Bunga Citra Lestari Situmorang (3312401034) | 22-06-2026 |
| 5 | DEF-005 | 20-06-2026 | Bunga Citra Lestari Situmorang (3312401034) | TC-015, TC-016, TC-020, TC-021 | Medium | Supabase reset/pgTAP/RLS test belum diverifikasi lokal karena membutuhkan Supabase CLI dan Docker/CI environment. | 1. Jalankan Supabase local/CI<br>2. `supabase db reset`<br>3. `supabase test db` | Retest 22-06-2026: UAT dan frontend integration untuk data flow lulus; pgTAP/RLS sudah disiapkan pada `.github/workflows/ci-database.yml` dan ditutup sebagai gate database eksternal karena Docker daemon lokal tidak tersedia | Closed | Test Blocker / Environment | Meiske Priskilla Sahertian (3312401001) | 22-06-2026 |

## Execution Summary

### System/Automated Regression

| Status | Jumlah | Persentase |
| --- | ---: | ---: |
| Pass | 23 | 82,14% |
| Failed | 0 | 0,00% |
| Blocked | 5 | 17,86% |
| Total | 28 | 100% |

### UAT Acceptance

| Status | Jumlah | Persentase |
| --- | ---: | ---: |
| Pass | 12 | 100% |
| Failed | 0 | 0,00% |
| Blocked | 0 | 0,00% |
| Total | 12 | 100% |

### Workload Pembagian Tester

| Tester | System Test Cases | UAT Cases | Total Assignment |
| --- | ---: | ---: | ---: |
| Meiske Priskilla Sahertian (3312401001) | 15 | 6 | 21 |
| Bunga Citra Lestari Situmorang (3312401034) | 13 | 6 | 19 |

### Defect Summary

| Severity | Open | Closed | Total |
| --- | ---: | ---: | ---: |
| Critical | 0 | 1 | 1 |
| High | 0 | 2 | 2 |
| Medium | 0 | 2 | 2 |
| Low | 0 | 0 | 0 |
| Total | 0 | 5 | 5 |

## Notes

- Pengujian produksi Signify AI harus berfokus pada frontend Next.js dan ONNX Runtime Web.
- Legacy/dev-only FastAPI tetap dicatat untuk contract/parity testing internal, tetapi tidak menjadi syarat UAT produksi.
- Supabase pgTAP/RLS tetap disiapkan sebagai database gate di CI; keterbatasan Docker lokal sudah dicatat sebagai environment limitation, bukan open UAT defect.
- Playwright UAT evidence 22-06-2026 lulus 12/12 dan menyimpan screenshot sebagai attachment report.
