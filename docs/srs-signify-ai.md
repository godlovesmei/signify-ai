# Software Requirements Specification (SRS)
## Signify AI

Version: 1.0
Status: Aligned with the current codebase

Catatan ruang lingkup: dokumen ini merefleksikan implementasi aktif pada `apps/frontend` dan `apps/backend`. Bagian lama yang membahas MediaPipe, TensorFlow, atau route `collect` tidak menjadi bagian dari spesifikasi ini karena tidak lagi dipakai di runtime aktif.

## 1. Introduction

### 1.1 Purpose
Dokumen ini mendefinisikan kebutuhan fungsional dan nonfungsional untuk Signify AI, yaitu aplikasi web pengenal bahasa isyarat BISINDO real-time berbasis browser. SRS ini ditulis agar dapat dipakai sebagai acuan laporan tugas akhir, pengembangan lanjutan, dan pengujian fitur.

### 1.2 Scope
Signify AI menyediakan alur berikut:
1. Pengguna login dengan Google OAuth melalui Supabase.
2. Pengguna membuka workspace yang dilindungi autentikasi.
3. Browser menangkap frame webcam dan mengirimkan gambar ke backend FastAPI.
4. Backend menjalankan inferensi model YOLO11 dan mengembalikan hasil deteksi.
5. Frontend menstabilkan prediksi, menyusun transcript, dan dapat membacakan hasil dengan text-to-speech.
6. Riwayat translasi dan statistik latihan disimpan di browser melalui `localStorage`.

### 1.3 Definitions and Acronyms
| Term | Definition |
|---|---|
| BISINDO | Bahasa Isyarat Indonesia |
| SRS | Software Requirements Specification |
| OCR | Tidak digunakan dalam sistem ini |
| OAuth | Protokol autentikasi pihak ketiga |
| JWT | JSON Web Token |
| TTS | Text-to-Speech |
| YOLO | Model object detection yang dipakai backend |
| localStorage | Penyimpanan browser sisi klien |

### 1.4 References
1. Codebase aktif pada `apps/frontend` dan `apps/backend`.
2. Dokumentasi arsitektur pada `docs/miro-project-overview.md`.
3. Skema basis data referensi pada `docs/database-erd.md`.
4. Konfigurasi backend pada `apps/backend/app/config/settings.py`.
5. Endpoint prediksi pada `apps/backend/app/api/v1/endpoints/translation.py`.

## 2. Overall Description

### 2.1 Product Perspective
Signify AI adalah aplikasi web dengan arsitektur berikut:
1. Frontend Next.js menangani UI, kamera, transcript, TTS, dan penyimpanan data personal di browser.
2. Backend FastAPI menangani inferensi YOLO11 dan validasi input gambar.
3. Supabase menangani autentikasi dan sesi pengguna.
4. Model YOLO11 dimuat saat backend startup melalui service singleton.

### 2.2 Product Functions Summary
1. Menyediakan landing page publik dan halaman dokumentasi.
2. Menyediakan login Google OAuth.
3. Memproteksi workspace utama untuk pengguna yang sudah login.
4. Menjalankan translasi real-time dari webcam ke teks.
5. Menyediakan history sesi translasi.
6. Menyediakan practice mode dengan target huruf adaptif.
7. Menyediakan reference alphabet A-Z beserta statistik latihan.
8. Menyediakan pengaturan aksesibilitas seperti tema, text scale, contrast, dan TTS.
9. Menyediakan endpoint kesehatan dan metadata kelas model.

### 2.3 User Classes
| User Class | Characteristics | Main Needs |
|---|---|---|
| Visitor | Belum login | Mengakses landing page dan dokumentasi publik |
| Authenticated User | Sudah login via Google OAuth | Menggunakan translate, practice, history, dan reference |
| Maintainer / Developer | Mengelola sistem | Memantau health, konfigurasi, dan perilaku backend |

### 2.4 Operating Environment
1. Browser modern pada desktop dan mobile.
2. Akses kamera untuk fitur translasi dan practice.
3. Akses internet untuk login Supabase dan pemanggilan backend.
4. Backend Python dengan FastAPI dan Uvicorn.
5. Environment variable untuk CORS, model path, dan auth.

### 2.5 Design Constraints
1. Input prediksi backend menerima file gambar, bukan video mentah.
2. Format yang didukung backend dibatasi pada `image/jpeg`, `image/png`, dan `image/webp`.
3. Ukuran file upload dibatasi 2 MB.
4. Workspace utama harus tetap dilindungi autentikasi.
5. Riwayat dan statistik latihan saat ini harus tetap konsisten dengan penyimpanan browser.
6. Model aktif backend adalah `models/exports/bisindo_yolo/best.pt` kecuali diubah lewat konfigurasi.

### 2.6 Assumptions and Dependencies
1. Pengguna memberi izin akses kamera.
2. Pengguna memiliki akun Google atau Supabase auth yang valid.
3. Browser mendukung Web Speech API untuk TTS.
4. Backend dapat memuat model YOLO11 saat startup.
5. Supabase JWT secret tersedia jika validasi token ingin ditegakkan penuh.

## 3. Specific Requirements

### 3.1 Functional Requirements

| ID | Requirement | Description | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-01 | Public landing page | Sistem harus menyediakan landing page publik yang menjelaskan nilai utama Signify AI. | High | Pengguna anonim dapat membuka halaman utama tanpa login. |
| FR-02 | Public documentation pages | Sistem harus menyediakan halaman `how-it-works`, `research`, dan `terms-condition` yang dapat diakses publik. | Medium | Halaman dokumentasi dapat dibuka tanpa autentikasi dan menampilkan konten statis. |
| FR-03 | Google OAuth login | Sistem harus mengizinkan pengguna login melalui Google OAuth dengan Supabase. | High | Pengguna dapat memulai sign-in dari modal login dan berhasil menerima sesi autentikasi. |
| FR-04 | OAuth callback handling | Sistem harus memproses callback OAuth di route `/auth/callback`. | High | Setelah login berhasil, sesi Supabase dapat ditukar dan disimpan di browser. |
| FR-05 | Protected workspace routing | Sistem harus membatasi akses ke route `/translate`, `/practice`, `/history`, dan `/reference` hanya untuk pengguna yang terautentikasi. | High | Pengguna yang belum login tidak melihat isi workspace dan diarahkan ke alur login. |
| FR-06 | Camera access | Sistem harus meminta izin kamera dan mengaktifkan webcam untuk mode translasi dan practice. | High | Kamera dapat dinyalakan, dihentikan, dan dipilih orientasinya sesuai perangkat. |
| FR-07 | Frame capture | Sistem harus menangkap frame webcam secara periodik untuk diproses. | High | Capture loop berjalan pada interval 200 ms di desktop dan 300 ms di mobile. |
| FR-08 | Image upload to backend | Sistem harus mengirim frame hasil capture sebagai multipart file ke backend prediksi. | High | Frontend mengirim file ke `POST /api/v1/translate/predict` dan menerima respons JSON. |
| FR-09 | YOLO inference | Backend harus menjalankan inferensi YOLO11 pada gambar yang diterima. | High | Respons prediksi berisi daftar deteksi, confidence, box koordinat, model name, dan `inference_ms`. |
| FR-10 | Input validation | Backend harus menolak file dengan format tidak didukung, ukuran terlalu besar, atau gambar yang gagal didecode. | High | Request invalid menghasilkan respons error yang sesuai: 400, 413, atau 422. |
| FR-11 | Prediction stabilization | Frontend harus menstabilkan hasil prediksi menggunakan fast-commit, vote buffer, dan cooldown huruf yang sama. | High | Prediksi tidak langsung ditampilkan sebagai transcript tanpa filter stabilisasi. |
| FR-12 | Transcript building | Sistem harus menyusun huruf hasil commit menjadi transcript berjalan. | High | Huruf yang dikomit tampil dalam urutan yang benar dan dapat dikosongkan atau diperbarui per sesi. |
| FR-13 | Text-to-speech playback | Sistem harus dapat membacakan teks atau huruf melalui browser speech synthesis ketika fitur suara diaktifkan. | Medium | Saat voice enabled, pengguna dapat memicu pembacaan dan audio keluar dari browser. |
| FR-14 | History persistence | Sistem harus menyimpan hasil commit ke riwayat sesi di `localStorage`. | High | Reload browser tidak menghapus history, dan entry baru tetap tergabung ke session yang benar. |
| FR-15 | History management | Sistem harus menyediakan fitur lihat, copy, hapus session, dan clear all pada history. | High | Pengguna dapat menyalin transcript, menghapus session tertentu, atau mengosongkan seluruh history. |
| FR-16 | Practice mode | Sistem harus menyediakan mode latihan huruf dengan target adaptif. | High | Setelah berhasil atau skip, target berikutnya dipilih berdasarkan statistik latihan terkini. |
| FR-17 | Practice scoring | Sistem harus mencatat percobaan latihan benar dan salah untuk setiap huruf. | High | Statistik per huruf dan total latihan diperbarui dan tersimpan di `localStorage`. |
| FR-18 | Reference gallery | Sistem harus menampilkan galeri alfabet A-Z beserta statistik latihan per huruf. | Medium | Setiap kartu huruf menampilkan gambar referensi, jumlah benar/salah, dan persentase akurasi. |
| FR-19 | Accessibility preferences | Sistem harus menyimpan preferensi tema, high contrast, text scale, TTS speed, dan TTS volume. | Medium | Preferensi tetap berlaku setelah reload browser. |
| FR-20 | Auth session handling | Sistem harus membaca sesi Supabase yang aktif dan memperbarui token akses saat status auth berubah. | High | Frontend dapat mengambil token akses dari session dan menggunakannya pada request backend. |
| FR-21 | Health monitoring | Backend harus menyediakan endpoint health untuk status layanan dan model. | Medium | `GET /health` mengembalikan status, path model, jumlah kelas, dan waktu load. |
| FR-22 | Class metadata | Backend harus menyediakan endpoint untuk mengambil daftar kelas model. | Medium | `GET /api/v1/translate/classes` mengembalikan mapping nama kelas dan total kelas. |
| FR-23 | Request retry behavior | Frontend harus melakukan retry terbatas saat request prediksi gagal karena kondisi sementara. | Medium | Request dengan status 429 atau 5xx dicoba ulang sesuai konfigurasi retry. |
| FR-24 | Session-based history grouping | Sistem harus mengelompokkan history berdasarkan `sessionId`. | High | Setiap session memiliki teks gabungan, waktu mulai, waktu selesai, dan rata-rata confidence. |

### 3.2 External Interface Requirements

#### 3.2.1 User Interface
1. Landing page publik dengan navigasi ke dokumentasi dan CTA ke fitur inti.
2. Workspace protected untuk translate, practice, history, dan reference.
3. Modal login Google OAuth saat pengguna belum autentikasi.
4. Halaman history dengan aksi copy, delete, dan clear.
5. Halaman reference dengan galeri alfabet dan statistik.
6. Kontrol kamera, TTS, dan pengaturan aksesibilitas pada workspace.

#### 3.2.2 Software Interfaces
| Interface | Contract |
|---|---|
| Supabase Auth | OAuth sign-in, session retrieval, JWT bearer token |
| Backend Translate API | `POST /api/v1/translate/predict` |
| Backend Classes API | `GET /api/v1/translate/classes` |
| Backend Health API | `GET /health` |
| Browser Storage | `localStorage` untuk history, practice stats, tema, dan preferensi |
| Browser Speech API | `window.speechSynthesis` untuk TTS |

#### 3.2.3 Hardware Interfaces
1. Webcam untuk pengambilan gambar tangan.
2. Speaker atau output audio untuk TTS.
3. Perangkat input standar seperti keyboard dan mouse/touch.

#### 3.2.4 Communication Interfaces
1. Komunikasi frontend-backend menggunakan HTTP/HTTPS.
2. Upload prediksi memakai `multipart/form-data`.
3. Respons backend memakai JSON.
4. Token autentikasi dikirim melalui header `Authorization: Bearer <token>`.
5. CORS dibatasi oleh konfigurasi origin yang dapat diatur lewat environment variable.

### 3.3 Data Requirements

#### 3.3.1 History Entry
| Field | Type | Requirement |
|---|---|---|
| id | string | Unik per entry |
| sessionId | string | Mengelompokkan entry ke sesi yang sama |
| text | string | Huruf atau teks yang dikomit |
| confidence | number | Harus finite |
| timestamp | string | Format ISO timestamp |
| language | string | Menyimpan bahasa sesi, misalnya BISINDO |

#### 3.3.2 History Session
| Field | Type | Requirement |
|---|---|---|
| sessionId | string | Identifier sesi |
| entries | array | Daftar entry tersortir berdasarkan waktu |
| text | string | Gabungan text seluruh entry |
| startedAt | string | Timestamp entry pertama |
| endedAt | string | Timestamp entry terakhir |
| averageConfidence | number | Rata-rata confidence seluruh entry |
| language | string | Bahasa sesi terakhir |

#### 3.3.3 Practice Stats
| Field | Type | Requirement |
|---|---|---|
| totalAttempts | number | Total percobaan |
| correctAttempts | number | Total percobaan benar |
| currentStreak | number | Streak benar saat ini |
| bestStreak | number | Rekor streak terbaik |
| lastPlayedAt | string or null | Waktu latihan terakhir |
| byLetter | record | Statistik per huruf A-Z |

#### 3.3.4 Translate Response
| Field | Type | Requirement |
|---|---|---|
| detections | array | Daftar prediksi dari backend |
| inference_ms | number | Waktu inferensi dalam milidetik |
| model | string | Nama file model yang dimuat |

### 3.4 Business Rules
1. Data history dan practice disimpan di browser, bukan di database server, pada runtime aktif.
2. History dibatasi hingga 1200 entry terbaru.
3. Duplicate commit untuk huruf yang sama harus diberi cooldown sekitar 900 ms.
4. Prediksi dengan confidence tinggi dapat di-commit lebih cepat daripada prediksi dengan confidence rendah.
5. Practice mode memilih target adaptif dari huruf yang performanya paling lemah.
6. Auth route dan workspace tidak boleh menampilkan UI protected sebelum status login jelas.

## 4. Nonfunctional Requirements

### 4.1 Performance
| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Sistem harus mendukung loop translasi hampir real-time. | Capture interval 200 ms di desktop dan 300 ms di mobile. |
| NFR-02 | Frontend tidak boleh membekukan UI saat menunggu respons backend. | Kamera, transcript, dan navigasi tetap responsif saat request berlangsung. |
| NFR-03 | Backend harus memuat model di awal startup agar request pertama tidak terlalu lambat. | Model di-warm up saat lifespan startup. |

### 4.2 Security
| ID | Requirement | Target |
|---|---|---|
| NFR-04 | Hanya pengguna yang terautentikasi yang boleh mengakses workspace protected. | Route protected menolak akses tanpa login. |
| NFR-05 | Token Supabase harus divalidasi ketika tersedia. | JWT palsu atau kedaluwarsa ditolak ketika secret aktif. |
| NFR-06 | Server harus menolak upload yang tidak valid. | Format tidak didukung, file terlalu besar, dan gambar rusak ditolak. |
| NFR-07 | CORS harus dibatasi. | Origin diambil dari konfigurasi backend. |

### 4.3 Privacy
| ID | Requirement | Target |
|---|---|---|
| NFR-08 | Video mentah tidak boleh disimpan sebagai riwayat backend. | Backend hanya memproses frame yang diupload untuk inferensi. |
| NFR-09 | History dan practice stats harus tetap lokal di browser pada runtime aktif. | Data personal tidak dikirim ke database server. |
| NFR-10 | Pengguna harus punya kontrol atas data personal yang disimpan browser. | Clear history dan reset stats tersedia. |

### 4.4 Reliability
| ID | Requirement | Target |
|---|---|---|
| NFR-11 | Sistem harus menangani kegagalan prediksi sementara. | Request retry dilakukan untuk status 429 dan 5xx. |
| NFR-12 | Sistem harus tetap stabil ketika frame tidak dapat didecode atau tidak ada deteksi. | UI menampilkan keadaan aman tanpa crash. |
| NFR-13 | Sistem harus berhenti ketika tab disembunyikan dan melanjutkan dengan aman saat kembali aktif. | Capture loop dijeda dan dilanjutkan tanpa korupsi state. |

### 4.5 Usability
| ID | Requirement | Target |
|---|---|---|
| NFR-14 | Aplikasi harus dapat digunakan di desktop dan mobile. | Layout responsif dan navigasi tetap nyaman pada layar kecil. |
| NFR-15 | Sistem harus menyediakan feedback visual yang jelas. | Status kamera, confidence, history, dan error dapat dibedakan pengguna. |
| NFR-16 | Aplikasi harus menyediakan kontrol aksesibilitas dasar. | Tema, high contrast, text scale, dan TTS settings dapat diubah. |

### 4.6 Compatibility
| ID | Requirement | Target |
|---|---|---|
| NFR-17 | Sistem harus berjalan pada browser modern yang mendukung camera API dan speech synthesis. | Tidak memerlukan aplikasi native terpisah. |
| NFR-18 | Sistem harus kompatibel dengan upload gambar JPEG, PNG, dan WebP. | Backend menerima format yang ditentukan. |

### 4.7 Maintainability
| ID | Requirement | Target |
|---|---|---|
| NFR-19 | Konfigurasi harus berbasis environment variable. | Path model, origin CORS, dan auth secret tidak hard-coded. |
| NFR-20 | Arsitektur frontend dan backend harus modular. | UI, API client, auth, dan service model terpisah jelas. |
| NFR-21 | Kode harus tetap dapat diuji secara deterministik. | Perubahan perilaku memiliki unit test atau integration test yang relevan. |

### 4.8 Observability
| ID | Requirement | Target |
|---|---|---|
| NFR-22 | Backend harus menyediakan health check. | `GET /health` mengembalikan status layanan. |
| NFR-23 | Backend harus mengembalikan informasi model dan waktu inferensi. | Respons prediksi dan health membantu diagnosis performa. |

### 4.9 Data Integrity
| ID | Requirement | Target |
|---|---|---|
| NFR-24 | Data yang disimpan di browser harus divalidasi saat dibaca. | Entry rusak diabaikan, bukan merusak seluruh dataset lokal. |
| NFR-25 | Riwayat tidak boleh tumbuh tanpa batas. | Sistem membatasi jumlah entry lokal. |

## 5. Use Cases

### UC-01 Login to Protected Workspace
Actor: Visitor

Precondition: Visitor membuka halaman protected.

Main flow:
1. Sistem menampilkan login modal.
2. Pengguna memilih sign in dengan Google.
3. Supabase melakukan autentikasi.
4. Callback OAuth diproses.
5. Pengguna masuk ke workspace.

Postcondition: Sesi autentikasi aktif di browser.

### UC-02 Real-time Translation
Actor: Authenticated User

Precondition: Kamera sudah aktif.

Main flow:
1. Pengguna memulai sesi translasi.
2. Frontend menangkap frame secara periodik.
3. Frame dikirim ke backend.
4. Backend mengembalikan hasil deteksi.
5. Frontend memilih hasil terbaik dan memperbarui transcript.

Postcondition: Transcript dan history diperbarui.

### UC-03 Practice Session
Actor: Authenticated User

Precondition: Pengguna berada di halaman practice.

Main flow:
1. Sistem menampilkan target huruf.
2. Pengguna menirukan huruf target di depan kamera.
3. Sistem mengevaluasi hasil deteksi.
4. Statistik latihan diperbarui.
5. Sistem memilih target berikutnya.

Postcondition: Statistik latihan lokal tersimpan.

### UC-04 Manage History
Actor: Authenticated User

Precondition: Riwayat session sudah tersedia.

Main flow:
1. Pengguna membuka halaman history.
2. Sistem menampilkan daftar session.
3. Pengguna menyalin, menghapus, atau membersihkan seluruh riwayat.

Postcondition: History lokal sesuai aksi pengguna.

## 6. Out of Scope for Current Runtime
1. Penyimpanan history translasi ke database server belum menjadi alur aktif.
2. Route `collect` tidak ada pada codebase aktif.
3. MediaPipe bukan jalur utama translasi pada runtime sekarang.
4. Pipeline TensorFlow/EfficientNet bukan implementasi aktif pada backend sekarang.

## 7. Verification Notes
1. Functional requirements harus diverifikasi dengan unit test frontend, integration test backend, dan smoke test browser.
2. Nonfunctional requirements terkait keamanan harus diuji dengan file invalid, token invalid, dan route protection.
3. Requirement terkait performa perlu diverifikasi dengan pengamatan latency inference dan stabilitas capture loop.
4. Requirement terkait persistence perlu diverifikasi dengan reload browser dan validasi `localStorage`.
