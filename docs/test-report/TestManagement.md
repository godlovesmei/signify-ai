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
| 6.0 | Tanggal Selesai | [Isi setelah UAT final] | Verifikasi lokal terakhir: 20-06-2026 |
| 7.0 | Lingkungan UAT | [Isi URL staging/production candidate] | Jika belum deploy: local/staging URL perlu dicatat saat UAT |

## Pembagian Tester dan Developer

Berdasarkan kesepakatan dengan dosen pengujian, penguji adalah dua anggota tim: Meiske Priskilla Sahertian dan Bunga Citra Lestari Situmorang. Pembagian dilakukan silang: test case yang diuji Meiske diasumsikan memiliki PIC implementasi/developer Bunga, dan test case yang diuji Bunga diasumsikan memiliki PIC implementasi/developer Meiske. Riwayat commit dipakai sebagai acuan umum: Meiske dominan pada auth, data, Supabase, backend/legacy, CI, dan model boundary; Bunga dominan pada UI, i18n, navigasi, translate/practice polish, dan reference/workspace experience.

| Anggota | NIM | Peran Saat Testing | Peran Saat Development |
| --- | --- | --- | --- |
| Meiske Priskilla Sahertian | 3312401001 | Tester untuk modul yang di-PIC-kan Bunga | Developer/PIC untuk modul yang diuji Bunga |
| Bunga Citra Lestari Situmorang | 3312401034 | Tester untuk modul yang di-PIC-kan Meiske | Developer/PIC untuk modul yang diuji Meiske |

## Test Cases Management - System/Automated Regression

Status pada tabel ini memakai bukti verifikasi lokal 20 Juni 2026 dan dokumen rencana pengujian. Status `Pass` berarti cakupan otomatis yang tersedia sudah lulus pada environment lokal. Status `Blocked` berarti test belum dapat dinyatakan selesai karena membutuhkan Playwright/browser dependency, Supabase/Docker, backend conda env, model lokal, staging, atau UAT manual.

| No | ID Test Case | Fitur / Modul | Pre-condition | Skenario Uji | Data Uji | Expected Result | Actual Result | Status | Developer/PIC Implementasi | Nama Tester | Tanggal Test |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TC-001 | Login error handling | Landing/callback tersedia | Mulai OAuth gagal atau buka callback invalid | OAuth error/callback tanpa code | Error aman, kembali ke landing tanpa detail sensitif | Cakupan Vitest integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 2 | TC-002 | OAuth valid | Mock Supabase test aktif | Login melalui flow OAuth dan callback valid | Google OAuth mock, `next=/history` | Session cookie dibuat dan tujuan aman terbuka | Cakupan integration lulus; E2E browser belum diverifikasi ulang | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 3 | TC-003 | Logout | Storage state autentik | Klik sign out lalu akses route terproteksi | Session test | Kembali ke landing dan route terproteksi meminta login | Playwright E2E belum dijalankan pada sesi ini | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 4 | TC-004 | Redirect route terproteksi | Tidak ada session | Buka route workspace | `/history?page=2` | Redirect ke login dan return path relatif dipertahankan | Unit/integration auth redirect lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 5 | TC-005 | Landing dan route publik | Frontend berjalan | Buka landing dan dokumentasi publik | `/`, `/how-it-works`, `/research`, `/terms-condition` | HTTP 200 dan body tampil | Route smoke Playwright belum dijalankan | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 6 | TC-006 | Workspace translate dan state kamera | Pengguna login | Buka `/translate` dan evaluasi state kamera | State idle/loading/ready/detecting/error | Workspace tampil dan state dipetakan benar | State logic lulus di Vitest, kamera nyata belum diverifikasi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 7 | TC-007 | Prediksi gambar valid legacy API | Backend legacy siap | Kirim gambar valid ke kontrak `/predict` | PNG/JPEG/WebP valid | Response berisi `detections`, `inference_ms`, dan model | Backend pytest tidak dapat dijalankan karena `ultralytics` belum tersedia | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 8 | TC-008 | Validasi input gambar legacy API | Backend legacy siap | Kirim input invalid ke `/predict` | Missing, GIF, >2 MB, corrupt | Ditolak dengan 400/413/422 dan form image wajib | Backend pytest blocked karena dependency ML belum tersedia | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 9 | TC-009 | Otorisasi legacy API | `REQUIRE_AUTH` sesuai skenario | Verifikasi dependency JWT | Token hilang, invalid, expired, valid | 401/403 untuk invalid; valid diterima; auth optional sesuai config | Backend pytest blocked karena dependency ML belum tersedia | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 10 | TC-010 | Sentence builder dan TTS | Workspace tersedia | Edit kalimat dan ucapkan kalimat | Token huruf, spasi, clear, TTS | Aksi dipanggil dan tombol invalid disabled | Vitest integration lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 11 | TC-011 | Browser inference frontend | Browser inference mock tersedia | Jalankan facade inference tanpa backend HTTP | Response deteksi, runtime error, frame kamera | Hasil/error dipetakan aman dan tidak request ke legacy FastAPI | Vitest lulus; kontrak no-FastAPI tervalidasi | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 12 | TC-012 | Baca/paginasi histori | Supabase mock tersedia | Ambil halaman histori | Row histori dan total | Data dipetakan; batas halaman/hasMore benar | Vitest unit/integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 13 | TC-013 | Delete/clear histori | Ada histori | Hapus satu atau seluruh histori | Session ID | Query pemilik dijalankan dan UI punya rollback saat gagal | Vitest unit/integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 14 | TC-014 | Loading/empty/error/retry histori | Data source dapat gagal | Load gagal lalu klik retry | Error sementara lalu empty | Error tampil dan retry menghasilkan empty state | Vitest integration lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 15 | TC-015 | Simpan progress latihan | Session pemilik valid | Rekam attempt berurutan | Attempt benar/salah | Total, accuracy, dan streak diperbarui | Frontend test lulus, database pgTAP belum dijalankan | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 16 | TC-016 | Reset progress latihan | Ada progress | Reset statistik | User ID pemilik | Attempt pengguna dihapus dan statistik nol | Frontend test lulus, database pgTAP belum dijalankan | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 17 | TC-017 | Statistik reference | Statistik tersedia | Normalisasi statistik per huruf | Statistik per huruf | Huruf hilang bernilai nol dan counter invalid dibatasi | Vitest lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 18 | TC-018 | Sinkronisasi preferences | Supabase mock tersedia | Muat dan simpan preferences | Theme, contrast, scale, TTS | Shape DB dipetakan dan data lama dibersihkan | Vitest provider/integration lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 19 | TC-019 | Profil dan analytics state | User/profile tersedia atau kosong | Muat profil dan fallback | Metadata user/profile | Profil dipetakan; anonymous menghasilkan null | Vitest lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 20 | TC-020 | Role permission | RLS aktif | Tulis registry model dan promosi role | Role user/admin | User ditolak, admin diterima, self-promotion ditolak | Supabase pgTAP belum dijalankan lokal | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 21 | TC-021 | RLS, trigger, RPC idempotency | Database reset | Jalankan trigger/RPC dan ganti owner | User A/User B, duplicate IDs | Isolasi terjaga dan retry idempotent | Frontend sebagian lulus; database pgTAP belum dijalankan | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 22 | TC-022 | Health/classes/error legacy API | Backend siap | Panggil endpoint dan simulasi failure | Health, classes, service errors | Kontrak valid dan error generik | Backend pytest blocked karena `ultralytics` belum tersedia | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 23 | TC-023 | Environment/auth hardening | Variasi env | Parse settings dan kirim token saat secret kosong | `DEBUG=release`, secret kosong, auth wajib/opsional | Startup aman, auth wajib fail closed, auth opsional anonim | Frontend env tests lulus; backend pytest blocked | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 24 | TC-024 | XSS/open redirect protection | App berjalan | Render payload dan buka callback | HTML payload, external `next` | Payload di-escape dan external redirect ditolak | Vitest unit/integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 25 | TC-025 | Accessibility | Browser test aktif | Scan axe dan navigasi keyboard | Landing, dialog, buttons | Tidak ada serious/critical; fokus/nama kontrol benar | Component tests lulus, Playwright axe belum dijalankan | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 26 | TC-026 | Route/metadata/assets smoke | Frontend berjalan | Buka route dan aset metadata | Route, manifest, hero, icon | Route/aset 200 dan manifest valid | Playwright route smoke belum dijalankan; build lokal gagal static generation | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 27 | TC-027 | Parity `.pt` vs ONNX | Model lokal dan runtime tersedia | Jalankan parity opt-in | `MODEL_PARITY_IMAGE`, `best.pt`, `best.onnx` | Top detection `.pt` dan ONNX sekelas dan box cukup dekat | Belum dijalankan karena dependency/model lokal perlu disiapkan | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |

## Test Cases Management - UAT Acceptance

Tabel berikut mengisi kebutuhan UAT dari `docs/test-report/SignoffUAT.md`. Semua status masih `Blocked` sampai sesi UAT benar-benar dilaksanakan oleh tester/stakeholder dan bukti pelaksanaannya tersedia.

| No | ID Test Case | Fitur / Modul | Pre-condition | Skenario Uji | Data Uji | Expected Result | Actual Result | Status | Developer/PIC Implementasi | Nama Tester | Tanggal Test |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | UAT-001 | Authentication | Staging/local candidate tersedia | Pengguna membuka login dan masuk melalui Google OAuth | Akun Google test | Session terbentuk dan pengguna masuk ke workspace/return path aman | Belum dieksekusi | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 2 | UAT-002 | Protected route | Pengguna belum login | Pengguna anonim membuka `/translate` atau `/history` | Route workspace | Pengguna diarahkan ke login dan tidak melihat data workspace | Belum dieksekusi | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 3 | UAT-003 | Public route | Browser tersedia | Pengguna membuka landing, how it works, research, terms condition | Route publik | Semua halaman tampil dan tidak meminta login | Belum dieksekusi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 4 | UAT-004 | Translate camera | Pengguna login dan kamera tersedia | Pengguna membuka translate dan mengaktifkan kamera | Kamera laptop/HP | Status kamera berubah jelas sampai ready/detecting atau error informatif | Belum dieksekusi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 5 | UAT-005 | ONNX browser inference | Kamera aktif dan model ONNX tersedia | Pengguna memperagakan huruf BISINDO di kamera | Huruf BISINDO A-Z | Aplikasi menampilkan prediksi, confidence, dan bounding box tanpa FastAPI | Belum dieksekusi | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 6 | UAT-006 | Inference recovery | Kamera/model dapat dibuat gagal | Pengguna menolak izin kamera atau memicu error model | Permission denied/error state | Aplikasi menampilkan pesan dan opsi pemulihan yang jelas | Belum dieksekusi | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 7 | UAT-007 | Sentence builder | Translate workspace aktif | Pengguna menyusun kalimat, spasi, hapus, dan clear | Hasil deteksi/teks manual dari UI | Kalimat berubah sesuai aksi dan state tetap jelas | Belum dieksekusi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 8 | UAT-008 | Text-to-speech | Browser mendukung TTS | Pengguna menekan tombol TTS pada kalimat | Kalimat hasil deteksi | Browser membacakan kalimat atau memberi status jika TTS tidak tersedia | Belum dieksekusi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 9 | UAT-009 | History | Pengguna login dan ada/akan dibuat histori | Pengguna membuka history, melihat detail, hapus item, clear history | Data histori akun test | Data tampil sesuai akun dan aksi hapus berjalan | Belum dieksekusi | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 10 | UAT-010 | Practice/reference | Pengguna login | Pengguna menjalankan latihan, reset progress, dan membuka reference | Sesi latihan test | Progress/statistik sesuai aksi dan referensi mudah dipahami | Belum dieksekusi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 11 | UAT-011 | Preferences/profile | Pengguna login | Pengguna mengubah theme, contrast, text scale, TTS settings, dan membuka profile | Preferensi UI | Preferensi diterapkan dan tersimpan | Belum dieksekusi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 12 | UAT-012 | Logout | Pengguna login | Pengguna logout lalu mencoba membuka route workspace | Session aktif | Session berakhir dan workspace kembali meminta login | Belum dieksekusi | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |

## Defect Management

Daftar ini adalah defect/test blocker awal dari verifikasi lokal dan dokumen laporan. Perbarui tabel ini dengan bug nyata dari UAT setelah sesi acceptance test berjalan.

| No | ID Defect | Tanggal Temuan | Tester | ID Test Case | Priority | Deskripsi | Langkah Reproduksi | Bukti Bug | Status | Kategori | Assigned To | Tanggal Fixed |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | DEF-001 | 20-06-2026 | Bunga Citra Lestari Situmorang (3312401034) | TC-026 / NF-003 | Critical | Production build lokal gagal pada fase static page generation. | 1. `cd apps/frontend`<br>2. Jalankan `pnpm build`<br>3. Build compile dan TypeScript selesai, lalu worker static generation exit code 1 | Output: `Next.js build worker exited with code: 1 and signal: null` | Open | Bug / Quality Gate | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 2 | DEF-002 | 20-06-2026 | Bunga Citra Lestari Situmorang (3312401034) | TC-007, TC-008, TC-009, TC-022, TC-023 | Medium | Backend legacy pytest belum dapat dijalankan pada environment aktif karena dependency `ultralytics` tidak tersedia. | 1. `cd apps/backend`<br>2. Jalankan `python -m pytest tests -q` | Output: `ModuleNotFoundError: No module named 'ultralytics'` | Open | Test Blocker / Environment | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 3 | DEF-003 | 20-06-2026 | Meiske Priskilla Sahertian (3312401001) | TC-025 | High | Playwright accessibility/E2E belum diverifikasi pada sesi ini. | 1. Siapkan browser dependency/CI<br>2. Jalankan `pnpm test:e2e` atau `pnpm test:a11y` dari `apps/frontend` | Belum ada report Playwright terbaru pada dokumen ini | Open | Test Blocker | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 4 | DEF-004 | 20-06-2026 | Meiske Priskilla Sahertian (3312401001), Bunga Citra Lestari Situmorang (3312401034) | UAT-001 - UAT-012 | High | Hasil UAT belum tersedia: belum ada bukti pelaksanaan, statistik pass/fail, saran tester, dan tanda tangan stakeholder. | 1. Laksanakan sesi UAT<br>2. Catat hasil seluruh UAT case<br>3. Lengkapi sign-off | `docs/test-report/SignoffUAT.md` masih draft | Open | Test Blocker / Documentation | Meiske Priskilla Sahertian (3312401001), Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 5 | DEF-005 | 20-06-2026 | Bunga Citra Lestari Situmorang (3312401034) | TC-015, TC-016, TC-020, TC-021 | Medium | Supabase reset/pgTAP/RLS test belum diverifikasi lokal karena membutuhkan Supabase CLI dan Docker/CI environment. | 1. Jalankan Supabase local/CI<br>2. `supabase db reset`<br>3. `supabase test db` | Belum ada report pgTAP terbaru pada dokumen ini | Open | Test Blocker / Environment | Meiske Priskilla Sahertian (3312401001) | [TBD] |

## Execution Summary

### System/Automated Regression

| Status | Jumlah | Persentase |
| --- | ---: | ---: |
| Pass | 12 | 44,44% |
| Failed | 0 | 0,00% |
| Blocked | 15 | 55,56% |
| Total | 27 | 100% |

### UAT Acceptance

| Status | Jumlah | Persentase |
| --- | ---: | ---: |
| Pass | 0 | 0,00% |
| Failed | 0 | 0,00% |
| Blocked | 12 | 100% |
| Total | 12 | 100% |

### Workload Pembagian Tester

| Tester | System Test Cases | UAT Cases | Total Assignment |
| --- | ---: | ---: | ---: |
| Meiske Priskilla Sahertian (3312401001) | 14 | 6 | 20 |
| Bunga Citra Lestari Situmorang (3312401034) | 13 | 6 | 19 |

### Defect Summary

| Severity | Open | Closed | Total |
| --- | ---: | ---: | ---: |
| Critical | 1 | 0 | 1 |
| High | 2 | 0 | 2 |
| Medium | 2 | 0 | 2 |
| Low | 0 | 0 | 0 |
| Total | 5 | 0 | 5 |

## Notes

- Pengujian produksi Signify AI harus berfokus pada frontend Next.js dan ONNX Runtime Web.
- Legacy/dev-only FastAPI tetap dicatat untuk contract/parity testing internal, tetapi tidak menjadi syarat UAT produksi.
- Setelah UAT dijalankan, isi kolom Actual Result, Status, Tanggal Test, dan update defect log berdasarkan hasil sebenarnya.
