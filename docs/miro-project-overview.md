# Signify AI - Project Overview (Prompt-Ready)

Dokumen ini dirancang untuk dipakai langsung sebagai bahan presentasi atau prompt Miro AI.
Cakupan: user flow produk, arsitektur sistem, pipeline model, dan dataset/preprocessing end-to-end.

## 1. User Journey

### A. Visitor to User
1. Pengguna membuka landing page Signify AI dan memahami value utama: terjemahan BISINDO real-time dari kamera.
2. Pengguna dapat melihat halaman edukasi produk (how-it-works, research, terms).
3. CTA utama mengarahkan pengguna ke fitur inti translasi.

### B. Authentication and Access
1. Halaman inti aplikasi (`/translate`, `/practice`, `/history`, `/reference`, `/collect`) dilindungi auth guard.
2. Pengguna login via Google OAuth (Supabase) di halaman `/auth/login`.
3. Setelah callback OAuth berhasil, user diarahkan kembali ke halaman tujuan (`next` path).

### C. Real-time Translation Session
1. User mengaktifkan kamera (desktop/mobile).
2. Frontend mendeteksi hand landmarks dengan MediaPipe (interval 200ms desktop, 300ms mobile).
3. Sistem mengambil crop tangan dengan ROI dinamis (landmarks) + fallback guide box.
4. Frame hasil crop dikirim ke backend untuk inferensi model BISINDO.
5. UI menampilkan prediksi huruf + confidence, lalu membangun kata/kalimat secara bertahap.
6. User dapat menghapus karakter, menambah spasi, dan menjalankan TTS (text-to-speech).
7. Riwayat hasil commit huruf otomatis tersimpan per sesi.

### D. Practice, Reference, and Data Contribution
1. `Practice`: latihan adaptif berdasarkan huruf yang akurasinya rendah.
2. `Reference`: galeri alfabet BISINDO + statistik performa latihan per huruf.
3. `History`: melihat sesi terdahulu, copy hasil, hapus sesi, clear all.
4. `Collect`: mengumpulkan landmark dataset (50 sampel per huruf) untuk eksperimen model berbasis landmarks.

### E. Data and Privacy Experience
1. Video mentah tidak disimpan sebagai riwayat di backend aplikasi.
2. Data history/practice disimpan lokal di browser (localStorage) untuk pengalaman personal dan ringan.
3. Token auth dipakai untuk proteksi route dan (opsional) proteksi API backend.

## 2. System Architecture & Tech Stack

### A. High-level Architecture
1. Frontend (Next.js) menangani UI, kamera, MediaPipe landmarks, state prediksi, dan UX translasi.
2. Backend (FastAPI + TensorFlow) menangani inferensi model CNN BISINDO dari image crop.
3. Supabase menangani autentikasi user (OAuth/session/JWT).
4. Pipeline ML (packages/ml) menangani training, evaluasi, dan export model untuk deployment.

### B. Runtime Data Flow
1. Browser capture frame -> MediaPipe landmarks.
2. Frontend crop ROI tangan -> kirim image ke endpoint prediksi backend.
3. Backend preprocess image -> inferensi SavedModel -> return prediction/confidence/top-k.
4. Frontend melakukan stabilisasi hasil (fast commit + weighted voting) -> update transcript + TTS.

### C. Tech Stack by Layer
- Frontend:
  - Next.js 16, React 19, TypeScript 5
  - Tailwind CSS 4, shadcn/ui, Radix/Lucide
  - MediaPipe Tasks Vision (hand landmark detection)
  - Supabase SSR + Supabase JS client
- Backend:
  - FastAPI + Uvicorn
  - TensorFlow 2.16.2 + Pillow + NumPy
  - Pydantic Settings, PyJWT
- ML/Training:
  - TensorFlow/Keras EfficientNetV2B0
  - Two-phase transfer learning (feature extraction + fine-tuning)
  - Mixed precision FP16, class weighting, callbacks (checkpoint/early stopping)
- Storage and State:
  - Model artifacts: `models/checkpoints`, `models/exports`
  - User history/practice/collect: localStorage browser
  - Dataset manifests: `data/processed/bisindo_v1/manifests/*.csv`

### D. API Surface
1. `POST /api/v1/translate/predict` -> prediksi huruf dari image crop.
2. `GET /api/v1/translate/classes` -> daftar kelas model.
3. `GET /health` -> status layanan dan model.

## 3. Model Pipeline

### A. Training Pipeline (Offline)
1. Data preparation:
   - Dataset Roboflow BISINDO v1 diubah menjadi manifest `filepath,label`.
   - Split: train/valid/test.
2. Input preprocessing:
   - Decode image, resize ke 224x224, normalisasi ke rentang [0,1].
3. Augmentation (train only):
   - Random brightness, contrast, JPEG quality
   - Gamma adjustment
   - Gaussian noise (probabilistik)
4. Model architecture:
   - EfficientNetV2B0 backbone (ImageNet pretrained, include_preprocessing=False)
   - Head: GAP -> BatchNorm -> Dropout -> Dense(256) -> Dropout -> Dense(26, softmax)
5. Two-phase training:
   - Phase 1 (base frozen): AdamW, lr awal 1e-3
   - Phase 2 (partial unfreeze dari layer 240): AdamW + cosine decay + warmup
6. Evaluation and reporting:
   - Accuracy, per-class precision/recall/F1, confusion matrix
   - Output report disimpan ke CSV.
7. Export:
   - Checkpoint -> SavedModel + label_map.json (opsional TFLite).

### B. Inference Pipeline (Online, Production Path)
1. Frontend:
   - Hand detection + ROI crop dari webcam.
   - Gambar dikirim sebagai JPEG crop (transport size 320x320).
2. Backend canonical preprocessing:
   - Convert RGB -> grayscale (ditumpuk jadi 3 channel)
   - Resize ke input model 224x224
   - Normalize [0,1]
3. Model inference:
   - Return prediction, confidence, top-k, inference_ms, low_confidence flag.
4. Frontend decision logic:
   - Fast commit jika confidence sangat tinggi.
   - Confidence-weighted vote buffer untuk menurunkan flicker.
   - Cooldown anti-duplikasi huruf berulang terlalu cepat.
5. Output UX:
   - Huruf terkini + transcript berjalan + TTS opsional.

### C. Current Quality Snapshot
1. Hasil evaluasi test report terbaru: accuracy sekitar 98.86% (1,297 benar dari 1,315 sampel).
2. Model fokus pada 26 huruf alfabet BISINDO (A-Z).

## 4. Dataset & Preprocessing

### A. Dataset Scope
1. Dataset utama: BISINDO v1 (26 kelas huruf A-Z).
2. Sumber dataset menunjukkan total ekspor Roboflow 22,168 image.
3. Manifest training aktif di proyek berisi 21,373 image terpakai.

### B. Split Aktif (berdasarkan manifest proyek)
- Train: 18,723
- Validation: 1,335
- Test: 1,315
- Total: 21,373

### C. Class Distribution and Imbalance
1. Distribusi kelas belum seimbang.
2. Contoh ekstrem di train split:
   - Kelas minimum: C (183)
   - Kelas maksimum: R (1,722)
   - Rasio ketimpangan max/min: 9.41x
3. Dampak:
   - Perlu class weighting dan evaluasi per kelas (sudah diterapkan di training pipeline).

### D. Preprocessing Contract (Train vs Inference)
1. Train dan inference sama-sama menggunakan input akhir 224x224, float [0,1].
2. Inference backend melakukan grayscale normalization secara kanonik agar konsisten.
3. Frontend hanya melakukan crop ROI dan resize transport; preprocessing model tetap dipusatkan di backend.
4. Tidak menggunakan horizontal flip untuk training agar orientasi gesture BISINDO tidak berubah makna.

### E. Supporting Data Collection Loop
1. Halaman `collect` memungkinkan pengumpulan landmark vector per huruf (eksperimen berbasis landmarks).
2. Data collection ini menjadi loop peningkatan data untuk iterasi model berikutnya.

---

## Ringkasan 1 Kalimat per Komponen (untuk slide cepat)
1. User Journey: dari login cepat, deteksi real-time, hingga latihan dan histori personal dalam satu alur aplikasi.
2. System Architecture: frontend vision-first + backend inference API + auth Supabase + pipeline ML terpisah.
3. Model Pipeline: two-phase transfer learning EfficientNetV2B0 dengan preprocessing konsisten train-inference.
4. Dataset & Preprocessing: 26 kelas BISINDO, 21,373 sampel aktif, class imbalance ditangani class weighting dan evaluasi per kelas.
