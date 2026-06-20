## Project Description

| #1 Project Description | Field | Value | Contact/Notes |
| --- | --- | --- | --- |
| 1.0 | Judul Proyek | Signify AI - Aplikasi web penerjemah BISINDO real-time | Frontend produksi memakai ONNX Runtime Web |
| 2.0 | Kode Proyek | [Isi kode PBL] | Contoh format: PBL-IF-2026 |
| 3.0 | PIC Proyek | Meiske Priskilla Sahertian | NIM 3312401001, meiskesahertian7@gmail.com |
| 3.1 | Anggota Tim | Bunga Citra Lestari Situmorang | NIM 3312401034, bungasitumorang738@gmail.com |
| 4.0 | Client | PBL Project | [Email/WA stakeholder] |
| 5.0 | Tanggal Mulai | 05-06-2026 | Mengacu rencana pengujian |
| 6.0 | Tanggal Selesai | [Isi setelah UAT final] | Verifikasi lokal terakhir: 20-06-2026 |
| 7.0 | Lingkungan UAT | [Isi URL staging/production candidate] | Remote via URL atau local/staging server |

## Pembagian Tester dan Developer

| Anggota | NIM | Peran Saat Testing | Peran Saat Development |
| --- | --- | --- | --- |
| Meiske Priskilla Sahertian | 3312401001 | Tester untuk modul yang di-PIC-kan Bunga | Developer/PIC untuk modul yang diuji Bunga |
| Bunga Citra Lestari Situmorang | 3312401034 | Tester untuk modul yang di-PIC-kan Meiske | Developer/PIC untuk modul yang diuji Meiske |

## Test Cases

| #2 Test Cases Management | ID Test Case | Fitur / Modul | Pre-condition | Skenario Uji | Data Uji | Expected Result | Actual Result | Status | Developer/PIC Implementasi | Nama Tester | Tanggal Test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TC-001 | Login error handling | Landing/callback tersedia | Mulai OAuth gagal atau buka callback invalid | OAuth error/callback tanpa code | Error aman dan kembali ke landing tanpa detail sensitif | Cakupan integration lulus | Pass | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | 20-06-2026 |
| 2 | TC-011 | Browser inference frontend | Browser inference mock tersedia | Jalankan facade inference tanpa backend HTTP | Response deteksi, runtime error, frame kamera | Hasil/error dipetakan aman dan tidak request ke legacy FastAPI | Vitest lulus | Pass | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | 20-06-2026 |
| 3 | UAT-001 | Authentication | Staging/local candidate tersedia | Pengguna login melalui Google OAuth | Akun Google test | Session terbentuk dan pengguna masuk ke return path aman | Belum dieksekusi | Blocked | Meiske Priskilla Sahertian (3312401001) | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 4 | UAT-004 | Translate camera | Pengguna login dan kamera tersedia | Pengguna membuka translate dan mengaktifkan kamera | Kamera laptop/HP | Status kamera jelas sampai ready/detecting atau error informatif | Belum dieksekusi | Blocked | Bunga Citra Lestari Situmorang (3312401034) | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 5 | ... | ... | ... | ... | ... | ... | ... | Pass/Failed/Blocked | Developer/PIC | Tester | Tanggal |

## Defect Management

| #3 Defect Management | ID Defect | Tanggal Temuan | Tester | ID Test Case | Priority | Deskripsi | Langkah Reproduksi | Bukti Bug | Status | Kategori | Assigned To | Tanggal Fixed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | DEF-001 | 20-06-2026 | Bunga Citra Lestari Situmorang (3312401034) | TC-026 / NF-003 | Critical | Production build lokal gagal pada fase static page generation. | 1. `cd apps/frontend`<br>2. Jalankan `pnpm build` | `Next.js build worker exited with code: 1 and signal: null` | Open | Bug / Quality Gate | Meiske Priskilla Sahertian (3312401001) | [TBD] |
| 2 | DEF-003 | 20-06-2026 | Meiske Priskilla Sahertian (3312401001) | TC-025 | High | Playwright accessibility/E2E belum diverifikasi pada sesi ini. | 1. Siapkan browser dependency/CI<br>2. Jalankan `pnpm test:e2e` atau `pnpm test:a11y` | Belum ada report Playwright terbaru | Open | Test Blocker | Bunga Citra Lestari Situmorang (3312401034) | [TBD] |
| 3 | ... | ... | Tester | TC-... | Low/Medium/High/Critical | Deskripsi defect | Langkah reproduksi | Bukti bug | Open/Closed | Bug / Change Request | Developer/PIC | Tanggal |
