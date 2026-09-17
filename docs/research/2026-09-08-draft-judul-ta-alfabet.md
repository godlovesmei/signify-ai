**Draft judul dan pembagian TA Meiske–Bunga: migrasi YOLO11n ke YOLO26n**

Revisi 8 September 2026. Keputusan pengguna: tetap pada alfabet BISINDO, sasaran pemula, **migrasi YOLO11 ke YOLO26 wajib dikerjakan**, dan training menggunakan laptop Meiske. Nano dipakai sebagai batas awal sesuai model proyek; anggaran training ditentukan setelah pilot perangkat. Dokumen ini menggantikan pembagian sebelumnya yang menempatkan perbandingan model sebagai alternatif.

Rekomendasi: **Meiske memiliki pipeline data, training, dan evaluasi model; Bunga memiliki ekspor, integrasi inferensi browser, dan evaluasi penerapan model pada Practice.** Masing-masing mempunyai implementasi FE dan BE yang mendukung pekerjaannya. Laptop Meiske merupakan perangkat eksekusi bersama. Penulis kode, perancang eksperimen, pelaksana run, dan penganalisis hasil dapat merupakan orang yang berbeda dan dicatat sesuai pekerjaan sebenarnya.

Dasar: [proposal riset](../../PROPOSAL_RESEARCH_TA.md), [audit data](2026-09-07-data-audit.json), pemeriksaan kode lokal, dan dokumentasi resmi yang ditinjau pada tanggal revisi. Belum ada training, perubahan kode aplikasi, atau hasil peningkatan yang dihasilkan melalui penyusunan draft ini.

**Judul dan pertanyaan penelitian**

| Orang | Judul yang disarankan | Pertanyaan utama |
| --- | --- | --- |
| Meiske | **Pengembangan dan Evaluasi Pengenalan Alfabet BISINDO Menggunakan YOLO26n dengan Pembanding YOLO11n** | Bagaimana perbandingan ketepatan pengenalan kedua model pada pembagian data yang dapat ditelusuri dan pengujian independen? |
| Bunga | **Pengembangan dan Evaluasi Inferensi YOLO26n Berbasis ONNX Runtime Web pada Modul Latihan Alfabet BISINDO** | Bagaimana menerapkan hasil training YOLO26n pada browser dengan keluaran yang konsisten, waktu respons terukur, dan pencatatan hasil latihan yang sesuai versi model? |

Jika pedoman TA menghendaki nama modul lebih eksplisit, judul Meiske dapat menjadi **Pengembangan Modul Evaluasi Pengenalan Alfabet BISINDO untuk Perbandingan YOLO11n dan YOLO26n**. Pemilihan redaksi mengikuti titik berat implementasi yang akhirnya disepakati dengan pembimbing; pembagian pekerjaan di bawah tetap sama.

Kedua judul terkait langsung dengan migrasi yang sama. Meiske menguji kualitas model terhadap referensi berlabel; Bunga menguji apakah kualitas tersebut dipertahankan saat model diekspor dan dipakai dalam aplikasi. Hasil pembandingan model bersama boleh dirujuk dalam kedua laporan dengan atribusi, sedangkan implementasi dan analisis utama masing-masing tetap jelas.

**Bukti lokal bahwa migrasi membutuhkan kontribusi kedua orang**

| Kondisi sekarang | Pekerjaan yang diperlukan | Pemilik utama |
| --- | --- | --- |
| Audit menemukan 338 dari 2.301 gambar validation memiliki salinan byte-identik di train; test lokal tidak ditemukan. | Manifest sumber, kelompok turunan augmentasi, split pengembangan yang bersih, dan test independen. Dampak overlap terhadap skor lama belum terukur. | Meiske |
| Belum ada pipeline perbandingan YOLO11n–YOLO26n yang dapat direproduksi dalam skrip riset yang diperiksa. Skrip evaluasi lama tidak mewakili runtime YOLO produksi. | Runner training, konfigurasi eksperimen, evaluasi batch, dan laporan per kelas. | Meiske |
| [Manifest](../../apps/frontend/lib/yoloModel.ts) mengunci arsitektur, path, dan cache ke YOLO11n v1. | Identitas artifact dan konfigurasi input/output yang eksplisit; pemuatan YOLO26 serta pemisahan cache antarversi. | Bunga |
| [Decoder](../../apps/frontend/lib/yoloPostprocess.ts) mengharapkan atribut sebanyak jumlah kelas + 4 dan menjalankan NMS. | Cocokkan decoder dengan output artifact yang dipilih; tambahkan jalur lain hanya jika format ekspor memerlukannya. | Bunga |
| [Capture](../../apps/frontend/lib/imagePreprocess.ts) meregangkan video menjadi persegi. | Tetapkan preprocessing bersama; Bunga mengimplementasikan versi browser dan pemetaan kotaknya, Meiske menyamakan referensi Python. | Bunga, dengan kontrak bersama |
| [Timer runtime](../../apps/frontend/lib/yoloSession.ts) hanya mengukur `session.run()`; respons model hanya memuat nama file `best.onnx`. | Identitas model yang tidak ambigu dan pengukuran capture sampai hasil selain waktu inferensi inti. | Bunga |
| [RPC riwayat](../../supabase/migrations/20260605030000_production_data_sync.sql) mengisi versi sesi dari model aktif di database. | Catat artifact yang benar-benar dimuat browser. Perubahan model aktif tidak boleh membuat hasil dari cache model lama diberi label versi baru. | Bunga |
| [Tes parity](../../apps/backend/tests/test_model_parity.py) membandingkan satu gambar melalui wrapper Ultralytics untuk kedua artifact. | Uji banyak sampel melalui JavaScript/browser sesungguhnya, dibandingkan dengan referensi Python yang sesuai. | Bunga |

Migrasi membutuhkan pembuktian pada aplikasi, meskipun model sudah berhasil dilatih. Dokumentasi [Ultralytics](https://docs.ultralytics.com/models/yolo26/) menjelaskan pilihan output one-to-many dan one-to-one; format aktual perlu diperiksa pada artifact hasil ekspor. Untuk raw one-to-many, decoder yang ada mungkin bisa digunakan kembali. Untuk output end-to-end, penanganannya berbeda. Jangan mengklaim penulisan decoder baru sebagai keharusan sebelum jalur ekspor dipilih.

**Scope Meiske**

| Paket | Implementasi dan hasil yang diserahkan | Batas selesai |
| --- | --- | --- |
| Data dan protokol | Manifest hash/sumber, pemisahan kelompok, konfigurasi split, peninjauan label bermasalah, dan protokol rekaman independen. | Sumber yang diketahui dan turunannya tidak melintasi split; metadata yang tidak diketahui dilaporkan; test terpisah dari tuning. |
| Training dan evaluasi | Runner parametrik untuk kedua model, konfigurasi YOLO11n/YOLO26n, catatan environment dan seed, pemilihan checkpoint berdasarkan validation, evaluasi test, serta analisis kesalahan per huruf/kondisi. | Run terikat ke commit, konfigurasi, split, dan hash checkpoint; hasil perbandingan dapat ditelusuri. |
| FE + BE evaluasi | Tampilan evaluasi terbatas untuk memilih run dan meninjau hasil per huruf/kondisi. Layanan impor hasil memvalidasi struktur, label, identitas run/split, serta menghitung agregat dan mencegah duplikasi. | Hasil yang ditampilkan sesuai data evaluasi tersimpan; run dengan metadata tidak valid ditolak dan hak akses diuji. |

Tampilan evaluasi dipakai pengelola/penguji untuk menilai model sebelum dipakai dalam latihan. Cukup menjadi satu tampilan atau pengembangan area riset yang tersedia; tidak membutuhkan aplikasi administrasi lengkap. Training tetap dijalankan lokal, sedangkan BE mengelola hasil dan aturan evaluasi. Skrip training sendiri tidak dihitung sebagai implementasi backend aplikasi.

Metrik utama: mAP50–95, precision/recall/F1 per kelas pada konfigurasi yang dinyatakan, serta analisis false positive dan missed detection. Skenario pengguna/kamera baru mengikuti ketersediaan data yang dapat dibuktikan. Tambahkan uji fungsi impor, agregasi, dan tampilan evaluasi agar kontribusi aplikasi dapat diperiksa.

**Scope Bunga**

| Paket | Implementasi dan hasil yang diserahkan | Batas selesai |
| --- | --- | --- |
| Ekspor dan kontrak artifact | Skrip ekspor ONNX untuk checkpoint yang diberikan, catatan versi library/opset/opsi ekspor, pemeriksaan input/output dan label map, serta hash artifact. | Artifact dapat diidentifikasi, dimuat, dan diproses sesuai kontraknya; kesalahan format ditangani dengan jelas. |
| Runtime dan evaluasi browser | Manifest, cache, preprocessing/pemetaan kotak, decoder sesuai kebutuhan, kompatibilitas jalur runtime yang tersedia, pengukuran latensi, serta tes parity batch. | Keluaran Python dan browser dibandingkan dengan toleransi yang ditetapkan; kedua model dapat dibenchmark dalam kondisi sebanding. |
| FE + BE Practice | Hubungkan runtime ke Practice, tampilkan keadaan model/kamera yang dapat dipahami pemula, dan perbaiki hasil percobaan. BE mencatat sesi, outcome, serta identitas model yang dilaporkan runtime dan memvalidasinya terhadap registry. | Hasil latihan tetap sesuai sesi dan versi model setelah refresh/retry; skip dan gangguan teknis dibedakan; akses antar-akun diuji. |

Pencatatan versi tidak membuktikan bahwa klien mustahil memalsukan data. Tujuannya keterlacakan aplikasi: versi dikenal registry, identitas sesi konsisten, dan pergantian model tidak mencampurkan hasil dalam satu sesi tanpa aturan. Metadata teknis disediakan untuk pengujian; pemula cukup melihat hasil latihan dan status yang membantu mengambil tindakan.

Metrik utama: kesesuaian kelas/kotak/skor antara referensi dan browser, perubahan metrik setelah ekspor, waktu muat pertama dan dari cache, latensi capture sampai hasil p50/p95, serta keberhasilan alur latihan. Catat browser, perangkat, backend inferensi, resolusi, dan versi artifact. Pengukuran `session.run()` tetap boleh dilaporkan terpisah.

WebGPU/WASM dan worker/fallback sudah memiliki fondasi dalam proyek; Bunga memeriksa kompatibilitas serta memperbaiki masalah yang ditemukan. Dukungan operator antarbackend runtime berbeda menurut [dokumentasi ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/), sehingga hasil Python belum cukup untuk menyimpulkan kelayakan browser.

**Contoh commit konkret Bunga**

Tabel berikut merupakan rencana commit, belum perubahan yang sudah dibuat. Nama file baru adalah usulan; berkas yang sudah ada ditandai sebagai existing. Pecah commit mengikuti perubahan yang dapat direview, tanpa mengejar jumlah tertentu.

| Contoh pesan commit | Berkas yang dikerjakan | Bukti kontribusi |
| --- | --- | --- |
| `feat(ml): add reproducible ONNX export for alphabet models` | Baru: `scripts/research/export_alphabet_onnx.py` dan konfigurasi ekspornya. | Checkpoint → artifact ONNX + metadata/hash; kontrak input/output dan label diverifikasi. Skrip dapat mengekspor pembanding YOLO11n juga. |
| `feat(inference): support versioned YOLO model manifests` | Existing: `apps/frontend/lib/yoloModel.ts`, `yoloSession.ts`, dan manifest publik. | Runtime mengenali identitas artifact serta cache masing-masing model; hasil menyertakan versi yang digunakan. |
| `feat(inference): support the selected YOLO26 output contract` | Existing: `apps/frontend/lib/yoloPostprocess.ts` dan tesnya. | Membaca output sesuai jalur ekspor, memvalidasi shape/class ID, dan menerapkan atau melewati NMS dengan benar. Besar perubahan bergantung pada format yang dipilih. |
| `fix(inference): align browser preprocessing with model evaluation` | Existing: `apps/frontend/lib/imagePreprocess.ts`, `yoloPreprocess.ts`, kode pemetaan kotak, dan tes terkait. | Transformasi input serta koordinat browser sesuai kontrak yang dipakai Meiske; misalnya letterbox bila itu hasil keputusan protokol. |
| `test(inference): verify browser parity and pipeline latency` | Baru: harness batch di `scripts/research/` dan pengujian browser dalam `apps/frontend/tests/`. | Perbandingan referensi Python–browser dan laporan benchmark yang dapat diulang. Fixture simulasi dibedakan dari hasil model sebenarnya. |
| `feat(data): persist the model version used by each session` | Baru: migrasi di `supabase/migrations/`; existing: `apps/frontend/lib/userData.ts`, kontrak respons prediksi, dan tes SQL/integrasi. | Sesi terkait artifact yang dimuat, dengan validasi model/sesi, idempotensi, dan penanganan pergantian versi. Tabel model yang tersedia diperluas sesuai kebutuhan. |
| `feat(practice): distinguish recognition outcomes in practice sessions` | Existing: halaman Practice; migrasi/RPC percobaan dan tes integrasinya. | FE dan BE membedakan hasil pengenalan, skip, dan gangguan teknis; ringkasan sesi mengikuti catatan yang benar. |

Dengan paket tersebut, Bunga memiliki kontribusi kode Python, TypeScript, SQL, dan pengujian yang langsung diperlukan agar YOLO26 dapat dipakai. Jika bobot pekerjaan melebihi kapasitas, batasi tampilan ringkasan Practice; jangan mengurangi verifikasi model/versi yang diperlukan untuk kesimpulan penelitian.

Meiske memiliki commit pasangan pada manifest/split data, runner training, konfigurasi kedua model, evaluasi per kelas, layanan impor/agregasi hasil, tampilan evaluasi, dan tesnya. Kontrak lintas modul ditinjau bersama. Setiap perubahan utama mempunyai satu pemilik agar pekerjaan dan atribusinya jelas.

**Alur kerja ketika training hanya di laptop Meiske**

1. Meiske menyiapkan runner training dan konfigurasi eksperimen. Bunga menyiapkan ekspor, kontrak browser, serta harness pengujian dari komputernya. Keduanya menetapkan label, preprocessing, ukuran input, dan bentuk output yang dibutuhkan.
2. Masing-masing mengerjakan dan melakukan commit atas kode yang ditulisnya. Meiske menjalankan revisi yang ditetapkan di laptop training; Bunga dapat mendampingi atau mengarahkan perintah untuk skrip miliknya.
3. Setiap run mencatat commit SHA, hash konfigurasi/split, model pretrained awal, versi library, seed, perangkat, waktu, operator, dan hash checkpoint/output. Kepemilikan laptop tidak menggantikan catatan penulis kode serta perancang eksperimen.
4. Meiske menyerahkan checkpoint dan metadata run. Bunga menjalankan atau meminta eksekusi skrip ekspor miliknya pada checkpoint tersebut, memeriksa hasil, lalu mengerjakan integrasi dan analisis browser.
5. Log dan artifact ditautkan ke run; commit kode tetap mengikuti penulis sebenarnya. Untuk pekerjaan yang benar-benar disusun bersama, catat kontribusi bersama pada PR atau commit yang relevan.
6. Bunga dapat mulai dari fixture dan artifact pilot, sehingga integrasi tidak harus menunggu training final. Benchmark yang dilaporkan tetap memakai artifact final teridentifikasi.

Contoh: Bunga menulis `export_alphabet_onnx.py`, Meiske menjalankannya di laptop training, lalu Bunga memeriksa output dan memperbaiki masalah ekspor. Kontribusi pembuatan serta validasi pipeline ekspor tetap Bunga; pelaksana run dicatat Meiske. Tidak diperlukan laptop training kedua untuk pembagian ini.

Batas pertukaran hasil minimal: checkpoint + hash, label map, input size/preprocessing, versi Ultralytics, opsi head/ekspor yang disepakati, identitas split, dan sampel referensi berlabel. Simpan artifact besar melalui mekanisme penyimpanan proyek yang sesuai; bukti kontribusi juga terdapat pada skrip, konfigurasi, tes, dan analisis, bukan hanya file bobot.

**Eksperimen agar hasil kedua TA dapat ditafsirkan**

| Tahap | Pemilik | Variabel yang diubah | Yang dibuat tetap |
| --- | --- | --- | --- |
| Perbandingan model | Meiske | YOLO11n versus YOLO26n. | Dataset/split, ukuran input, protokol evaluasi, anggaran tuning, dan kriteria pemilihan checkpoint yang sebanding. |
| Validasi ekspor dan integrasi | Bunga | Jalur Python versus ONNX di browser untuk masing-masing checkpoint. | Gambar, label, preprocessing, head, threshold, dan aturan postprocessing yang sesuai. |
| Benchmark aplikasi | Bunga | YOLO11n ONNX versus YOLO26n ONNX. | Perangkat/browser, input uji, resolusi, kondisi cache yang dikelompokkan, serta aturan konfirmasi Practice. |
| Uji bersama pengguna | Keduanya, dengan hasil terpisah | Skenario yang relevan bagi evaluasi masing-masing. | Protokol dan atribusi data; bedakan penilaian peragaan pengguna dari keluaran pengenal. |

Mulai dari satu jalur ekspor YOLO26 yang disepakati. Pembandingan one-to-many versus one-to-one dapat menjadi eksperimen tambahan Bunga jika ada waktu dan alasan dari pilot. Bila head berubah, keluaran tidak diharapkan identik; ukur tradeoff akurasi–latensi sebagai pembandingan metode, bukan kegagalan parity ekspor. Pin opsi ekspor dan periksa graph aktual sesuai [panduan ekspor Ultralytics](https://docs.ultralytics.com/modes/export/).

Latih YOLO11n dan YOLO26n dari pretrained umum masing-masing untuk perbandingan pada split baru. Migrasi arsitektur bukan penggantian nama bobot YOLO11 menjadi YOLO26. Jangan membandingkan skor validation lama dengan skor test baru seolah protokolnya setara. Checkpoint lama hanya diuji pada rekaman independen yang belum pernah dipakainya.

Augmentasi dilakukan setelah pemisahan kelompok dan hanya pada train. Metadata sumber lama yang belum diketahui dinyatakan sebagai keterbatasan; klaim generalisasi pengguna baru memerlukan pemisahan pengguna yang dapat dibuktikan. Besar anggaran, jumlah seed, dan perangkat uji ditetapkan setelah pilot; tidak ada estimasi waktu training yang dapat dipastikan dari informasi laptop saat ini.

Migrasi YOLO26 adalah hasil implementasi wajib dalam rancangan ini. Besarnya peningkatan akurasi atau kecepatan tetap merupakan hasil pengujian. Laporkan bila sebagian huruf/kondisi memburuk agar perbaikan berikutnya mempunyai dasar yang jelas.

**Fitur baru dan empat kartu dalam scope revisi**

| Kartu | Meiske — evaluasi model yang dapat ditelusuri | Bunga — hasil sesi latihan yang dapat ditinjau |
| --- | --- | --- |
| Kebutuhan | Pengelola/penguji perlu mengetahui model mana, data apa, dan huruf mana yang bermasalah sebelum merilis model untuk pemula. Audit data memberi bukti masalah teknis; kebutuhan tampilan ditinjau bersama pengelola. | Pemula perlu memahami hasil percobaan. Kode saat ini menyamakan skip dengan salah; manfaat ringkasan dan kategori baru perlu divalidasi lewat observasi pemula. |
| Alasan | Menghubungkan perbandingan YOLO11–YOLO26 dengan hasil yang bisa diperiksa dan direproduksi. | Menghubungkan hasil YOLO26 dengan informasi latihan yang dapat dimaknai pengguna serta rekaman versi yang konsisten. |
| Kemampuan | Memakai runner lokal dan layanan data yang ada; tampilan evaluasi dibatasi pada hasil run/per kelas. | Memperbaiki runtime dan Practice yang tersedia; rekomendasi adaptif sudah ada dan tidak perlu dibangun sebagai proyek baru. |
| Nilai proses bisnis | Mendukung pemeliharaan mutu: evaluasi model → identifikasi masalah → keputusan perbaikan/rilis. | Mendukung latihan: mencoba → memahami hasil → mencoba kembali, dengan catatan yang konsisten. |

Fitur ejaan bertarget, eksperimen konfirmasi durasi, rekomendasi pengulangan baru, dan diagnosis bentuk jari tidak menjadi kewajiban paket revisi ini. Menambah salah satunya memerlukan pengurangan scope lain dan bukti kebutuhan. Confidence atau kecocokan kelas tidak otomatis mengukur penguasaan BISINDO.

**Cara menjaga pembagian tetap adil**

Gunakan tiga paket substantif per orang sebagai titik awal: Meiske menguasai data, eksperimen model, dan aplikasi evaluasi; Bunga menguasai ekspor, runtime/pengujian browser, dan integrasi Practice beserta data sesinya. Keseimbangan dinilai dari kompleksitas, waktu kerja aktif, tanggung jawab debugging, implementasi FE–BE, dan bukti pengujian. Waktu GPU berjalan serta jumlah commit bukan ukuran tunggal kontribusi.

Setelah pilot, bandingkan estimasi tersisa. Jika pelacakan sumber data jauh lebih berat, Bunga dapat mengambil satu paket validasi label/split dengan kepemilikan yang dicatat. Jika runtime browser jauh lebih berat, Meiske dapat mengambil generator referensi prediksi untuk harness Bunga dan membatasi tampilan evaluasi. Perubahan pembagian dicatat sebelum implementasi lanjut; setiap orang tetap memiliki modul dan kesimpulan utama sendiri.

FastAPI dalam repo adalah layanan pengembangan opsional. Backend aplikasi dapat dikerjakan melalui Supabase SQL/RPC atau endpoint aplikasi sesuai arsitektur proyek: Meiske pada layanan hasil evaluasi, Bunga pada sesi latihan/versi artifact. Keduanya harus memiliki aturan dan pengujian backend yang nyata.

Meiske dapat menjelaskan kontribusinya: “Saya menyiapkan data dan pipeline eksperimen, melatih serta membandingkan YOLO11n dan YOLO26n, lalu menyediakan layanan dan tampilan evaluasi hasil.”

Bunga dapat menjelaskan kontribusinya: “Saya menyiapkan ekspor YOLO26 ke ONNX, menyesuaikan inferensi browser, menguji konsistensi hasil serta latensinya, dan mengintegrasikannya ke Practice dengan pencatatan sesi dan versi model yang benar.”
