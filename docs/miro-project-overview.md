# Signify AI - Project Overview (Prompt-Ready)

Dokumen ini sudah diselaraskan dengan codebase aktif saat ini. Narasi lama yang menyebut MediaPipe, TensorFlow, database riwayat, atau route `collect` tidak lagi sesuai dengan implementasi sekarang.

## 1. Gambaran Sistem

Signify AI adalah aplikasi web Next.js untuk pengenalan bahasa isyarat BISINDO secara real-time. Pengguna login dengan Google melalui Supabase, lalu membuka halaman Translate untuk memulai sesi kamera. Browser menangkap frame webcam dan mengirimkan gambar ke backend FastAPI. Backend menjalankan inferensi model YOLO11 dan mengembalikan daftar deteksi berisi kelas, confidence, dan bounding box. Frontend memilih prediksi terbaik, menstabilkan hasil dengan vote buffer, lalu menyusun huruf menjadi teks dan opsional membacakan hasil dengan text-to-speech.

## 2. Alur Pengguna

### A. Akses dan autentikasi
1. Pengguna membuka landing page publik Signify AI.
2. Fitur inti berada di route `Translate`, `Practice`, `History`, dan `Reference`.
3. Route tersebut dibungkus `AuthGuard`, sehingga pengguna yang belum login akan melihat modal login.
4. Login dilakukan lewat Google OAuth melalui Supabase.
5. Setelah login berhasil, sesi disimpan oleh Supabase di browser.

### B. Translasi real-time
1. Pengguna mengaktifkan kamera dari browser.
2. Frontend menangkap frame secara periodik dan mengubahnya menjadi file gambar.
3. File gambar dikirim sebagai form upload ke endpoint `POST /api/v1/translate/predict`.
4. Backend melakukan decode gambar dengan OpenCV, menjalankan inferensi YOLO11, lalu mengembalikan hasil deteksi.
5. Frontend mengambil deteksi dengan confidence tertinggi, menerapkan fast-commit dan weighted vote buffer untuk mengurangi flicker, lalu menambahkan huruf ke transcript.
6. Setiap huruf yang berhasil di-commit disimpan sebagai history session di browser.
7. Pengguna dapat menyalin hasil, menghapus riwayat tertentu, dan menjalankan TTS.

### C. Practice, History, dan Reference
1. `Practice` memakai alur inferensi yang sama untuk melatih pengguna mengenali huruf target.
2. Statistik latihan dan performa per huruf disimpan di `localStorage`, sehingga target latihan bisa dipilih secara adaptif antar sesi.
3. `History` menampilkan sesi yang sudah tersimpan, lengkap dengan fitur copy, hapus sesi, dan clear all.
4. `Reference` menampilkan galeri alfabet BISINDO A-Z beserta statistik performa latihan per huruf.

## 3. Arsitektur Sistem

### A. Frontend
1. Dibangun dengan Next.js dan React.
2. Menangani UI, kamera, stabilisasi prediksi, transcript, TTS, dan navigasi antar workspace.
3. Menyimpan history, practice stats, tema, dan preferensi aksesibilitas di browser.

### B. Backend
1. Dibangun dengan FastAPI.
2. Memuat model YOLO11 saat startup melalui service singleton.
3. Menyediakan endpoint prediksi, daftar kelas, dan health check.
4. Dapat memvalidasi JWT Supabase pada request yang membawa token; mode auth bisa diwajibkan lewat environment variable.

### C. Auth dan Storage
1. Supabase dipakai untuk autentikasi pengguna dan sesi login.
2. Riwayat translasi dan statistik latihan tidak disimpan di database server, melainkan di `localStorage` browser.
3. Backend tidak menyimpan video mentah; server hanya memproses frame yang dikirim saat inferensi.

## 4. Alur Data Runtime

1. Webcam di browser -> `captureFrame()`.
2. Blob gambar -> `predictFromBlob()` -> `POST /api/v1/translate/predict`.
3. Backend decode image -> YOLO11 inference -> return detections.
4. Frontend memilih kelas teratas -> vote/fast-commit -> append transcript.
5. Transcript yang sudah di-commit -> `appendHistoryEntry()` -> `localStorage`.
6. Halaman History, Practice, dan Reference membaca data lokal yang sama agar konsisten antar halaman.

## 5. Catatan Penting untuk Laporan

1. Implementasi aktif saat ini tidak memakai MediaPipe sebagai jalur utama translasi.
2. Implementasi aktif saat ini juga tidak memakai pipeline TensorFlow/EfficientNet seperti draft lama.
3. Tidak ada route `collect` pada codebase aktif.
4. Gambaran yang paling tepat untuk laporan adalah: frontend menangkap webcam, backend YOLO11 melakukan inferensi, Supabase menangani autentikasi, dan data personal disimpan lokal di browser.

## Ringkasan 1 Kalimat per Komponen

1. User journey: login Google, translasi real-time, latihan huruf, dan melihat riwayat dalam satu aplikasi web.
2. System architecture: Next.js frontend, FastAPI YOLO backend, Supabase untuk auth, dan localStorage untuk data personal.
3. Runtime pipeline: frame webcam dikirim ke backend, dianalisis YOLO11, lalu hasilnya dipadatkan menjadi teks.
4. Data persistence: history dan practice stats tersimpan lokal, bukan di database server.
