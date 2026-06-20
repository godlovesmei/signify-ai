![](data:image/png;base64...)

**![](data:image/png;base64...)![](data:image/png;base64...)DAFTAR ISI**![](data:image/png;base64...)![](data:image/png;base64...)![](data:image/png;base64...)![](data:image/png;base64...)

[1. Pendahuluan 2](#_heading=h.vmu808ezhn7v)

[1.2 Ruang Lingkup 3](#_heading=h.bt1nukkc1hta)

[1.3 Batasan dan Kendala 3](#_heading=h.2gjfm2l7ik34)

[1.4 Metodologi Pengujian 3](#_heading=h.q9nxgqquf0u9)

[1.5 Tanggal Pelaksanaan 4](#_heading=h.36pekw4k5yx0)

[2. Kebutuhan Fungsional dan Non Fungsional 4](#_heading=h.80iwmwhentdi)

[2.1 Kebutuhan Fungsional 4](#_heading=h.c3q49n3sekwb)

[2.2 Kebutuhan Non Fungsional Aplikasi 4](#_heading=h.bshs2y5bb3lw)

[3. Executive Summary 5](#_heading=h.mx8xo59amgbg)

[4. Hasil Pengujian 5](#_heading=h.fmky56eji1i9)

[4.1 Hasil System Testing 5](#_heading=h.igyxkc1t0gzu)

[4.2 Hasil User Acceptance Testing 5](#_heading=h.my8dl4bgd047)

[4.3 Hasil Performance Testing 5](#_heading=h.lhm683717l23)

[4.4 Hasil Usability Testing 6](#_heading=h.iib14b3olpkm)

[5. Kesimpulan 6](#_heading=h.65ki0txbp5et)

[LAMPIRAN A. SOURCE CODE 7](#_heading=h.rtwa1zmtby2z)

[LAMPIRAN B. RENCANA PENGUJIAN 7](#_heading=h.qwkxhsfk4ihk)

[LAMPIRAN C: DOKUMEN UAT 7](#_heading=h.xnjke4s8oobl)

[LAMPIRAN D: SYSTEM TESTING 7](#_heading=h.3miev9xbnrlu)

[LAMPIRAN E: PROSES PERFORMANCE TESTING 7](#_heading=h.jnn3r6jw17cq)

[LAMPIRAN F: PROSES USABILITY TESTING 7](#_heading=h.tuansufg6mqz)

# 1. Pendahuluan

| **Kode PBL** | *[Isi kode PBL]* |
| --- | --- |
| **Version** | *1.0* |
| **Document Title** | *Laporan Pengujian Perangkat Lunak Signify AI* |
| **Approved By** | *[Nama Dosen Manpro]* |
| **Nama Klien** | *PBL Project* |
| **Target Aplikasi** | *Signify AI - Aplikasi web penerjemah BISINDO real-time* |

| **Anggota** | **ID** | **Email** | **Posisi** |
| --- | --- | --- | --- |
| [Nama Manpro] | 111111 | [email dosen 1] | Manajer Proyek |
| [Nama Dosen] | 222222 | [email dosen 2] | Dosen Pengujian Perangkat Lunak |
| Meiske Priskilla Sahertian | 3312401001 | meiskesahertian7@gmail.com | Mahasiswa, QA dan Developer |
| Bunga Citra Lestari Situmorang | 3312401034 | bungasitumorang738@gmail.com | Mahasiswa, QA dan Developer |

**Pembagian pengujian:** Meiske menguji modul dengan PIC/developer Bunga, sedangkan Bunga menguji modul dengan PIC/developer Meiske. Pembagian detail test case dicatat pada dokumen Test Management.

* 1. **Tujuan Pengujian**

*Bagian ini menjelaskan "Mengapa" pengujian ini dilakukan. Fokus pada target kualitas, bukan target bisnis penjualan.*

* *Apa yang diisi:*
  + *Memastikan kesesuaian fitur dengan spesifikasi kebutuhan (SRS).*
  + *Menemukan cacat (bug) kritis sebelum rilis ke produksi.*
  + *Memvalidasi perbaikan bug dari fase sebelumnya (re-testing).*
  + *(Jika relevan) Menilai kinerja atau keamanan sistem.*
* *Contoh Poin:*
  + *Memverifikasi bahwa seluruh alur 'Checkout' berfungsi tanpa kendala.*
  + *Memastikan aplikasi stabil saat diakses oleh 500 pengguna bersamaan.*

## 1.2 Ruang Lingkup

*Bagian ini adalah batasan area kerja atau "Apa yang dites dan apa yang tidak". Ini sangat krusial untuk manajemen ekspektasi stakeholder.*

* *Apa yang diisi (Bagi menjadi dua):*
  1. *Termasuk dalam Lingkup (In Scope): Modul apa saja yang dites? Jenis tes apa (Fungsional, UI, Integrasi)? Browser/Device apa yang digunakan?*
  2. *Di Luar Lingkup (Out of Scope): Apa yang sengaja tidak dites? (Misal: Keamanan server, Modul pihak ketiga, atau Kompatibilitas browser lama).*
* *Contoh:*
  + *In Scope: Modul Login, Dashboard, Laporan. Pengujian pada Chrome & Firefox.*
  + *Out of Scope: Pengujian performa (Load Testing) dan pengujian pada Internet Explorer.*

## 1.3 Batasan dan Kendala

*Bagian ini menjelaskan hambatan teknis atau non-teknis yang mempengaruhi pelaksanaan pengujian. Ini berbeda dengan Out of Scope; ini adalah kondisi yang "terpaksa" dihadapi.*

* *Apa yang diisi:*
  + *Waktu: Durasi pengujian yang dipersingkat.*
  + *Data: Keterbatasan data dummy atau tidak adanya akses ke data live.*
  + *Lingkungan (Environment): Server staging yang sering down atau spesifikasi server tes yang beda jauh dengan produksi.*
  + *SDM/Tools: Kurangnya tester atau lisensi tools otomasi.*

## 1.4 Metodologi Pengujian

*Bagian ini menjelaskan "Bagaimana" cara tim Anda melakukan pengujian. Ini memberikan kredibilitas teknis pada hasil laporan.*

* *Apa yang diisi:*
  + *Pendekatan: Black-box (tanpa lihat kode) atau White-box.*
  + *Strategi: Manual testing atau Automation.*
  + *Tingkatan: Unit Test, Integration Test, System Test, atau UAT.*
  + *Manajemen Bug: Bagaimana siklus hidup bug (Ditemukan -> Diperbaiki -> Diverifikasi).*
  + *Tools: Daftar alat yang dipakai (misal: Jira untuk bug tracking, Selenium untuk otomasi, JMeter untuk performa).*

## 1.5 Tanggal Pelaksanaan

Pelaksanaan pengujian perangkat lunak dilaksanakan dari tanggal dd/mm/yyyy hingga tanggal dd/mm/yyyy dengan pembagian durasi pelaksanaan sebagai berikut:

| **No** | **Aktivitas** | **Durasi pelaksanaan (minggu)** |
| --- | --- | --- |
| 1 |  |  |
| 2 |  |  |
| 3 |  |  |
| 4 |  |  |
| 5 |  |  |

# 2. Kebutuhan Fungsional dan Non Fungsional

## 2.1 Kebutuhan Fungsional

*Sebutkan fitur fitur fungsional apa saja yang ada pada aplikasi PBL dan identifikasi prioritas dari masing-masing fungsionalitanya. Hal ini akan bermanfaat untuk menentukan fungsi mana dulu yang akan diuji.*

| **REF ID** | **Kebutuhan Fungsional** |
| --- | --- |
| F001 | … |
| F002 | … |
| F003 | … |
| F004 | … |

## 2.2 Kebutuhan Non Fungsional Aplikasi

*Sebutkan fitur fitur non fungsional apa saja yang ada pada aplikasi PBL.*

| **REF ID** | **Kebutuhan Non-Fungsional** |
| --- | --- |
| NF001 | … |
| NF002 | … |
| NF003 | … |

# 3. Executive Summary

*Executive Summary (Ringkasan Eksekutif) adalah bagian terpenting bagi manajemen atau stakeholder (klien/bos) yang mungkin tidak punya waktu membaca laporan teknis setebal 50 halaman.*

*Bagian ini harus bisa menjawab pertanyaan: "Apakah aplikasi ini layak rilis atau tidak?"*

# 4. Hasil Pengujian

## 4.1 Hasil System Testing

*Pada bagian ini, deskripsikan* ***rangkuman*** *dari hasil system testing berdasarkan jumlah rencana pengujian yang telah dibuat. Persentase juga perlu dapat dilihat pada bagian ini terkait SUCCESS/FAIL nya.*

## 4.2 Hasil User Acceptance Testing

*Pada bagian ini, deskripsikan* ***rangkuman*** *dari hasil user accepatance testing disini. Identifikasikan dalam* ***PARAGRAF*** *tentang poin-poin:*

* *Mengapa anda melakukan UAT*
* *Fitur apa saja yang diuji*
* *Kapan dilaksanakan dan dimana*
* *Dokumentasi dalam bentuk foto selama pelaksanaan UAT. Dapat dilaksankanan secara offline maupun daring melalui Zoom atau Gmeet.*
* *Statistik tentang jumlah test scenario yang digunakan, berapa jumlah gagal dan berhasil.*
* *Saran dari tester (jika ada)*

## 4.3 Hasil Performance Testing

*Pada bagian ini, deskripsikan tentang hasil* ***rangkuman*** *dari yang terjadi setelah anda melakukan performance testing disini. Identifikasikan dalam paragraph tentang:*

* *Mengapa anda melakukan performance testing dan jenis performance testing apa yg anda gunakan.*
* *Fitur apa saja yang diuji*
* *Jumlah virtual user yang digunakan*
* *Kesimpulan dari statistik performa seperti response time, error rate, total request, dsb*

## 4.4 Hasil Usability Testing

*Dalam bentuk paragraf, berikan* ***rangkuman*** *singkat terkait dengan proses dan hasil Usability Testing yang telah anda lakukan.*

# 5. Kesimpulan

*Sajikan kesimpulan anda terkait seluruh proses pengujian yang anda lakukan serta berikan* ***rekomendasi*** *terhadap aplikasi secara keseluruhan untuk perbaikan di masa mendatang.*

# LAMPIRAN A. SOURCE CODE

Link github yang dapat diakases secara public (pastikan ada folder untuk menunjukkan hasil implementasi unit / integration / feature testing)

# LAMPIRAN B. RENCANA PENGUJIAN

Link drive rencana pengujian yang dikumpulksan saat ATS

# LAMPIRAN C: DOKUMEN UAT

Seluruh dokumen UAT yang sudah diapprove oleh klien atau manpro. Lampirkan dalam bentuk link Gdrive atau Onedrive.

# LAMPIRAN D: SYSTEM TESTING

Link spreadsheet system testing yang berisi test cases yang dijalankan selama SDLC dan manajemen defect

# LAMPIRAN E: PROSES PERFORMANCE TESTING

Screenshot penggunaan tools dan grafik hasil

# LAMPIRAN F: PROSES USABILITY TESTING

**Untuk usability testing:**

* Hasil tabel nilai-nilai dari responden
* Perhitungan rumus hingga interpretasi hasil.
