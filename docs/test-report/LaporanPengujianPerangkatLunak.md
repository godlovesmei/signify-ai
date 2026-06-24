# Laporan Pengujian Perangkat Lunak Signify AI

# 1. Pendahuluan

| Atribut | Nilai |
| --- | --- |
| Kode PBL | [Isi kode PBL] |
| Version | 1.0 Draft |
| Document Title | Laporan Pengujian Perangkat Lunak Signify AI |
| Approved By | [Isi nama dosen/manajer proyek] |
| Nama Klien | PBL Project |
| Target Aplikasi | Signify AI - Aplikasi web penerjemah BISINDO real-time |
| Tim Pengujian | Meiske Priskilla Sahertian dan Bunga Citra Lestari Situmorang |
| Tanggal Dokumen | 22 Juni 2026 |

| Anggota | ID | Email | Posisi |
| --- | --- | --- | --- |
| [Nama Manajer Proyek] | [NIM/NIP] | [email] | Manajer Proyek |
| [Nama Dosen Pengujian] | [NIM/NIP] | [email] | Dosen Pengujian Perangkat Lunak |
| Meiske Priskilla Sahertian | 3312401001 | meiskesahertian7@gmail.com | Mahasiswa, QA dan Developer |
| Bunga Citra Lestari Situmorang | 3312401034 | bungasitumorang738@gmail.com | Mahasiswa, QA dan Developer |

### Pembagian Peran Pengujian

Berdasarkan kesepakatan dengan dosen pengujian, pengujian dilakukan oleh Meiske Priskilla Sahertian dan Bunga Citra Lestari Situmorang. Pembagian test dilakukan silang: test case yang diuji Meiske memiliki PIC implementasi/developer Bunga, sedangkan test case yang diuji Bunga memiliki PIC implementasi/developer Meiske. Pembagian rinci test case, tester, dan developer dicatat pada `docs/test-report/TestManagement.md`.

| Anggota | NIM | Assignment System Test | Assignment UAT | Developer/PIC yang Diuji |
| --- | --- | ---: | ---: | --- |
| Meiske Priskilla Sahertian | 3312401001 | 14 test case | 6 test case | Bunga Citra Lestari Situmorang |
| Bunga Citra Lestari Situmorang | 3312401034 | 13 test case | 6 test case | Meiske Priskilla Sahertian |

## 1.1 Tujuan Pengujian

Pengujian dilakukan untuk memastikan Signify AI memenuhi kebutuhan utama sebagai aplikasi penerjemah Bahasa Isyarat Indonesia (BISINDO) berbasis web. Fokus pengujian adalah kesesuaian fitur, stabilitas alur pengguna, keamanan dasar, aksesibilitas, dan kesiapan jalur produksi.

Jalur produksi yang diuji adalah aplikasi frontend Next.js yang menjalankan model YOLO11n ONNX langsung di browser menggunakan ONNX Runtime Web. FastAPI pada `apps/backend` tidak menjadi dependency produksi; backend tersebut hanya dipakai sebagai layanan legacy/dev-only untuk contract testing, parity testing `.pt` versus ONNX, dan eksperimen lokal server-side inference.

Tujuan spesifik pengujian:

- Memverifikasi alur autentikasi, proteksi route workspace, dan redirect aman.
- Memastikan fitur translate dapat memproses frame kamera melalui browser inference tanpa memanggil endpoint legacy FastAPI.
- Memastikan fitur sentence builder, TTS, history, practice, reference, profile, dan preferences berjalan sesuai kontrak.
- Memvalidasi perlindungan dasar terhadap open redirect, XSS, akses API tanpa izin, dan error yang membocorkan detail internal.
- Mengukur coverage automated test dan memastikan lint/typecheck lulus sebagai quality gate.
- Menyediakan dasar UAT, performance testing, dan usability testing sebelum rilis final.

## 1.2 Ruang Lingkup

### In Scope

- Frontend produksi `apps/frontend` berbasis Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, dan ONNX Runtime Web.
- Browser inference melalui `translateApi.ts`, `browserYoloRuntime.ts`, `yoloSession.ts`, preprocessing, postprocessing, dan facade hasil deteksi.
- Modul publik: landing page, how it works, research, terms condition.
- Modul workspace: translate, practice, history, reference, profile, settings/preferences.
- Autentikasi Supabase OAuth, callback route, redirect route terproteksi, dan logout.
- Data pengguna yang memakai Supabase/RLS: history, practice progress, profile, dan preferences.
- Automated testing frontend dengan Vitest, React Testing Library, Playwright/axe-core yang sudah disiapkan di codebase.
- Contract testing legacy backend FastAPI sebagai quality gate terpisah, bukan sebagai jalur produksi.
- Rencana performance testing Locust untuk mixed/read frontend dan baseline legacy inference.
- Rencana usability testing dengan SUS.

### Out of Scope

- Menjadikan FastAPI sebagai dependency runtime produksi frontend.
- Training ulang model YOLO, tuning dataset, dan evaluasi akurasi model baru.
- Validasi real Google OAuth, izin kamera perangkat fisik, dan performa model pada seluruh variasi device tanpa environment staging.
- Security penetration test penuh, audit compliance formal, dan audit infrastruktur cloud.
- Pengujian browser lama yang tidak didukung Next.js modern.
- Fitur yang tidak ada di aplikasi, seperti search/filter umum, editable CRUD umum, dan UI file-picker upload.

## 1.3 Batasan dan Kendala

- Verifikasi lokal pada 22 Juni 2026 berhasil untuk frontend lint, typecheck, Vitest, coverage, production build, Chromium E2E, accessibility, Playwright UAT evidence, dan backend legacy pytest pada conda env `signify-backend`.
- UAT evidence sudah tersedia sebagai Playwright report attachment untuk 12/12 skenario. Sign-off formal tetap membutuhkan tanda tangan stakeholder/manajer proyek/dosen pengujian.
- Performance testing Locust belum dapat dinyatakan selesai tanpa URL staging dan konfigurasi target test.
- Supabase local reset/pgTAP membutuhkan Supabase CLI dan Docker; hasilnya perlu diverifikasi pada environment yang menyediakan tool tersebut.
- Hasil real browser camera dan model runtime dapat berbeda per device karena ONNX Runtime Web memakai WebGPU jika tersedia dan fallback WASM jika tidak tersedia.

## 1.4 Metodologi Pengujian

Metodologi yang digunakan adalah kombinasi black-box, gray-box, dan automated testing.

| Jenis | Pendekatan |
| --- | --- |
| Unit testing | Vitest untuk logic helper, state, preprocessing/postprocessing YOLO, queue, auth redirect, dan data mapper. |
| Integration testing | React Testing Library dan mock Supabase untuk modal login, history page, sentence builder, preferences, dan user data. |
| E2E/accessibility | Playwright dan axe-core disiapkan untuk route smoke, auth mock, workspace, dan accessibility scan. |
| Contract testing | Pytest pada legacy FastAPI untuk validasi `/predict`, auth dependency, settings, health/classes, dan mapping YOLO. |
| Performance testing | Locust untuk mixed/read frontend dan optional legacy inference baseline. |
| Usability testing | SUS dengan skenario login, translate, sentence builder, TTS, history, practice, preferences, dan logout. |

Bug dikelola dengan alur: ditemukan, dicatat pada test case/issue, diperbaiki, diverifikasi ulang dengan automated test atau manual retest, lalu ditutup setelah hasilnya lulus.

## 1.5 Tanggal Pelaksanaan

Pengujian dan penyusunan dokumen mengacu pada rencana pengujian 5 Juni 2026 dan verifikasi lokal ulang pada 22 Juni 2026.

| No | Aktivitas | Durasi pelaksanaan |
| --- | --- | --- |
| 1 | Audit codebase dan identifikasi ruang lingkup pengujian | 1 minggu |
| 2 | Penyusunan rencana pengujian dan traceability test case | 1 minggu |
| 3 | Implementasi dan eksekusi automated system testing | 1 minggu |
| 4 | Verifikasi lokal ulang lint, typecheck, unit/integration test, dan coverage | 1 hari |
| 5 | UAT automated evidence | 1 hari |
| 6 | Performance testing staging dan usability testing | Perlu dilengkapi setelah pelaksanaan |

# 2. Kebutuhan Fungsional dan Non Fungsional

## 2.1 Kebutuhan Fungsional

| REF ID | Kebutuhan Fungsional |
| --- | --- |
| F001 | Pengguna dapat login melalui Google OAuth dan logout dari aplikasi. |
| F002 | Pengguna anonim diarahkan dari route workspace ke login dan kembali ke tujuan aman setelah login. |
| F003 | Pengguna dapat membuka route publik: landing page, how it works, research, dan terms condition. |
| F004 | Pengguna dapat membuka workspace terautentikasi: translate, practice, history, reference, dan profile. |
| F005 | Browser inference dapat memproses frame kamera dengan YOLO11n ONNX melalui ONNX Runtime Web tanpa FastAPI produksi. |
| F006 | Pengguna dapat membangun kalimat dari hasil deteksi, menambah spasi, menghapus karakter, membersihkan kalimat, dan memakai TTS. |
| F007 | Aplikasi dapat menangani hasil inference sukses, error runtime/model, loading, empty state, retry, dan fallback UI. |
| F008 | Pengguna dapat membaca, memuat bertahap, menghapus, dan membersihkan history terjemahan. |
| F009 | Pengguna dapat menjalankan practice, menyimpan progress, mereset progress, dan melihat statistik reference. |
| F010 | Pengguna dapat menyimpan preferences aksesibilitas seperti theme, contrast, text scale, dan TTS settings. |
| F011 | Supabase RLS membatasi data sesuai pemilik dan role user/admin. |
| F012 | Legacy backend contract dapat memvalidasi input gambar, auth optional/required, health/classes, dan error response untuk kebutuhan parity/dev-only. |

## 2.2 Kebutuhan Non Fungsional Aplikasi

| REF ID | Kebutuhan Non-Fungsional |
| --- | --- |
| NF001 | Automated test frontend mencapai minimal statements/functions/lines 70% dan branches 60%. |
| NF002 | Lint dan TypeScript typecheck harus lulus tanpa warning/error. |
| NF003 | Production build harus berhasil sebelum rilis. |
| NF004 | Aplikasi tidak boleh bergantung pada legacy FastAPI untuk inference produksi. |
| NF005 | Tidak ada open redirect, XSS aktif, akses API tanpa izin, atau stack trace sensitif pada respons produksi. |
| NF006 | Accessibility tidak memiliki violation axe serious/critical pada alur utama. |
| NF007 | Performance mixed/read menargetkan rata-rata <= 2,8 detik, P95 <= 4,5 detik, failure <= 1%, dan >= 50 RPS pada staging. |
| NF008 | Usability testing menargetkan skor SUS rata-rata minimal >= 70, dengan target rekomendasi 78-85. |

# 3. Executive Summary

Berdasarkan audit codebase dan verifikasi lokal 22 Juni 2026, jalur pengujian yang benar untuk Signify AI adalah jalur browser inference menggunakan ONNX Runtime Web. Hal ini sesuai dengan arsitektur produksi aplikasi: frame kamera diproses lokal di browser, model YOLO11n dijalankan sebagai artifact ONNX, dan hasil deteksi diteruskan ke fitur translate/practice. Legacy FastAPI tidak boleh dijadikan dependency produksi frontend.

Hasil automated test menunjukkan kondisi code-level yang baik: lint lulus, typecheck lulus, 25 test file Vitest lulus dengan 107 test, dan coverage frontend melebihi target minimum. Coverage frontend aktual adalah statements 91,42%, branches 80,95%, functions 91,01%, dan lines 96,74%. Production build juga lulus dengan static generation 27/27, Chromium E2E lulus 27/27 test, dan backend legacy contract test lulus 23 passed, 1 skipped pada conda env `signify-backend`.

Playwright UAT evidence pada 22 Juni 2026 lulus 12/12 skenario dengan screenshot attachment untuk authentication, protected route, public route, translate camera, browser inference, recovery, sentence builder, TTS, history, practice/reference, preferences/profile, dan logout. Perbaikan penting yang dilakukan adalah menampilkan bounding box pada overlay kamera ketika deteksi tersedia.

Status rekomendasi: layak lanjut ke deployment/staging dengan kondisi. Final release formal masih menunggu tanda tangan stakeholder, performance testing Locust bila diwajibkan, usability testing SUS, Supabase pgTAP/Docker bila area database ikut dinilai, serta model parity `.pt` versus ONNX bila diperlukan.

# 4. Hasil Pengujian

## 4.1 Hasil System Testing

### Ringkasan Eksekusi Lokal 22 Juni 2026

| Quality Gate | Command | Hasil | Catatan |
| --- | --- | --- | --- |
| Frontend lint | `pnpm lint` dari `apps/frontend` | SUCCESS | ESLint lulus dengan `--max-warnings=0`. |
| Frontend typecheck | `pnpm typecheck` dari `apps/frontend` | SUCCESS | TypeScript `tsc --noEmit` lulus. |
| Frontend unit/integration | `pnpm test` dari `apps/frontend` | SUCCESS | 25 test file lulus, 107 test lulus. |
| Frontend coverage | `pnpm test:coverage` dari `apps/frontend` | SUCCESS | Statements 91,42%; branches 80,95%; functions 91,01%; lines 96,74%. |
| Frontend production build | `pnpm build` dari `apps/frontend` | SUCCESS | Compile, TypeScript, dan static generation 27/27 lulus. |
| Frontend Chromium E2E/accessibility | `pnpm test:e2e` dari `apps/frontend` | SUCCESS | 27/27 Playwright test lulus; axe serious/critical 0. |
| UAT evidence | `pnpm exec playwright test --project=chromium tests/e2e/uat.spec.ts` | SUCCESS | 12/12 UAT scenario lulus dengan attachment screenshot. |
| Backend legacy pytest/coverage | `conda run -n signify-backend python -m pytest -q --cov=app --cov-branch --cov-report=json:coverage.json` dari `apps/backend` | SUCCESS | 23 passed, 1 skipped; coverage lines 99% dan branches 100%. |

### Ringkasan Persentase

Untuk quality gate yang dapat dijalankan lokal pada 22 Juni 2026:

| Status | Jumlah | Persentase |
| --- | ---: | ---: |
| SUCCESS | 8 | 100% |
| FAIL | 0 | 0,00% |
| BLOCKED | 0 | 0,00% |
| Total | 8 | 100% |

Untuk test frontend yang dieksekusi oleh Vitest:

| Metrik | Hasil |
| --- | ---: |
| Test file lulus | 25/25 |
| Test case lulus | 107/107 |
| Success rate test case | 100% |

### Coverage Frontend

| Coverage | Hasil | Target Minimum | Status |
| --- | ---: | ---: | --- |
| Statements | 91,42% | 70% | PASS |
| Branches | 80,95% | 60% | PASS |
| Functions | 91,01% | 70% | PASS |
| Lines | 96,74% | 70% | PASS |

### Catatan Jalur Inference

System testing untuk inference produksi harus berfokus pada ONNX Runtime Web. Test `translateApi.test.ts` memvalidasi bahwa facade `predictFromImageData` menggunakan `predictWithBrowserYolo` dan tidak memanggil endpoint legacy FastAPI `/api/v1/translate/predict`. Dengan demikian, hasil pengujian produksi tidak boleh bergantung pada server FastAPI lokal.

Legacy backend tetap relevan untuk:

- Contract test API lama/dev-only.
- Validasi MIME, ukuran upload, decode error, timeout, auth dependency, dan error response.
- Parity smoke test `.pt` versus ONNX jika model lokal dan environment runtime tersedia.

## 4.2 Hasil User Acceptance Testing

UAT dilakukan untuk memvalidasi apakah alur Signify AI dapat dipahami dan diterima oleh pengguna akhir, terutama pengguna yang membutuhkan dukungan komunikasi BISINDO, pelajar/pengajar, dan evaluator aksesibilitas. Fitur yang perlu diuji pada UAT adalah login, membuka translate workspace, mengaktifkan kamera, membaca hasil deteksi, membangun kalimat, memakai TTS, melihat history, menjalankan practice, mengubah preferences, dan logout.

Status saat dokumen ini dibuat: Playwright UAT evidence pada 22 Juni 2026 lulus 12/12 skenario. Setiap skenario membuat screenshot attachment pada Playwright report. Tester UAT yang disiapkan adalah Meiske Priskilla Sahertian (3312401001) dan Bunga Citra Lestari Situmorang (3312401034) dengan pembagian silang sesuai `docs/test-report/TestManagement.md`. Approval formal tetap perlu tanda tangan stakeholder pada `docs/test-report/SignoffUAT.md`.

Statistik UAT 22 Juni 2026:

| Metrik UAT | Nilai |
| --- | --- |
| Tanggal pelaksanaan | 22 Juni 2026 |
| Lokasi/media | Local automated UAT evidence, Playwright Chromium |
| Jumlah tester | 2 tester: Meiske Priskilla Sahertian dan Bunga Citra Lestari Situmorang |
| Jumlah scenario | 12 UAT scenario |
| Scenario berhasil | 12 |
| Scenario gagal | 0 |
| Success rate | 100% |
| Saran utama tester | Lanjutkan ke staging dan lengkapi tanda tangan approval, performance Locust, dan usability SUS bila diwajibkan. |

## 4.3 Hasil Performance Testing

Performance testing diperlukan karena Signify AI memiliki alur real-time yang sensitif terhadap keterlambatan: render Next.js, autentikasi, query data, kamera browser, ONNX inference lokal, dan penyimpanan data Supabase. Pengujian performa produksi harus dipisahkan dari legacy backend inference agar bottleneck tidak tercampur.

Status saat dokumen ini dibuat: performance testing staging belum dapat dinyatakan final karena belum ada URL staging dan hasil Locust yang dilampirkan. Codebase sudah menyediakan `tests/performance/locustfile.py` untuk profil mixed/read dan legacy inference baseline.

Target performance berdasarkan rencana pengujian:

| Profil | Virtual User | Ramp-up | Avg | P95 | Failure Rate | RPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mixed/read production | 100 | 10 user/detik | <= 2,8 s | <= 4,5 s | <= 1% | >= 50 |
| Legacy inference CPU baseline | 50 | 5 user/detik | <= 2,8 s | <= 4,5 s | <= 1% | >= 5 |

Catatan penting: performa browser ONNX pada kamera nyata tidak cukup diuji dengan Locust karena inference berjalan di device pengguna. Untuk jalur ONNX produksi, perlu tambahan manual/staging measurement pada beberapa device/browser dengan WebGPU dan WASM fallback.

## 4.4 Hasil Usability Testing

Usability testing dipilih karena keberhasilan teknis model belum cukup jika pengguna kesulitan memahami status kamera, hasil deteksi, kontrol kalimat, TTS, history, practice, atau preferences aksesibilitas. Metode yang disarankan adalah System Usability Scale (SUS) dengan minimal 8 partisipan: 4 pengguna Tuli/BISINDO, 2 pelajar/pengajar, dan 2 evaluator aksesibilitas/teknis.

Status saat dokumen ini dibuat: usability testing belum dapat dinyatakan final karena belum tersedia skor responden dan perhitungan SUS. Target minimum yang digunakan adalah rata-rata SUS >= 70, dengan target rekomendasi 78-85.

Tabel hasil yang perlu diisi setelah pelaksanaan:

| Metrik Usability | Nilai |
| --- | --- |
| Jumlah responden | [Isi jumlah responden] |
| Rata-rata skor SUS | [Isi rata-rata] |
| Skor tertinggi | [Isi skor] |
| Skor terendah | [Isi skor] |
| Interpretasi | [Acceptable/Good/Excellent sesuai hasil] |
| Masalah usability utama | [Isi ringkasan] |
| Rekomendasi perbaikan | [Isi rekomendasi] |

# 5. Kesimpulan

Pengujian menunjukkan bahwa jalur frontend produksi Signify AI sudah memiliki automated test dan coverage yang kuat. Lint, typecheck, unit test, integration test, coverage, production build, Chromium E2E, accessibility, UAT evidence, dan backend legacy contract test lulus pada verifikasi lokal 22 Juni 2026. Jalur inference produksi juga sudah dipisahkan dari legacy backend: aplikasi menggunakan ONNX Runtime Web di browser, bukan FastAPI, untuk memproses frame kamera.

Kesimpulan utama:

- ONNX Runtime Web adalah jalur testing utama untuk produksi.
- Legacy/dev-only FastAPI hanya digunakan untuk contract/parity testing dan tidak boleh menjadi syarat deploy frontend produksi.
- Frontend automated test lulus 107/107 Vitest dan 27/27 Playwright Chromium test dengan coverage di atas target.
- Production build lokal lulus dengan static generation 27/27.
- UAT evidence lulus 12/12 skenario dengan screenshot attachment.
- Backend legacy contract test lulus 23 passed, 1 skipped pada conda env `signify-backend` dengan coverage lines 99% dan branches 100%.
- Performance testing staging, usability testing, dan tanda tangan sign-off formal belum lengkap.

Rekomendasi:

- Simpan/lampirkan Playwright report UAT sebagai bukti screenshot pass.
- Jalankan Locust terhadap staging URL dan lampirkan grafik/CSV hasil.
- Lakukan usability testing SUS dan lampirkan tabel nilai serta interpretasi.
- Jalankan Supabase pgTAP/Docker dan parity `.pt` versus ONNX bila area database/model internal ikut dinilai.

# LAMPIRAN A. SOURCE CODE

Link GitHub public:

- [Isi link repository GitHub public]

Path source code dan test penting:

- Frontend produksi: `apps/frontend`
- Browser inference: `apps/frontend/lib/translateApi.ts`, `apps/frontend/lib/browserYoloRuntime.ts`, `apps/frontend/lib/yoloSession.ts`
- Model ONNX public artifact: `apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx`
- Unit/integration frontend: `apps/frontend/**/*.test.ts`, `apps/frontend/tests/integration`
- E2E/accessibility: `apps/frontend/tests/e2e`
- Legacy/dev-only backend: `apps/backend`
- Backend tests: `apps/backend/tests`
- Performance tests: `tests/performance/locustfile.py`
- Database/RLS tests: `supabase/tests/database/production_data_sync.test.sql`

# LAMPIRAN B. RENCANA PENGUJIAN

Dokumen rencana pengujian:

- `docs/rencana-pengujian.md`
- Link Drive rencana pengujian: [Isi link Drive/OneDrive]

# LAMPIRAN C: DOKUMEN UAT

Dokumen sign-off UAT:

- Draft/hasil sign-off UAT: `docs/test-report/SignoffUAT.md`
- Screenshot UAT: attachment Playwright report dari `apps/frontend/tests/e2e/uat.spec.ts`

Dokumen UAT yang sudah disetujui:

- Link Drive/OneDrive dokumen UAT: [Isi setelah UAT selesai]

# LAMPIRAN D: SYSTEM TESTING

Spreadsheet system testing:

- `docs/test-report/2. Test Management.xlsx`
- Draft markdown terisi: `docs/test-report/TestManagement.md`
- Link spreadsheet system testing: [Isi link Drive/OneDrive]

Ringkasan hasil automated system testing lokal 22 Juni 2026:

- `pnpm lint`: SUCCESS
- `pnpm typecheck`: SUCCESS
- `pnpm test`: SUCCESS, 25 test file dan 107 test lulus
- `pnpm test:coverage`: SUCCESS, statements 91,42%, branches 80,95%, functions 91,01%, lines 96,74%
- `pnpm build`: SUCCESS, static generation 27/27
- `pnpm test:e2e`: SUCCESS, 27 Playwright test lulus
- `pnpm exec playwright test --project=chromium tests/e2e/uat.spec.ts`: SUCCESS, 12 UAT scenario lulus dengan screenshot attachment
- `conda run -n signify-backend python -m pytest tests -q`: SUCCESS, 23 passed dan 1 skipped
- `conda run -n signify-backend python -m pytest -q --cov=app --cov-branch --cov-report=json:coverage.json`: SUCCESS, coverage lines 99% dan branches 100%

# LAMPIRAN E: PROSES PERFORMANCE TESTING

Tool:

- Locust
- File: `tests/performance/locustfile.py`

Perintah yang disiapkan:

```bash
LOCUST_PROFILE=mixed locust -f tests/performance/locustfile.py MixedReadUser \
  --headless --host "$STAGING_FRONTEND_URL" --users 100 --spawn-rate 10 --run-time 5m

LOCUST_PROFILE=inference locust -f tests/performance/locustfile.py InferenceUser \
  --headless --host "$LEGACY_BACKEND_URL" --users 50 --spawn-rate 5 --run-time 5m
```

Screenshot penggunaan tools dan grafik hasil:

- [Isi link/screenshot setelah performance test dijalankan]

# LAMPIRAN F: PROSES USABILITY TESTING

Hasil tabel nilai responden, perhitungan rumus SUS, dan interpretasi:

- [Isi setelah usability testing selesai]

Format minimum yang perlu dilampirkan:

| Responden | Skor SUS | Catatan |
| --- | ---: | --- |
| R1 | [skor] | [catatan] |
| R2 | [skor] | [catatan] |
| R3 | [skor] | [catatan] |
| R4 | [skor] | [catatan] |
| R5 | [skor] | [catatan] |
| R6 | [skor] | [catatan] |
| R7 | [skor] | [catatan] |
| R8 | [skor] | [catatan] |

Interpretasi akhir:

- Rata-rata SUS: [isi]
- Kategori: [isi]
- Rekomendasi: [isi]
