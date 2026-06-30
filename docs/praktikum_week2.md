# MODUL PRAKTIKUM - AI SYSTEM ARCHITECTURE

## Week 2 - Advanced AI & Smart Systems

|                         |                             |
| ----------------------- | --------------------------- |
| **Mata Kuliah**         | Mata Kuliah Pilihan 2       |
| **Program Studi**       | D3 Teknik Informatika       |
| **Institusi**           | Politeknik Negeri Batam     |
| **Pertemuan**           | Minggu 2-3                  |
| **Topik**               | AI System Architecture      |
| **Durasi**              | 4 x 50 menit                |
| **Dosen**               | Mir'atul Khusna Mufida, PhD |

| **Identitas Mahasiswa** |                            |
| ----------------------- | -------------------------- |
| Nama                    | Meiske Priskilla Sahertian |
| NIM                     | 3312401001                 |
| Kelas                   | IF 4D Pagi                 |
| Tanggal                 | Sabtu, 07 Maret 2026       |
| Kelompok                | IF-4PD-02                  |

> **Studi Kasus: Sistem Pengenalan Bahasa Isyarat Real-Time Berbasis Deep Learning**
>
> Signify AI adalah aplikasi web untuk mengenali alfabet BISINDO (A-Z) dari kamera secara real-time. Arsitektur produksi proyek ini menggunakan **Next.js + ONNX Runtime Web** sehingga model YOLO11n berjalan langsung di browser. Frame kamera tidak dikirim ke backend untuk inferensi produksi.
>
> Dataset: <https://www.kaggle.com/datasets/agungmrf/indonesian-sign-language-bisindo>

---

## Catatan Audit Codebase

Dokumen ini disesuaikan dengan kondisi repository saat ini, bukan dengan rancangan lama. Batas arsitektur yang digunakan:

- Aplikasi produksi ada di `apps/frontend`.
- Model produksi adalah `apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx`.
- Metadata model produksi ada di `apps/frontend/public/models/bisindo-yolo11n/manifest.json`.
- Training memakai YOLO11n/Ultralytics, terlihat dari `runs/detect/runs/train/bisindo_v1/args.yaml`.
- Backend `apps/backend` adalah FastAPI legacy/dev-only untuk inferensi `.pt`, contract test, dan parity check. Backend ini bukan dependency produksi frontend.
- Dataset lokal berada di `data/bisindo` dengan format YOLO: `images/train`, `images/val`, `labels/train`, `labels/val`, dan `data.yml`.
- Tidak ada implementasi aktif `packages/ml`, TensorFlow/Keras EfficientNet, atau MediaPipe di path produksi saat ini.

---

## BAGIAN 1: Identifikasi Komponen AI Pipeline

### Lembar Kerja Task 1.1 - Identifikasi Layer

| Komponen Pipeline | Layer | Bukti di Codebase |
| ----------------- | ----- | ----------------- |
| Dataset BISINDO dari Kaggle | Data Layer | `data/bisindo/data.yml`, `data/bisindo/images`, `data/bisindo/labels` |
| Konfigurasi dataset YOLO | Data Layer | `data/bisindo/data.yml` mendefinisikan `train`, `val`, `nc: 26`, dan label A-Z |
| Capture frame webcam | Data/Application Layer | `apps/frontend/lib/imagePreprocess.ts` |
| Preprocessing browser | Data/Application Layer | `apps/frontend/lib/yoloPreprocess.ts` mengubah RGBA menjadi tensor float32 `1x3x640x640` dengan normalisasi `/255` |
| Training YOLO11n | Model Layer | `runs/detect/runs/train/bisindo_v1/args.yaml` |
| Bobot PyTorch YOLO | Model Layer | `models/exports/bisindo_yolo/best.pt` |
| Artefak ONNX browser | Model/Application Layer | `apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx` |
| Runtime ONNX browser | Application Layer | `apps/frontend/lib/yoloSession.ts`, `apps/frontend/lib/browserYoloRuntime.ts` |
| Post-processing deteksi | Application Layer | `apps/frontend/lib/yoloPostprocess.ts` melakukan confidence filtering dan class-aware NMS |
| UI kamera dan hasil prediksi | Application Layer | `WebcamCapture.tsx`, `PredictionDisplay.tsx`, `SentenceBuilder.tsx` |
| Penyimpanan riwayat dan latihan | Application/Data Layer | `apps/frontend/lib/userData.ts`, `supabase/migrations/*` |
| Model registry database | MLOps | tabel `model_versions` pada migration Supabase |
| CI/CD dan quality gate | MLOps | `.github/workflows/ci-frontend.yml`, `ci-backend.yml`, `performance.yml`, `deploy-frontend.yml` |

**a) Identifikasi komponen Data Layer, Model Layer, dan Application Layer**

- **Data Layer**: dataset BISINDO, file YOLO label, `data.yml`, frame kamera, preprocessing tensor.
- **Model Layer**: training YOLO11n, bobot `best.pt`, hasil export `best.onnx`, metrik training.
- **Application Layer**: Next.js frontend, ONNX Runtime Web, post-processing deteksi, sentence builder, TTS, history, practice.
- **MLOps**: model manifest, Supabase `model_versions`, GitHub Actions, testing, performance profile, dan lifecycle export model.

**b) Di mana letak MLOps pipeline dalam proyek ini?**

MLOps terletak pada proses yang menghubungkan training, validasi, packaging model, deployment, dan monitoring kualitas:

1. Training menghasilkan `best.pt` dan metrik di `runs/detect/runs/train/bisindo_v1`.
2. Model diekspor menjadi ONNX dan disalin ke `apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx`.
3. Metadata runtime dicatat di `manifest.json`.
4. Database memiliki tabel `model_versions` untuk mencatat versi model, walaupun frontend saat ini masih memakai manifest statis.
5. CI menjalankan lint, typecheck, unit/integration test, coverage, build, E2E, backend pytest, dan performance profile.

**c) Apa yang terjadi jika preprocessing gagal?**

Jika preprocessing browser gagal, model tidak menerima tensor sesuai kontrak `1x3x640x640` float32. Dampaknya:

1. ONNX Runtime dapat gagal menjalankan session karena bentuk input salah.
2. Prediksi dapat kosong atau tidak stabil karena nilai piksel tidak dinormalisasi.
3. UI menandai error melalui state `apiError`/status koneksi pada halaman translate/practice.
4. Letter accumulator tidak akan commit huruf karena tidak ada deteksi valid.

---

### Lembar Kerja Task 1.2 - Pemetaan Tools ke Komponen Pipeline

| Tool | Komponen Pipeline | Alasan Pemilihan |
| ---- | ----------------- | ---------------- |
| Kaggle dataset | Data source | Sumber dataset BISINDO yang digunakan untuk training awal. |
| YOLO label format | Data annotation | Format label bounding box yang langsung kompatibel dengan Ultralytics YOLO. |
| Ultralytics YOLO11n | Model training/export | Dipakai untuk object detection 26 kelas alfabet BISINDO dengan input 640x640. |
| ONNX | Model artifact | Format deployment agar model dapat dijalankan di browser. |
| ONNX Runtime Web | Browser inference | Menjalankan `best.onnx` di browser dengan WebGPU jika tersedia dan fallback WASM. |
| Next.js / React | Application frontend | Menyediakan UI kamera, translate, practice, history, reference, profile, dan dokumentasi. |
| Supabase | Persistence/auth | Menyimpan user, history translasi, attempt latihan, preferences, dan schema model registry. |
| FastAPI | Legacy local serving | Dipertahankan untuk inferensi `.pt`, contract test, dan parity; bukan serving produksi frontend. |
| Vitest, Playwright, pytest | Quality gates | Menguji unit, integration, E2E, accessibility, dan kontrak backend. |
| Locust | Performance testing | Menguji endpoint frontend staging dan optional legacy backend inference. |
| GitHub Actions | CI/CD | Mengotomasi lint, test, build, E2E, security scan, performance, dan deployment workflow. |

---

## BAGIAN 2: Implementasi AI Pipeline

### TASK 2.1: Data Layer - Dataset, Preprocessing, dan Feature Engineering

#### 2.1.1 Deskripsi Dataset

Dataset yang dipakai adalah dataset Indonesian Sign Language - BISINDO dari Kaggle:

```text
https://www.kaggle.com/datasets/agungmrf/indonesian-sign-language-bisindo
```

Di repository, dataset ditempatkan pada:

```text
data/bisindo/
  data.yml
  images/
    train/A ... Z
    val/A ... Z
  labels/
    train/A ... Z
    val/A ... Z
```

Konfigurasi `data/bisindo/data.yml`:

```yaml
path: /home/meiske/pbl-project/signify-ai/data/bisindo
train: images/train
val: images/val
nc: 26
names: ['A','B','C','D','E','F','G','H','I','J','K','L','M',
        'N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
```

Hasil audit lokal:

| Split | Gambar | Label `.txt` | Catatan |
| ----- | ------ | ------------ | ------- |
| Train | 9.169 | 9.168 | Ada 1 gambar train tanpa label: `data/bisindo/images/train/B/flip077 - Copy.jpg` |
| Val | 2.301 | 2.301 | Jumlah gambar dan label cocok |

Dataset saat ini hanya mendefinisikan `train` dan `val` di `data.yml`. Tidak ada split `test` aktif pada konfigurasi YOLO.

#### 2.1.2 Preprocessing Training

Preprocessing training dikelola oleh Ultralytics YOLO berdasarkan konfigurasi `args.yaml`. Parameter penting:

| Parameter | Nilai |
| --------- | ----- |
| Model dasar | `yolo11n.pt` |
| Task | `detect` |
| Dataset config | `data/bisindo/data.yml` |
| Epoch target | 100 |
| Early stopping patience | 20 |
| Epoch terakhir | 84 |
| Batch size | 16 |
| Input size | 640 |
| Device | `0` |
| AMP | `true` |
| Pretrained | `true` |

Augmentasi yang tercatat pada `args.yaml` antara lain `translate: 0.1`, `scale: 0.5`, `fliplr: 0.5`, `mosaic: 1.0`, `hsv_h: 0.015`, `hsv_s: 0.7`, `hsv_v: 0.4`, dan `erasing: 0.4`.

Catatan penting: dokumen lama menyebut TensorFlow `tf.data`, EfficientNetV2B0, resize 224x224, grayscale CRT phosphor, dan CSV manifest. Itu tidak sesuai dengan codebase saat ini karena path `packages/ml` tidak ada dan model aktif adalah YOLO11n object detection.

#### 2.1.3 Preprocessing Browser Production

Di produksi, input berasal dari webcam browser:

1. `captureImageData(video, canvas, 640)` menggambar frame video ke canvas 640x640.
2. `yoloPreprocess.ts` membaca RGBA dan membuat tensor `Float32Array`.
3. Nilai piksel dinormalisasi dari `[0,255]` ke `[0,1]`.
4. Channel disusun ke format BCHW: red plane, green plane, blue plane.
5. `yoloSession.ts` membentuk tensor ONNX dengan shape `[1, 3, 640, 640]`.

Potongan kontrak preprocessing:

```ts
const input = new ort.Tensor('float32', tensorData, [
  1,
  3,
  YOLO_MODEL_MANIFEST.inputSize,
  YOLO_MODEL_MANIFEST.inputSize,
]);
```

#### 2.1.4 Kesimpulan Data Layer

Data layer yang benar untuk proyek ini adalah:

- Dataset BISINDO dalam format YOLO, bukan CSV manifest TensorFlow.
- Input model 640x640, bukan 224x224.
- Label aktif adalah 26 alfabet A-Z.
- Browser inference memakai preprocessing RGBA -> float32 RGB normalized.
- Ada satu gap data yang perlu diperbaiki sebelum retraining: satu gambar train kelas B belum memiliki label `.txt`.

---

### TASK 2.2: Model Layer - Training dan Evaluasi YOLO11n

Model aktif adalah **YOLO11n** untuk object detection, bukan EfficientNet classifier. Bukti training ada pada:

```text
runs/detect/runs/train/bisindo_v1/args.yaml
runs/detect/runs/train/bisindo_v1/results.csv
runs/detect/runs/train/bisindo_v1/confusion_matrix.png
runs/detect/runs/train/bisindo_v1/results.png
runs/detect/runs/train/bisindo_v1/weights/best.pt
runs/detect/runs/train/bisindo_v1/weights/last.pt
```

Perintah training yang sesuai README:

```bash
conda activate signify-backend
yolo train \
  model=yolo11n.pt \
  data=data/bisindo/data.yml \
  epochs=100 \
  imgsz=640 \
  batch=16 \
  device=0 \
  patience=20 \
  name=bisindo_v1 \
  project=runs/train
```

Hasil epoch terakhir yang tercatat pada `results.csv`:

| Metrik | Nilai |
| ------ | ----- |
| Precision (B) | 0.99445 |
| Recall (B) | 0.99660 |
| mAP50 (B) | 0.99500 |
| mAP50-95 (B) | 0.92596 |
| Train box loss | 0.39868 |
| Train cls loss | 0.30080 |
| Train dfl loss | 1.02925 |
| Val box loss | 0.39606 |
| Val cls loss | 0.17696 |
| Val dfl loss | 0.86265 |

Artefak model aktif:

```text
models/exports/bisindo_yolo/best.pt
models/exports/bisindo_yolo/best.onnx
apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx
```

Lifecycle model yang sesuai repository:

```text
YOLO training
  -> runs/detect/runs/train/bisindo_v1/weights/best.pt
  -> copy/export ke models/exports/bisindo_yolo/best.pt
  -> export ONNX ke models/exports/bisindo_yolo/best.onnx
  -> copy ke apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx
  -> update manifest jika versi, label, input size, threshold, atau path berubah
  -> validasi browser inference dan optional backend parity
```

Manifest produksi:

```json
{
  "modelName": "bisindo",
  "modelVersion": "v1",
  "architecture": "yolo11n",
  "modelFile": "best.onnx",
  "artifactPath": "/models/bisindo-yolo11n/v1/best.onnx",
  "inputSize": 640,
  "confidenceThreshold": 0.5,
  "iouThreshold": 0.45,
  "maxDetections": 20
}
```

Kesimpulan model layer:

- Model yang diterapkan adalah YOLO11n detection model.
- Output model berupa bounding box, confidence, dan class A-Z.
- Metrik utama adalah precision, recall, mAP50, dan mAP50-95.
- Model produksi adalah ONNX, bukan SavedModel/TFLite/Keras.

---

### TASK 2.3: Application Layer - Browser Inference dan Legacy API

#### 2.3.1 Jalur Produksi: Next.js + ONNX Runtime Web

Jalur produksi tidak memanggil endpoint FastAPI. Kontrak produksi:

```text
WebcamCapture
  -> predictFromVideoFrame()
  -> captureImageData()
  -> predictFromImageData()
  -> predictWithBrowserYolo()
  -> createYoloSession()
  -> ONNX Runtime Web
  -> decodeYoloDetections()
  -> UI translate/practice
```

File penting:

| File | Peran |
| ---- | ----- |
| `apps/frontend/lib/translateApi.ts` | Facade prediksi browser |
| `apps/frontend/lib/browserYoloRuntime.ts` | Worker/main-thread predictor dan fallback |
| `apps/frontend/lib/yoloSession.ts` | Load model, pilih WebGPU/WASM, jalankan ONNX session |
| `apps/frontend/lib/yoloPreprocess.ts` | Konversi RGBA ke tensor YOLO |
| `apps/frontend/lib/yoloPostprocess.ts` | Decode output YOLO, filter confidence, NMS |
| `apps/frontend/app/[locale]/(workspace)/translate/_content.tsx` | Loop deteksi translate |
| `apps/frontend/app/[locale]/(workspace)/practice/_content.tsx` | Loop deteksi practice |

Kontrak response:

```ts
type TranslatePredictionResponse = {
  detections: Array<{
    class: string;
    confidence: number;
    box: { x1: number; y1: number; x2: number; y2: number };
  }>;
  inference_ms: number;
  model: string;
};
```

Detail runtime:

- Frame diproses tiap 200 ms di desktop dan 300 ms di mobile.
- Model dimuat dari `/models/bisindo-yolo11n/v1/best.onnx`.
- ONNX Runtime Web mencoba WebGPU jika tersedia dan fallback ke WASM.
- Hasil deteksi memakai threshold confidence 0.5 dan IoU 0.45.
- UI commit huruf memakai 3-frame weighted vote dan fast commit saat confidence >= 0.92.
- Tab tersembunyi menghentikan loop deteksi melalui Page Visibility API.

#### 2.3.2 Legacy/Dev-only Backend: FastAPI

FastAPI masih ada, tetapi bukan path produksi frontend.

Endpoint legacy:

| Endpoint | Fungsi |
| -------- | ------ |
| `POST /api/v1/translate/predict` | Inferensi `.pt` lokal dengan Ultralytics |
| `GET /api/v1/translate/classes` | Mengembalikan kelas model |
| `GET /health` | Health check backend |

File terkait:

```text
apps/backend/app/api/v1/endpoints/translation.py
apps/backend/app/services/ml_service.py
apps/backend/app/config/settings.py
apps/backend/tests/test_predict.py
```

Konfigurasi backend:

```dotenv
MODEL_PATH=models/exports/bisindo_yolo/best.pt
INPUT_SIZE=640
CONFIDENCE_THRESHOLD=0.5
INFERENCE_TIMEOUT_SECONDS=5.0
REQUIRE_AUTH=false
```

Backend ini berguna untuk:

- Contract test API.
- Eksperimen server-side inference lokal.
- Perbandingan `.pt` vs ONNX.
- Profil performa legacy backend.

Backend ini tidak boleh dijadikan dependency produksi translate/practice tanpa desain ulang boundary produksi.

---

## BAGIAN 3: Explainability dan Failure Mode Analysis

### TASK 3.1: Explainability yang Sesuai Codebase

Dokumen lama memakai Grad-CAM untuk EfficientNetV2B0. Itu tidak sesuai dengan codebase saat ini karena:

- Model aktif adalah YOLO11n object detection.
- Tidak ada file `packages/ml/analysis/gradcam.py`.
- Tidak ada model Keras `final_model.keras` yang dipakai produksi.

Explainability/evidence yang benar-benar tersedia sekarang berasal dari artefak Ultralytics:

```text
runs/detect/runs/train/bisindo_v1/confusion_matrix.png
runs/detect/runs/train/bisindo_v1/confusion_matrix_normalized.png
runs/detect/runs/train/bisindo_v1/BoxP_curve.png
runs/detect/runs/train/bisindo_v1/BoxR_curve.png
runs/detect/runs/train/bisindo_v1/BoxF1_curve.png
runs/detect/runs/train/bisindo_v1/BoxPR_curve.png
runs/detect/runs/train/bisindo_v1/val_batch0_pred.jpg
runs/detect/runs/train/bisindo_v1/val_batch1_pred.jpg
runs/detect/runs/train/bisindo_v1/val_batch2_pred.jpg
```

Untuk proyek ini, analisis explainability dapat dilakukan dengan:

1. Membandingkan `val_batch*_labels.jpg` dan `val_batch*_pred.jpg`.
2. Melihat confusion matrix untuk kelas yang sering tertukar.
3. Melihat kurva precision-recall dan F1 untuk memilih threshold confidence.
4. Menguji prediksi kamera nyata melalui overlay bounding box di UI.

Jika ingin menambah explainability yang lebih kuat, pendekatan yang lebih sesuai adalah interpretability untuk YOLO/object detection, misalnya visualisasi activation/feature map YOLO atau analisis false positive/false negative per kelas. Grad-CAM EfficientNet tidak cocok untuk arsitektur yang sekarang.

---

### Lembar Kerja Task 3.2 - Failure Mode Analysis

| Scenario | Failure Type | Impact | Detection | Mitigation |
| -------- | ------------ | ------ | --------- | ---------- |
| Pencahayaan buruk membuat tangan tidak jelas | Data quality issue | Deteksi kosong atau confidence rendah | Jumlah deteksi 0, confidence turun, pengguna melihat tidak ada bounding box | Instruksi pencahayaan di UI, tambah data low-light, evaluasi threshold |
| Background ramai menghasilkan false positive | Domain shift / false positive | Huruf salah masuk sentence builder | Confusion matrix, rekaman kasus false positive, review overlay box | Tambah data background beragam, tuning confidence/NMS, validasi di webcam nyata |
| Frame kamera tidak 640x640 sebelum tensor | Preprocessing contract failure | ONNX input shape error atau prediksi gagal | Unit test `yoloPreprocess`, runtime error, null prediction | Pertahankan kontrak `captureImageData(..., 640)` dan test shape tensor |
| Browser tidak mendukung WebGPU | Runtime fallback | Latency lebih tinggi | `createYoloSession()` fallback ke WASM | Optimasi model, quantization/ORT optimized artifact, kurangi interval jika perlu |
| Model ONNX gagal dimuat dari public path | Deployment/artifact issue | Translate/practice tidak bisa mendeteksi | Error load model, E2E gagal, network 404 | Pastikan `best.onnx`, ORT wasm assets, dan `manifest.json` ikut deployment |
| Dataset train memiliki gambar tanpa label | Data integrity issue | Training dapat mengabaikan/menandai data bermasalah | Audit pasangan image-label | Tambahkan label untuk `B/flip077 - Copy.jpg` atau hapus gambar sebelum retraining |
| Backend legacy dipakai sebagai dependency produksi | Architecture boundary failure | Produksi bergantung pada server `.pt`, latency dan deployment berubah | Test frontend memastikan `predictFromImageData` tidak memanggil `fetch` | Pertahankan browser-only inference atau desain backend produksi baru secara eksplisit |

---

## BAGIAN 4: Desain Arsitektur untuk Proyek PBL

### TASK 4.1: Mapping Proyek PBL ke AI System Architecture

#### Data Layer

**Apa sumber data Anda?**

Dataset Indonesian Sign Language - BISINDO dari Kaggle, ditempatkan secara lokal di `data/bisindo`.

**Bagaimana data diingesti dan disimpan?**

Data disimpan dalam format YOLO:

- Gambar: `data/bisindo/images/train/<kelas>` dan `data/bisindo/images/val/<kelas>`.
- Label: `data/bisindo/labels/train/<kelas>` dan `data/bisindo/labels/val/<kelas>`.
- Konfigurasi: `data/bisindo/data.yml`.

**Preprocessing apa yang diperlukan?**

- Training: preprocessing dan augmentasi dikelola oleh Ultralytics berdasarkan `args.yaml`.
- Production browser: canvas 640x640, RGBA -> RGB tensor, normalisasi `/255`, shape `[1,3,640,640]`.

**Fitur apa yang dibuat?**

Fitur input adalah frame gambar 640x640 yang dipakai YOLO11n untuk mendeteksi bounding box tangan dan class alfabet A-Z.

#### Model Layer

**Algoritma apa yang digunakan?**

YOLO11n object detection untuk mengenali 26 kelas alfabet BISINDO.

**Bagaimana strategi training/validation/testing?**

- Training dan validation memakai split `train` dan `val` pada `data.yml`.
- Training dijalankan sampai epoch 84 dengan early stopping dari target 100 epoch.
- Evaluasi memakai precision, recall, mAP50, mAP50-95, loss, confusion matrix, dan validation prediction images.
- Testing aplikasi dilakukan melalui Vitest, Playwright, pytest, Supabase tests, dan Locust.

**Bagaimana versi model dikelola?**

- Runtime frontend memakai `manifest.json`.
- Database memiliki tabel `model_versions`.
- Artefak `.pt` ada di `models/exports/bisindo_yolo/best.pt`.
- Artefak ONNX produksi ada di `apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx`.
- Belum ada workflow admin otomatis untuk promote/rollback model dari database ke frontend manifest.

**Metrik evaluasi apa yang digunakan?**

Metrik model: precision, recall, mAP50, mAP50-95, box loss, cls loss, dfl loss.

#### Application Layer

**Bagaimana model diakses?**

Di produksi, model diakses langsung oleh browser melalui ONNX Runtime Web. Backend FastAPI hanya optional legacy/parity.

**Real-time atau batch inference?**

Real-time inference dari webcam, interval 200 ms desktop dan 300 ms mobile.

**Bagaimana antarmuka pengguna?**

Antarmuka berbasis web:

- Translate: kamera, overlay bounding box, prediction display, sentence builder, TTS, history.
- Practice: target huruf, hold-frame success logic, stats latihan.
- Reference: referensi alfabet BISINDO.
- Profile/settings: preferensi tema, kontras, text scale, TTS.

#### MLOps & Monitoring

**Bagaimana memantau performa model setelah deployment?**

Yang sudah ada:

- CI frontend/backend/database/security/performance.
- Locust profile untuk frontend staging dan optional backend inference.
- Database menyimpan history translasi dan practice attempt.
- Model training artifact menyimpan confusion matrix dan kurva metrik.

Yang belum ada:

- Monitoring drift model secara otomatis.
- Online model performance dashboard.
- Active-learning queue dari input pengguna.

**Kapan dan bagaimana model retrain?**

Saat ini retraining masih manual dengan `yolo train`. Belum ada pipeline retraining otomatis berbasis data baru.

**Apa strategi jika model mengalami degradasi?**

Strategi yang realistis untuk codebase sekarang:

1. Kembalikan `best.onnx` ke versi stabil sebelumnya.
2. Sesuaikan `manifest.json` jika path/version berubah.
3. Validasi frontend production build dan browser inference.
4. Jalankan optional parity check terhadap `.pt` backend jika diperlukan.

---

### Task 4.2: Diagram Arsitektur

```mermaid
flowchart LR
  A[Kaggle BISINDO Dataset] --> B[data/bisindo YOLO format]
  B --> C[Ultralytics YOLO11n Training]
  C --> D[best.pt]
  D --> E[Export ONNX]
  E --> F[apps/frontend public best.onnx]
  F --> G[Next.js Frontend]
  H[Webcam Browser] --> I[captureImageData 640x640]
  I --> J[RGBA to RGB Float32 Tensor]
  J --> K[ONNX Runtime Web WebGPU/WASM]
  K --> L[YOLO Postprocess confidence + NMS]
  L --> M[Translate UI / Practice UI]
  M --> N[Sentence Builder + TTS]
  M --> O[Supabase History / Practice Stats]

  D -. optional legacy .-> P[FastAPI Backend]
  P -. local/parity only .-> Q[/api/v1/translate/predict]
```

---

## Yang Tidak atau Belum Diterapkan di Proyek Ini

Berikut bagian yang **tidak diterapkan** atau **belum selesai** berdasarkan audit repository:

| Item | Status | Bukti/Catatan |
| ---- | ------ | ------------- |
| TensorFlow/Keras EfficientNetV2B0 production model | Tidak diterapkan | Tidak ada `packages/ml`; model aktif YOLO11n/ONNX. |
| MediaPipe hand landmark detection | Tidak diterapkan | Inference memakai YOLO bounding box langsung, bukan landmark MediaPipe. |
| Grad-CAM EfficientNet | Tidak diterapkan | Tidak ada `packages/ml/analysis/gradcam.py`; artefak explainability yang ada adalah output Ultralytics. |
| Split test pada dataset YOLO | Belum diterapkan | `data/bisindo/data.yml` hanya memiliki `train` dan `val`. |
| Validasi dataset sempurna | Belum selesai | Satu gambar train belum punya label: `data/bisindo/images/train/B/flip077 - Copy.jpg`. |
| Automated retraining pipeline | Belum diterapkan | Training masih manual lewat `yolo train`. |
| Active-learning/user contribution queue | Belum diterapkan | Masih tercatat sebagai roadmap; tidak ada workflow review data pengguna. |
| Dynamic gesture words/phrases | Belum diterapkan | Model dan UI saat ini fokus alfabet A-Z. |
| Two-hand BISINDO signs | Belum diterapkan | Model/label aktif hanya alfabet statis A-Z. |
| Admin model promotion/rollback UI | Belum diterapkan | Ada tabel `model_versions`, tetapi frontend memakai manifest statis. |
| Production FastAPI model serving | Tidak diterapkan | FastAPI sengaja legacy/dev-only; produksi frontend browser-only. |
| Offline PWA shell untuk cache model/runtime | Belum diterapkan | Masih roadmap. |
| Quantized/ORT-optimized artifact | Belum diterapkan | Model produksi `best.onnx` biasa; optimasi kuantisasi masih roadmap. |
| Practice WebSocket service | Parsial | Frontend membaca `NEXT_PUBLIC_PRACTICE_WS_URL`, tetapi service WebSocket tidak ada di repo ini. |
| Script ML lama | Stale/belum disesuaikan | `scripts/evaluate_test_set.py`, `scripts/test_inference_static.py`, dan `scripts/setup-dev.sh` masih menyebut layout/model lama. |

---

## Pertanyaan Diskusi

### 1. Apa perbedaan membangun model AI di notebook dengan sistem AI siap produksi?

Di notebook, fokus utama adalah eksperimen: memilih arsitektur, menjalankan training, dan melihat metrik. Pada sistem produksi, model harus terhubung dengan input nyata, UI, runtime, deployment, testing, observability, dan error handling.

Pada Signify AI, model tidak cukup hanya akurat di dataset. Model harus bisa berjalan dari webcam pengguna, diproses menjadi tensor 640x640, dijalankan di browser dengan ONNX Runtime Web, lalu hasilnya distabilkan oleh weighted vote sebelum masuk ke sentence builder. Selain itu, aplikasi harus tetap aman: frame tidak dikirim ke backend produksi dan data pengguna disimpan melalui Supabase dengan RLS.

### 2. Mengapa explainability penting?

Explainability penting karena metrik tinggi saja tidak cukup untuk memastikan model belajar fitur yang benar. Untuk Signify AI, explainability membantu menjawab apakah model mendeteksi bentuk tangan atau justru bias terhadap background, pencahayaan, atau artefak dataset.

Dalam codebase sekarang, explainability yang tersedia adalah confusion matrix, PR/F1 curve, dan visualisasi prediksi batch validasi dari Ultralytics. Itu membantu menemukan kelas yang sering tertukar dan melihat apakah bounding box model berada pada tangan.

### 3. Pilih akurasi tinggi black-box atau akurasi sedang explainable?

Untuk aplikasi pengenalan alfabet BISINDO ini, akurasi tinggi tetap prioritas karena pengguna membutuhkan hasil yang stabil untuk menyusun huruf. Risiko kesalahan prediksi masih dapat dimitigasi dengan confidence threshold, weighted vote, UI koreksi, dan pengulangan gesture.

Namun explainability tetap perlu pada tahap pengembangan. Model yang akurat tetapi sering salah pada kondisi tertentu harus dianalisis melalui confusion matrix, contoh false positive/false negative, dan pengujian webcam nyata.

### 4. Bagaimana MLOps berbeda dari DevOps?

DevOps mengelola lifecycle aplikasi: build, test, deploy, dan monitor. MLOps menambahkan lifecycle data dan model: dataset versioning, training reproducibility, evaluasi model, export artifact, model registry, drift monitoring, dan rollback model.

Pada Signify AI, tantangan MLOps terlihat pada boundary `.pt` dan ONNX. Model `.pt` dipakai untuk training/legacy backend, sedangkan produksi memakai ONNX di browser. Jika model diganti, bukan hanya file bobot yang berubah; manifest, path public, threshold, input size, post-processing, dan E2E browser inference juga harus divalidasi.

### 5. Identifikasi minimal 3 bias dataset BISINDO dan mitigasinya.

| Bias | Risiko | Deteksi | Mitigasi |
| ---- | ------ | ------- | -------- |
| Bias pencahayaan | Model gagal pada ruangan gelap/terlalu terang | Evaluasi subset low-light dan confidence distribution | Tambah data pencahayaan ekstrem, augment brightness/contrast |
| Bias background | False positive pada latar ramai | Review false positive dan overlay bounding box | Tambah variasi background, tuning threshold/NMS |
| Bias tangan dominan | Akurasi turun untuk tangan kiri/kanan tertentu | Evaluasi per kondisi tangan | Tambah data tangan kiri/kanan secara seimbang |
| Bias ukuran tangan | Anak-anak/lansia/tangan kecil kurang terwakili | Analisis ukuran bounding box dan error per kelas | Tambah data subjek beragam, augment scale |
| Bias perangkat kamera | Webcam murah/mobile menghasilkan kualitas berbeda | Uji lintas perangkat | Tambah data dari kamera berbeda dan lakukan performance profiling |

### 6. Refleksi

Tantangan terbesar pada proyek ini adalah menjaga batas produksi tetap jelas. Versi lama dokumen menyebut TensorFlow, EfficientNet, MediaPipe, dan FastAPI sebagai jalur utama, tetapi codebase saat ini sudah bergeser ke YOLO11n dengan ONNX Runtime Web di browser. Artinya dokumentasi harus mengikuti implementasi aktual agar tidak menyesatkan pembaca.

Pelajaran utama: dalam sistem AI produksi, akurasi model hanya satu bagian. Dataset, format label, preprocessing, export model, runtime browser, post-processing, UI, persistence, dan testing harus konsisten. Ketika salah satu bagian berubah, seluruh kontrak pipeline perlu diaudit ulang.
