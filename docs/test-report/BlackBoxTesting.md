# Black-Box Testing Signify AI

| Informasi Dokumen | Keterangan |
| --- | --- |
| Nama aplikasi | Signify AI |
| Jenis pengujian | Black-box testing |
| Fokus pengujian | Pengujian fungsi aplikasi dari sisi pengguna |
| Lingkup utama | Frontend produksi Next.js, autentikasi Supabase, kamera browser, ONNX Runtime Web, riwayat, latihan, referensi, profil, dan pengaturan |
| Di luar lingkup utama | Training ulang model, parity `.pt` vs ONNX, dan FastAPI legacy/dev-only sebagai jalur prediksi produksi |
| Tanggal dokumen | 28 Juni 2026 |

## Catatan Pengujian

Black-box testing pada dokumen ini memeriksa input, aksi, dan output yang terlihat oleh pengguna tanpa menilai struktur kode internal. Jalur prediksi produksi Signify AI menggunakan model YOLO11n format ONNX yang berjalan langsung di browser melalui ONNX Runtime Web. Backend FastAPI hanya dicatat sebagai legacy/dev-only dan tidak menjadi syarat keberhasilan fitur produksi pengguna.

---

## Tabel Skenario Black-Box Testing

### Tabel 3.1 Skenario Pengujian Login Google Valid

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-001 |
| **Deskripsi** | Login ke sistem menggunakan akun Google yang valid. |
| **Use Case** | Login dengan Google |
| **Aktor** | Pengguna |
| **Kondisi Awal** | Pengguna berada pada halaman awal atau mencoba membuka halaman workspace. Pengguna belum login. |
| **Data Pengujian** | Akun Google valid.<br>Izin OAuth disetujui. |
| **Skenario Pengujian** | 1. Pengguna membuka aplikasi Signify AI.<br>2. Pengguna menekan tombol masuk/login.<br>3. Pengguna memilih tombol "Lanjutkan dengan Google".<br>4. Sistem mengarahkan pengguna ke halaman autentikasi Google.<br>5. Pengguna memilih akun Google valid dan menyetujui izin akses.<br>6. Sistem menerima token autentikasi dan memvalidasi sesi login.<br>7. Sistem mengarahkan pengguna ke halaman workspace atau halaman tujuan sebelumnya. |
| **Expected Output** | Pengguna berhasil login ke aplikasi. Session pengguna terbentuk dan halaman workspace ditampilkan. |

### Tabel 3.2 Skenario Pengujian Login Google Gagal

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-002 |
| **Deskripsi** | Login gagal ketika pengguna membatalkan proses Google OAuth atau terjadi error autentikasi. |
| **Use Case** | Login dengan Google |
| **Aktor** | Pengguna |
| **Kondisi Awal** | Pengguna berada pada dialog login dan belum memiliki session aktif. |
| **Data Pengujian** | OAuth dibatalkan.<br>Callback tanpa kode autentikasi.<br>Error autentikasi dari provider. |
| **Skenario Pengujian** | 1. Pengguna membuka dialog login.<br>2. Pengguna menekan tombol "Lanjutkan dengan Google".<br>3. Pengguna membatalkan proses login atau sistem menerima callback tidak valid.<br>4. Sistem memproses kondisi gagal login.<br>5. Sistem mengembalikan pengguna ke aplikasi. |
| **Expected Output** | Pengguna tidak berhasil login. Sistem menampilkan pesan gagal login yang aman dan tidak menampilkan detail token atau informasi sensitif. |

### Tabel 3.3 Skenario Pengujian Proteksi Halaman Workspace

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-003 |
| **Deskripsi** | Pengguna anonim tidak dapat mengakses halaman workspace sebelum login. |
| **Use Case** | Protected route |
| **Aktor** | Pengguna anonim |
| **Kondisi Awal** | Pengguna belum login dan tidak memiliki session aktif. |
| **Data Pengujian** | URL workspace: `/translate`, `/history`, `/practice`, `/reference`, atau `/profile`. |
| **Skenario Pengujian** | 1. Pengguna membuka salah satu URL workspace secara langsung.<br>2. Sistem memeriksa status autentikasi pengguna.<br>3. Sistem mendeteksi bahwa pengguna belum login.<br>4. Sistem mengarahkan pengguna ke halaman awal dan menampilkan dialog login. |
| **Expected Output** | Pengguna anonim tidak dapat melihat data atau halaman workspace. Dialog login tampil dan pengguna diminta masuk terlebih dahulu. |

### Tabel 3.4 Skenario Pengujian Halaman Publik

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-004 |
| **Deskripsi** | Pengguna dapat membuka halaman publik tanpa login. |
| **Use Case** | Akses halaman publik |
| **Aktor** | Pengguna |
| **Kondisi Awal** | Pengguna membuka aplikasi dengan atau tanpa session login. |
| **Data Pengujian** | URL publik: `/`, `/how-it-works`, `/research`, dan `/terms-condition`. |
| **Skenario Pengujian** | 1. Pengguna membuka halaman awal aplikasi.<br>2. Pengguna membuka halaman "Cara kerja".<br>3. Pengguna membuka halaman "Riset".<br>4. Pengguna membuka halaman "Ketentuan".<br>5. Sistem memuat setiap halaman publik. |
| **Expected Output** | Semua halaman publik berhasil tampil, navigasi dapat digunakan, dan sistem tidak meminta login untuk halaman publik. |

### Tabel 3.5 Skenario Pengujian Akses Workspace Setelah Login

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-005 |
| **Deskripsi** | Pengguna yang sudah login dapat mengakses menu utama workspace. |
| **Use Case** | Navigasi workspace |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah berhasil login ke aplikasi. |
| **Data Pengujian** | Menu workspace: Terjemahkan, Latihan, Riwayat, Referensi, dan Profil. |
| **Skenario Pengujian** | 1. Pengguna login menggunakan akun valid.<br>2. Pengguna membuka menu "Terjemahkan".<br>3. Pengguna membuka menu "Latihan".<br>4. Pengguna membuka menu "Riwayat".<br>5. Pengguna membuka menu "Referensi".<br>6. Pengguna membuka menu "Profil". |
| **Expected Output** | Setiap halaman workspace berhasil ditampilkan sesuai menu yang dipilih dan tidak mengembalikan pengguna ke dialog login. |

### Tabel 3.6 Skenario Pengujian Aktivasi Kamera Terjemahan

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-006 |
| **Deskripsi** | Pengguna mengaktifkan kamera pada halaman terjemahan. |
| **Use Case** | Terjemahkan gestur BISINDO |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah login, berada pada halaman "Terjemahkan", dan browser memiliki akses kamera. |
| **Data Pengujian** | Izin kamera disetujui.<br>Kamera perangkat tersedia. |
| **Skenario Pengujian** | 1. Pengguna membuka halaman "Terjemahkan".<br>2. Pengguna menekan tombol untuk mengaktifkan kamera atau mulai terjemah.<br>3. Browser meminta izin kamera jika belum pernah diberikan.<br>4. Pengguna menyetujui izin kamera.<br>5. Sistem menampilkan preview kamera pada area terjemahan. |
| **Expected Output** | Kamera aktif, preview kamera tampil, dan status sistem menunjukkan kamera siap digunakan untuk proses deteksi. |

### Tabel 3.7 Skenario Pengujian Deteksi Huruf BISINDO

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-007 |
| **Deskripsi** | Sistem mendeteksi gestur alfabet BISINDO dari kamera browser. |
| **Use Case** | Deteksi huruf BISINDO |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna berada pada halaman "Terjemahkan" dan kamera sudah aktif. |
| **Data Pengujian** | Gestur alfabet BISINDO, misalnya huruf A.<br>Pencahayaan cukup.<br>Tangan berada di area panduan kamera. |
| **Skenario Pengujian** | 1. Pengguna mengarahkan tangan ke kamera.<br>2. Pengguna memperagakan salah satu huruf alfabet BISINDO.<br>3. Sistem memproses frame kamera di browser menggunakan ONNX Runtime Web.<br>4. Sistem menampilkan hasil prediksi huruf.<br>5. Sistem menampilkan confidence dan bounding box pada area kamera. |
| **Expected Output** | Huruf hasil deteksi, nilai confidence, dan bounding box tampil pada layar. Proses prediksi berjalan di browser tanpa membutuhkan request ke FastAPI legacy. |

### Tabel 3.8 Skenario Pengujian Error Izin Kamera

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-008 |
| **Deskripsi** | Sistem menampilkan pesan pemulihan ketika pengguna menolak izin kamera. |
| **Use Case** | Penanganan error kamera |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna berada pada halaman "Terjemahkan" dan kamera belum aktif. |
| **Data Pengujian** | Izin kamera ditolak oleh pengguna atau kamera tidak tersedia. |
| **Skenario Pengujian** | 1. Pengguna membuka halaman "Terjemahkan".<br>2. Pengguna menekan tombol untuk mengaktifkan kamera.<br>3. Browser meminta izin kamera.<br>4. Pengguna menolak izin kamera atau perangkat tidak memiliki kamera.<br>5. Sistem menerima status gagal dari browser. |
| **Expected Output** | Sistem menampilkan pesan bahwa izin kamera ditolak atau kamera tidak tersedia. Tombol "Coba lagi" atau instruksi pemulihan ditampilkan kepada pengguna. |

### Tabel 3.9 Skenario Pengujian Penyusun Kalimat

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-009 |
| **Deskripsi** | Pengguna menyusun kalimat dari huruf hasil deteksi. |
| **Use Case** | Penyusun kalimat |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna berada pada halaman "Terjemahkan" dan sudah memiliki hasil deteksi huruf. |
| **Data Pengujian** | Huruf hasil deteksi: A, K, U.<br>Aksi pengguna: tambah spasi, hapus huruf terakhir, bersihkan kalimat. |
| **Skenario Pengujian** | 1. Sistem menampilkan huruf hasil deteksi pada panel hasil.<br>2. Pengguna menambahkan huruf ke kalimat tersusun.<br>3. Pengguna menekan tombol tambah spasi.<br>4. Pengguna menekan tombol hapus huruf terakhir.<br>5. Pengguna menekan tombol bersihkan kalimat dan melakukan konfirmasi. |
| **Expected Output** | Kalimat tersusun berubah sesuai aksi pengguna. Spasi dapat ditambahkan, huruf terakhir dapat dihapus, dan seluruh kalimat dapat dibersihkan setelah konfirmasi. |

### Tabel 3.10 Skenario Pengujian Text-to-Speech

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-010 |
| **Deskripsi** | Pengguna membacakan kalimat tersusun menggunakan fitur text-to-speech. |
| **Use Case** | Teks-ke-suara |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna berada pada halaman "Terjemahkan" dan kalimat tersusun tidak kosong. |
| **Data Pengujian** | Kalimat: "AKU BISA".<br>Browser mendukung speech synthesis. |
| **Skenario Pengujian** | 1. Pengguna menyusun kalimat dari huruf hasil deteksi.<br>2. Pengguna menekan tombol "Dengarkan kalimat".<br>3. Sistem mengirim teks ke fitur speech synthesis browser.<br>4. Sistem menampilkan status bahwa kalimat sedang dibacakan atau telah diproses. |
| **Expected Output** | Kalimat dibacakan oleh browser atau sistem menampilkan status yang jelas jika text-to-speech tidak tersedia. Aplikasi tidak mengalami error. |

### Tabel 3.11 Skenario Pengujian Riwayat Terjemahan

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-011 |
| **Deskripsi** | Pengguna melihat dan mengelola riwayat terjemahan. |
| **Use Case** | Riwayat terjemahan |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah login dan berada pada halaman "Riwayat". |
| **Data Pengujian** | Data riwayat akun pengguna.<br>Kondisi kosong jika belum ada riwayat.<br>Aksi hapus satu item dan bersihkan seluruh riwayat. |
| **Skenario Pengujian** | 1. Pengguna membuka halaman "Riwayat".<br>2. Sistem memuat data riwayat milik akun pengguna.<br>3. Jika data tersedia, pengguna melihat daftar riwayat terjemahan.<br>4. Pengguna menghapus salah satu riwayat.<br>5. Pengguna membersihkan seluruh riwayat jika diperlukan. |
| **Expected Output** | Riwayat yang tampil sesuai akun pengguna. Jika data kosong, sistem menampilkan empty state. Aksi hapus memperbarui daftar riwayat tanpa menampilkan data milik akun lain. |

### Tabel 3.12 Skenario Pengujian Latihan Alfabet BISINDO

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-012 |
| **Deskripsi** | Pengguna menjalankan latihan pengenalan alfabet BISINDO. |
| **Use Case** | Latihan |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah login dan membuka halaman "Latihan". |
| **Data Pengujian** | Target huruf latihan.<br>Gestur benar dan gestur salah.<br>Aksi reset progres. |
| **Skenario Pengujian** | 1. Pengguna membuka halaman "Latihan".<br>2. Sistem menampilkan target huruf yang harus diperagakan.<br>3. Pengguna memperagakan huruf sesuai target.<br>4. Sistem memberikan umpan balik hasil latihan.<br>5. Pengguna melihat statistik performa.<br>6. Pengguna melakukan reset progres latihan. |
| **Expected Output** | Target latihan tampil, hasil latihan diperbarui, statistik performa berubah sesuai percobaan, dan reset progres mengembalikan statistik ke kondisi awal. |

### Tabel 3.13 Skenario Pengujian Referensi Alfabet BISINDO

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-013 |
| **Deskripsi** | Pengguna melihat referensi alfabet BISINDO A sampai Z. |
| **Use Case** | Referensi alfabet |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah login dan membuka halaman "Referensi". |
| **Data Pengujian** | Daftar huruf A sampai Z.<br>Gambar referensi tiap huruf. |
| **Skenario Pengujian** | 1. Pengguna membuka halaman "Referensi".<br>2. Sistem menampilkan daftar kartu referensi alfabet BISINDO.<br>3. Pengguna memilih atau membaca referensi huruf tertentu.<br>4. Sistem menampilkan gambar dan informasi referensi huruf. |
| **Expected Output** | Referensi alfabet BISINDO tampil lengkap dan gambar referensi dapat digunakan pengguna untuk mempelajari bentuk gestur. |

### Tabel 3.14 Skenario Pengujian Profil dan Pengaturan

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-014 |
| **Deskripsi** | Pengguna membuka profil dan mengubah preferensi aplikasi. |
| **Use Case** | Profil dan pengaturan |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah login dan berada pada halaman "Profil" atau workspace. |
| **Data Pengujian** | Data akun pengguna.<br>Preferensi tema terang/gelap/sistem.<br>Kontras tinggi.<br>Ukuran teks.<br>Pengaturan text-to-speech. |
| **Skenario Pengujian** | 1. Pengguna membuka halaman "Profil".<br>2. Sistem menampilkan informasi akun pengguna.<br>3. Pengguna membuka panel "Pengaturan".<br>4. Pengguna mengubah tema aplikasi.<br>5. Pengguna mengaktifkan atau menonaktifkan kontras tinggi.<br>6. Pengguna mengubah ukuran teks atau pengaturan suara.<br>7. Sistem menyimpan preferensi pengguna. |
| **Expected Output** | Informasi profil tampil sesuai akun. Preferensi yang diubah diterapkan pada tampilan aplikasi dan tetap tersedia pada session pengguna. |

### Tabel 3.15 Skenario Pengujian Navigasi Mobile dan Tablet

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-015 |
| **Deskripsi** | Pengguna mengakses workspace dan pengaturan melalui navigasi mobile atau tablet. |
| **Use Case** | Navigasi responsif |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah login dan membuka aplikasi melalui perangkat mobile atau tablet. |
| **Data Pengujian** | Viewport mobile 390 x 844.<br>Viewport tablet 820 x 1180.<br>Menu bottom navigation dan tombol Pengaturan. |
| **Skenario Pengujian** | 1. Pengguna membuka workspace pada layar mobile.<br>2. Pengguna menavigasi menu Terjemahkan, Latihan, Riwayat, Referensi, dan Profil melalui bottom navigation.<br>3. Pengguna membuka panel "Pengaturan" dari navigasi mobile.<br>4. Pengguna mengulangi alur pada ukuran layar tablet.<br>5. Sistem menampilkan layout responsif sesuai ukuran layar. |
| **Expected Output** | Menu workspace dan panel Pengaturan dapat diakses pada mobile dan tablet. Elemen UI tidak saling menumpuk dan fungsi utama tetap dapat digunakan. |

### Tabel 3.16 Skenario Pengujian Logout

| Field | Keterangan |
| --- | --- |
| **Test Case ID** | BB-016 |
| **Deskripsi** | Pengguna keluar dari aplikasi dan session berakhir. |
| **Use Case** | Logout |
| **Aktor** | Pengguna login |
| **Kondisi Awal** | Pengguna sudah login dan berada pada halaman workspace. |
| **Data Pengujian** | Session pengguna aktif.<br>Tombol "Keluar". |
| **Skenario Pengujian** | 1. Pengguna membuka halaman workspace.<br>2. Pengguna menekan tombol "Keluar".<br>3. Sistem meminta konfirmasi jika diperlukan.<br>4. Pengguna mengonfirmasi aksi keluar.<br>5. Sistem menghapus session pengguna.<br>6. Pengguna mencoba membuka halaman workspace kembali. |
| **Expected Output** | Pengguna berhasil logout dan diarahkan ke halaman awal. Saat membuka halaman workspace kembali, sistem menampilkan dialog login dan tidak menampilkan data pengguna sebelumnya. |

---

## Ringkasan Jumlah Skenario

| Modul | Jumlah Skenario |
| --- | ---: |
| Autentikasi dan protected route | 3 |
| Halaman publik dan workspace | 2 |
| Terjemahan kamera dan ONNX browser inference | 3 |
| Penyusun kalimat dan text-to-speech | 2 |
| Riwayat, latihan, dan referensi | 3 |
| Profil, pengaturan, navigasi responsif, dan logout | 3 |
| **Total** | **16** |

## Catatan Untuk Konversi ke Word

Gunakan setiap judul "Tabel 3.x" sebagai caption tabel. Saat dibuat menjadi dokumen Word, kolom pertama dapat diberi warna abu-abu dan teks tebal agar tampil mendekati contoh format black-box testing.
