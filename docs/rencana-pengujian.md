# Rencana Pengujian Perangkat Lunak Signify AI

## 1. Project Information

| Atribut | Nilai |
|---|---|
| Nama proyek | Signify AI |
| Tim pengujian | Tim QA Signify AI |
| Klien | PBL Project |
| Tanggal dokumen | 5 Juni 2026 |
| Tujuan | Memastikan aplikasi siap produksi melalui pengujian fungsional, keamanan, reliabilitas, aksesibilitas, performa, usability, dan quality gate CI. |

### 1.1 Hasil audit codebase

| Area | Hasil audit aktual |
|---|---|
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, pnpm |
| Routing | Route publik `/`, `/how-it-works`, `/research`, `/terms-condition`; workspace terproteksi `/translate`, `/practice`, `/history`, `/reference`, `/profile`; callback `/auth/callback` |
| API frontend | `lib/translateApi.ts` memanggil FastAPI; data akun, preferensi, histori, dan latihan memakai Supabase JS/RPC |
| Backend | FastAPI, OpenCV, Ultralytics YOLO, PyTorch, Python 3.11 |
| Database | Supabase PostgreSQL, migration SQL, RLS, RPC atomik, pgTAP |
| Autentikasi | Supabase Auth dengan Google OAuth, SSR cookies, validasi JWT opsional pada `/predict` |
| Role/permission | `profiles.role` bernilai `user` atau `admin`; RLS isolasi per pengguna; hanya admin dapat menulis registry model |
| Form/input utama | Input gambar multipart pada `POST /api/v1/translate/predict`; kamera browser adalah sumber utama UI |
| Upload | API menerima JPEG, PNG, WebP maksimal 2 MB; tidak ada file-picker UI |
| Test setup | Vitest + RTL, Playwright + axe-core, pytest + coverage, pgTAP, Locust, GitHub Actions |
| Fitur tidak tersedia | Search/filter, editable CRUD umum, dan file-picker UI tidak ada sehingga dinyatakan tidak berlaku |

### 1.2 Risiko produksi yang ditemukan dan tindakan

| Risiko | Tindakan |
|---|---|
| Workspace hanya dilindungi client-side | Redirect server-side ditambahkan dengan return path relatif yang tervalidasi |
| OAuth callback dapat menerima open redirect | Nilai `next` eksternal/malformed ditolak |
| JWT secret hilang dapat menyebabkan auth fail-open | Token sekarang menghasilkan `503` jika secret tidak dikonfigurasi |
| Upload dibaca tanpa batas dan error inference bocor | Read dibatasi 2 MB, MIME/decode divalidasi, timeout dan error generik diterapkan |
| Metadata menunjuk aset/route yang tidak ada | Manifest, OG image, ikon, dan structured data diperbaiki |
| Nama tombol/fokus/heading tidak konsisten | Accessible name, fokus dialog, label, dan heading utama diperbaiki |
| Test backend mengacu layanan TensorFlow lama | Suite ditulis ulang untuk kontrak `YOLOService` dan `detections` |

## 2. Kebutuhan Fungsional

| ID | Kebutuhan fungsional |
|---|---|
| KF-01 | Pengguna dapat memulai Google OAuth, menerima error aman, dan keluar dari akun. |
| KF-02 | Pengguna anonim diarahkan dari route workspace ke login dan kembali ke tujuan aman setelah login. |
| KF-03 | Pengguna dapat membuka landing page, dokumentasi publik, dan workspace terautentikasi. |
| KF-04 | API dapat menerima gambar valid dan mengembalikan deteksi YOLO. |
| KF-05 | API menolak file tidak valid, terlalu besar, korup, atau request tidak terautentikasi saat auth diwajibkan. |
| KF-06 | Pengguna dapat membangun kalimat, menghapus, membersihkan, menambah spasi, dan memakai TTS. |
| KF-07 | Frontend menangani respons API sukses, retry transient, error validasi, dan kegagalan permanen. |
| KF-08 | Pengguna dapat membaca, memuat bertahap, menghapus, dan membersihkan histori dengan rollback saat gagal. |
| KF-09 | Pengguna dapat menyimpan dan mereset progres latihan serta melihat statistik referensi. |
| KF-10 | Preferensi aksesibilitas dan profil pengguna disinkronkan dengan Supabase. |
| KF-11 | RLS dan role membatasi data/aksi sesuai pemilik dan admin. |
| KF-12 | Health, classes, metadata, aset, dan route penting memiliki kontrak yang valid. |

## 3. Kebutuhan Non-Fungsional

| ID | Kebutuhan non-fungsional | Target |
|---|---|---|
| KNF-01 | Performa mixed/read | 100 concurrent users, ramp-up 10 user/detik, rata-rata <= 2,8 detik, P50 <= 2,0 detik, P95 <= 4,5 detik, P99 <= 6,0 detik, failure <= 1%, rata-rata >= 50 RPS |
| KNF-02 | Performa inference CPU baseline | 50 concurrent users, ramp-up 5 user/detik, target latensi/error sama, rata-rata >= 5 RPS |
| KNF-03 | Aksesibilitas | Tidak ada pelanggaran axe serious/critical; keyboard, label, nama tombol, heading, alt text, dan contrast diperiksa |
| KNF-04 | Usability | Rata-rata SUS minimum >= 70; target rekomendasi 78-85 |
| KNF-05 | Keamanan | Tidak ada secret ter-commit, open redirect, akses API tanpa izin, XSS aktif, atau stack trace produksi |
| KNF-06 | Reliabilitas | Build produksi berhasil; error transient memiliki retry terbatas; state error/empty/loading tersedia |
| KNF-07 | Coverage | Frontend statements/functions/lines >= 70% dan branches >= 60%; backend lines >= 70% dan branches >= 60% |

## 4. Rencana Pengujian Fungsional

Semua nama test otomatis menyertakan Test Case ID agar kegagalan dapat dilacak langsung ke tabel ini.

| Test Case ID | Description | Use Case | Actor | Pre-condition | Test Data | Test Scenario | Expected Output | Automation Status | Test File Path |
|---|---|---|---|---|---|---|---|---|---|
| TC-001 | OAuth tidak valid/gagal | Login | Pengguna anonim | Landing/callback tersedia | OAuth error atau callback tanpa code | Mulai OAuth gagal atau buka callback invalid | Error aman; kembali ke landing tanpa detail sensitif | Automated | `apps/frontend/tests/integration/LoginModal.integration.test.tsx`, `authRoutes.integration.test.ts`, `tests/e2e/auth.spec.ts` |
| TC-002 | OAuth valid | Login | Pengguna anonim | Mock Supabase test aktif | Google OAuth mock, `next=/history` | Login melalui flow OAuth dan callback nyata | Session cookie dibuat; tujuan aman terbuka | Automated | `apps/frontend/tests/e2e/auth.setup.ts`, `tests/integration/LoginModal.integration.test.tsx` |
| TC-003 | Logout | Logout | Pengguna login | Storage state autentik | Session test | Klik Sign out lalu akses route terproteksi | Kembali ke landing; route terproteksi meminta login | Automated | `apps/frontend/tests/e2e/workspace.spec.ts` |
| TC-004 | Redirect route terproteksi | Proteksi route | Pengguna anonim | Tidak ada session | `/history?page=2` | Buka route workspace | Redirect ke login; return path relatif dipertahankan | Automated | `apps/frontend/lib/authRedirect.test.ts`, `tests/integration/authRoutes.integration.test.ts`, `tests/e2e/auth.spec.ts` |
| TC-005 | Landing dan route publik | Akses publik | Semua pengguna | Frontend berjalan | Route publik | Buka landing dan dokumentasi | HTTP 200 dan body tampil | Automated | `apps/frontend/tests/e2e/routes.spec.ts` |
| TC-006 | Workspace translate dan state kamera | Terjemahan kamera | Pengguna login | OAuth test selesai | State idle/loading/ready/detecting/error | Buka `/translate` dan evaluasi state kamera | Workspace tampil; state dipetakan dengan benar | Automated | `apps/frontend/tests/e2e/workspace.spec.ts`, `lib/translateState.test.ts` |
| TC-007 | Prediksi gambar valid | Prediksi API | Pengguna/API client | Backend siap | PNG/JPEG/WebP valid | Kirim gambar ke kontrak `/predict` | `detections`, `inference_ms`, dan model valid | Automated | `apps/backend/tests/test_predict.py`, `test_ml_service.py` |
| TC-008 | Validasi input gambar | Prediksi API | Pengguna/API client | Backend siap | Missing, GIF, >2 MB, corrupt | Kirim input invalid | Ditolak dengan 400/413/422; form image wajib | Automated | `apps/backend/tests/test_predict.py` |
| TC-009 | Otorisasi API | Prediksi API | Anonymous/pengguna login | `REQUIRE_AUTH` sesuai skenario | Token hilang, invalid, expired, valid | Verifikasi dependency JWT | 401/403 untuk invalid; valid diterima; auth optional sesuai config | Automated | `apps/backend/tests/test_auth_deps.py` |
| TC-010 | Sentence builder dan TTS | Susun kalimat | Pengguna login | Workspace tersedia | Token huruf, spasi, clear, TTS | Edit dan ucapkan kalimat | Aksi dipanggil; tombol invalid disabled | Automated | `apps/frontend/tests/integration/SentenceBuilder.integration.test.tsx`, `lib/translateState.test.ts` |
| TC-011 | API success/retry/error frontend | Panggilan inference | Pengguna login | API mock tersedia | 200, network error, 503, 400 | Jalankan request dan retry policy | Retry hanya transient; hasil/error dipetakan aman | Automated | `apps/frontend/lib/translateApi.test.ts`, `lib/supabaseRetry.test.ts` |
| TC-012 | Baca/paginasi histori dan total | Histori | Pengguna login | Supabase mock tersedia | Row histori dan total | Ambil halaman histori | Data dipetakan; batas halaman/hasMore benar | Automated | `apps/frontend/tests/integration/userData.integration.test.ts`, `lib/userData.test.ts` |
| TC-013 | Delete/clear histori | Histori | Pengguna login | Ada histori | Session ID | Hapus satu atau seluruh histori | Query pemilik dijalankan; UI punya rollback saat gagal | Automated | `apps/frontend/tests/integration/userData.integration.test.ts`, `lib/serializedQueue.test.ts` |
| TC-014 | Loading/empty/error/retry | Histori | Pengguna login | Data source dapat gagal | Error sementara lalu empty | Load gagal, klik Retry | Error tampil; retry menghasilkan empty state | Automated | `apps/frontend/tests/integration/HistoryPage.integration.test.tsx` |
| TC-015 | Simpan progres latihan | Practice | Pengguna login | Session pemilik valid | Attempt benar/salah | Rekam attempt berurutan | Total, accuracy, dan streak diperbarui | Automated | `apps/frontend/tests/integration/userData.integration.test.ts`, `lib/userData.test.ts`, `supabase/tests/database/production_data_sync.test.sql` |
| TC-016 | Reset progres latihan | Practice | Pengguna login | Ada progres | User ID pemilik | Reset statistik | Attempt pengguna dihapus; statistik nol | Automated | `apps/frontend/tests/integration/userData.integration.test.ts`, `supabase/tests/database/production_data_sync.test.sql` |
| TC-017 | Statistik referensi | Reference | Pengguna login | Statistik tersedia | Statistik per huruf | Normalisasi statistik | Huruf hilang diberi nilai nol; counter invalid dibatasi | Automated | `apps/frontend/lib/userData.test.ts`, `tests/integration/userData.integration.test.ts` |
| TC-018 | Sinkronisasi preferensi | Settings | Pengguna login | Supabase tersedia | Theme, contrast, scale, TTS | Muat dan simpan preferensi | Shape DB dipetakan; data lama dibersihkan | Automated | `apps/frontend/components/providers/PreferencesProvider.test.ts`, `tests/integration/userData.integration.test.ts` |
| TC-019 | Profil dan analytics state | Profile | Pengguna login | User/profile tersedia atau kosong | Metadata user/profile | Muat profil dan fallback | Profil dipetakan; anonymous menghasilkan null | Automated | `apps/frontend/lib/accountData.test.ts`, `tests/integration/userData.integration.test.ts` |
| TC-020 | Role permission | Admin/user | Pengguna reguler/admin | RLS aktif | Role user/admin | Tulis registry model dan promosi role | User ditolak; admin diterima; self-promotion ditolak | Automated | `supabase/tests/database/production_data_sync.test.sql` |
| TC-021 | RLS, trigger, RPC idempotency, ownership | Data sync | Dua pengguna | Database reset | User A/User B, duplicate IDs | Jalankan trigger/RPC dan ganti owner | Isolasi terjaga; retry idempotent; queued write lintas akun ditolak | Automated | `supabase/tests/database/production_data_sync.test.sql`, `apps/frontend/tests/integration/userData.integration.test.ts` |
| TC-022 | Health/classes/error contract | Observability API | Operator/API client | Backend siap | Health, classes, service errors | Panggil endpoint dan simulasi failure | Kontrak valid; 422/503/504/500 generik | Automated | `apps/backend/tests/test_predict.py`, `test_ml_service.py` |
| TC-023 | Environment/auth hardening | Startup/security | Operator | Variasi env | `DEBUG=release`, secret kosong, auth wajib/opsional | Parse settings dan kirim token saat secret kosong | Startup tidak rusak oleh env asing; auth wajib fail closed, auth opsional berjalan anonim | Automated | `apps/backend/tests/test_settings.py`, `test_auth_deps.py`, `apps/frontend/tests/integration/userData.integration.test.ts` |
| TC-024 | XSS/open redirect protection | Security input | Pengguna/attacker | App berjalan | HTML payload, external `next` | Render payload dan buka callback | Payload di-escape; external redirect ditolak | Automated | `apps/frontend/tests/integration/SentenceBuilder.integration.test.tsx`, `authRoutes.integration.test.ts`, `lib/authRedirect.test.ts` |
| TC-025 | Aksesibilitas | Akses UI | Keyboard/screen-reader user | Browser test aktif | Landing, dialog, buttons | Scan axe dan navigasi keyboard | Tidak ada serious/critical; fokus/nama kontrol benar | Automated | `apps/frontend/tests/e2e/accessibility.spec.ts`, `tests/integration/LoginModal.integration.test.tsx`, `components/ui/Button.test.ts` |
| TC-026 | Route/metadata/assets smoke | Navigasi/SEO | Semua pengguna | Frontend berjalan | Route, manifest, hero, icon | Buka route dan aset metadata | Route/aset 200; manifest valid; tidak ada klaim `/search` | Automated | `apps/frontend/tests/e2e/routes.spec.ts`, `components/layout/mobile-nav/workspaceNavConfig.test.ts` |

### 4.1 Kasus tidak berlaku

| Fitur | Status | Alasan |
|---|---|---|
| Search/filter | Tidak berlaku | Tidak ditemukan fitur search/filter pada aplikasi aktual. |
| Editable CRUD umum | Tidak berlaku | Histori hanya mendukung read/delete/clear; tidak ada edit/create form umum. |
| UI file-picker | Tidak berlaku | Upload hanya tersedia sebagai kontrak API; UI utama memakai kamera. |
| Newsletter submit | Risiko produk | Form newsletter masih inert dan belum memiliki backend. |

## 5. Rencana Pengujian Non-Fungsional

### 5.1 Alasan pemilihan performance testing

Performance testing dipilih karena jalur utama menggabungkan render Next.js, autentikasi, query data, upload gambar, decode OpenCV, dan inference YOLO. Keterlambatan atau error pada salah satu tahap langsung mengganggu komunikasi real-time. Beban mixed/read dan inference dipisah agar bottleneck frontend/data tidak menutupi kapasitas model.

| Profil | Concurrent users | Ramp-up | Avg | P50 | P95 | P99 | Failure | RPS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Mixed/read | 100 | 10 user/detik | <= 2,8 s | <= 2,0 s | <= 4,5 s | <= 6,0 s | <= 1% | >= 50 |
| Inference CPU baseline | 50 | 5 user/detik | <= 2,8 s | <= 2,0 s | <= 4,5 s | <= 6,0 s | <= 1% | >= 5 |
| Auth opsional | 50-100 | 5-10 user/detik | Target sama | Target sama | Target sama | Target sama | <= 1% | Sesuai kapasitas test project |

Tool: Locust di `tests/performance/locustfile.py`. Performance tidak memblokir setiap pull request; dijalankan manual/terjadwal terhadap staging melalui `.github/workflows/performance.yml`.

Perintah:

```bash
LOCUST_PROFILE=mixed locust -f tests/performance/locustfile.py MixedReadUser \
  --headless --host "$STAGING_FRONTEND_URL" --users 100 --spawn-rate 10 --run-time 5m

LOCUST_PROFILE=inference locust -f tests/performance/locustfile.py InferenceUser \
  --headless --host "$STAGING_BACKEND_URL" --users 50 --spawn-rate 5 --run-time 5m
```

Pass jika seluruh target avg/P50/P95/P99/failure/RPS terpenuhi. Listener Locust memberi exit code gagal bila target terlewati.

### 5.2 Alasan pemilihan usability testing

Usability testing dipilih karena Signify AI ditujukan untuk komunikasi dan pembelajaran aksesibel. Keberhasilan teknis model tidak cukup apabila pengguna Tuli/BISINDO, pelajar, pengajar, atau evaluator kesulitan memahami status kamera, membangun kalimat, atau memulihkan error.

Rencana SUS:

| Atribut | Rencana |
|---|---|
| Jumlah partisipan | 8 |
| Komposisi | 4 pengguna Tuli/BISINDO, 2 pelajar/pengajar, 2 evaluator aksesibilitas/teknis |
| Tugas | Login, membuka translate, mengaktifkan kamera, membangun kalimat, memakai TTS, melihat histori, latihan, mengubah preferensi, logout |
| Skor minimum diterima | Rata-rata SUS >= 70 |
| Target rekomendasi | Rata-rata SUS 78-85 |
| Kriteria gagal | Mean < 70 atau hambatan kritis tidak dapat diselesaikan tanpa bantuan moderator |

### 5.3 Accessibility testing

Tool: Playwright, `@axe-core/playwright`, keyboard-only checks. Pengujian mencakup fokus dialog, Escape, navigasi, nama tombol, label form, heading, image alt, dan color contrast yang dapat dianalisis axe. Pass jika tidak ada pelanggaran axe ber-impact serious/critical dan alur keyboard kritis berhasil.

### 5.4 Security dan reliability

| Check | Implementasi/pass criteria |
|---|---|
| Required environment | Helper config gagal jelas saat Supabase frontend belum dikonfigurasi; backend settings diuji terhadap env asing |
| Secret leakage | TruffleHog memindai history commit pada setiap PR |
| Unauthorized API | 401/403, fail-closed 503 saat auth wajib, dan fallback anonim saat auth opsional diuji |
| Invalid input/upload | MIME, decode, ukuran 2 MB, dan RPC constraints diuji |
| XSS/open redirect | React escaping dan sanitizer relative path diuji |
| Stack trace | Error inference produksi hanya mengembalikan detail generik |
| Build produksi | `pnpm build` wajib berhasil di CI |
| Coverage | Frontend dan backend gate wajib terpenuhi |

### 5.5 CI quality gate

Pull request menjalankan:

1. Frontend install, lint, typecheck, unit, integration, coverage, build, Chromium E2E, dan accessibility.
2. Backend compile, pytest, line/branch coverage.
3. Supabase start, migration reset, pgTAP, schema lint, dan type generation.
4. Secret scan dan dependency audit.

Scheduled/manual CI menjalankan Chromium/Firefox/WebKit serta Locust staging. Artifact coverage, Playwright report, screenshot, trace, video, dan CSV performa diunggah.

### 5.6 Perintah verifikasi lokal

```bash
cd apps/frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:coverage
pnpm build
pnpm test:e2e

cd ../backend
python -m pytest -q --cov=app --cov-branch --cov-report=json:coverage.json
python scripts/check_coverage.py coverage.json

cd ../..
supabase start
supabase db reset
supabase test db
supabase db lint --level warning
```

### 5.7 Risiko tersisa dan pengujian manual

- Google OAuth nyata, izin kamera/perangkat fisik, dan eksekusi model nyata harus divalidasi di staging.
- Newsletter belum memiliki backend.
- Artifact Docker/deployment masih belum lengkap.
- Script TensorFlow/ML legacy masih stale dan dipisahkan dari quality gate aplikasi utama.
- Load test auth hanya boleh dijalankan pada Supabase test project yang dikonfigurasi.

### 5.8 Hasil verifikasi implementasi pada 5 Juni 2026

| Verifikasi | Hasil |
|---|---|
| `pnpm install --frozen-lockfile` | Lulus |
| `pnpm lint` | Lulus |
| `pnpm typecheck` | Lulus |
| `pnpm test` | Lulus, 81 test |
| `pnpm test:unit` | Lulus |
| `pnpm test:integration` | Lulus |
| `pnpm test:coverage` | Lulus: statements 91,19%; branches 80,87%; functions 89,87%; lines 96,77% |
| `pnpm build` | Lulus; 15 static/dynamic route berhasil dibuat |
| Backend pytest | Lulus, 21 test |
| Backend coverage | Lulus: lines 98,32%; branches 100% |
| `pnpm test:e2e` lokal | Suite dan server mulai, tetapi browser tidak dapat diluncurkan karena host tidak memiliki `libnspr4` dan interactive sudo tidak tersedia. CI memasang dependency melalui `playwright install --with-deps`. |
| Supabase reset/pgTAP/lint lokal | Belum dapat dijalankan karena Supabase CLI dan Docker tidak tersedia pada host; quality gate CI telah dikonfigurasi. |
| Locust staging | Belum dijalankan karena URL staging belum dikonfigurasi; workflow manual/terjadwal telah tersedia. |
