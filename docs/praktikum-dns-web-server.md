# Laporan Praktikum Instalasi dan Perawatan Perangkat Lunak

## Implementasi DNS Server dan Web Server SignifyAI

| Keterangan | Nilai |
| --- | --- |
| Mata Kuliah | Instalasi dan Perawatan Perangkat Lunak |
| Kode Mata Kuliah | IF421 |
| Tahun Akademik | Genap 2026-2027 |
| Program Studi | Teknik Informatika |
| Dosen | Ir. Dwi Ely Kurniawan, M.Kom |
| Nama Mahasiswa | Meiske Priskilla Sahertian |
| NIM | 3312401001 |
| Kelas | IF 4D Pagi |
| Topik | Implementasi DNS Server dan Web Server |
| OS Server | Ubuntu Server 22.04 LTS |
| Media | Oracle VirtualBox |
| Aplikasi | SignifyAI |
| Domain Aplikasi | <https://signifygesture.me/> |

---

## 1. Studi Kasus

SignifyAI adalah aplikasi web penerjemah Bahasa Isyarat Indonesia atau BISINDO secara real-time. Aplikasi produksi dapat diakses melalui domain:

```text
https://signifygesture.me/
```

Pada praktikum ini, domain tersebut digunakan sebagai domain lokal pada DNS Server di VM. Zona DNS lokal `signifygesture.me` akan diarahkan ke Web Server lokal dengan IP `192.168.100.10`. Dengan konfigurasi ini, alamat berikut harus dapat diakses dari jaringan praktikum:

```text
http://www.signifygesture.me
```

Catatan penting: konfigurasi ini hanya untuk kebutuhan praktikum DNS lokal di VM/lab. Zona lokal dapat menimpa resolusi domain publik pada jaringan VM, tetapi tidak mengubah DNS publik aplikasi produksi.

---

## 2. Spesifikasi Server

| Parameter | Nilai |
| --- | --- |
| Hostname | `server` |
| IP Address | `192.168.100.10/24` |
| Gateway | `192.168.100.1` |
| DNS Lokal | `192.168.100.10` |
| Domain | `signifygesture.me` |
| Subdomain Web | `www.signifygesture.me` |
| Web Root | `/var/www/html` |
| Web Server | Apache2 |
| DNS Server | BIND9 |
| Firewall | UFW |

---

## A. Konfigurasi Jaringan

### A.1 Mengatur Hostname

Jalankan perintah berikut:

```bash
sudo hostnamectl set-hostname server
hostnamectl
```

Hasil yang diharapkan:

```text
Static hostname: server
Operating System: Ubuntu 22.04.x LTS
```

### A.2 Melihat Nama Interface Jaringan

Nama interface pada VM dapat berbeda. Contoh pada dokumen ini menggunakan `enp0s3`.

```bash
ip link
```

Jika output menunjukkan nama interface berbeda, misalnya `ens33`, maka ganti `enp0s3` pada konfigurasi berikut dengan nama interface tersebut.

### A.3 Konfigurasi IP Static dengan Netplan

Buka file konfigurasi Netplan:

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Isi konfigurasi:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: no
      addresses:
        - 192.168.100.10/24
      routes:
        - to: default
          via: 192.168.100.1
      nameservers:
        addresses:
          - 192.168.100.10
          - 8.8.8.8
        search:
          - signifygesture.me
```

Terapkan konfigurasi:

```bash
sudo netplan apply
```

### A.4 Validasi IP Address dan Route

Perintah validasi:

```bash
ip addr show enp0s3
ip route
```

Hasil yang diharapkan pada `ip addr`:

```text
inet 192.168.100.10/24
```

Hasil yang diharapkan pada `ip route`:

```text
default via 192.168.100.1 dev enp0s3
192.168.100.0/24 dev enp0s3 proto kernel scope link src 192.168.100.10
```

### A.5 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot output ip addr show enp0s3]
[Screenshot output ip route]
```

---

## B. Instalasi DNS Server

### B.1 Update Repository

```bash
sudo apt update
```

### B.2 Instal BIND9 dan Tools DNS

```bash
sudo apt install bind9 bind9utils dnsutils -y
```

### B.3 Cek Status Service BIND9

```bash
sudo systemctl status bind9
```

Hasil yang diharapkan:

```text
Active: active (running)
```

Jika service belum berjalan:

```bash
sudo systemctl enable bind9
sudo systemctl restart bind9
```

### B.4 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot instalasi bind9 berhasil]
[Screenshot status bind9 active running]
```

---

## C. Konfigurasi DNS

### C.1 Konfigurasi Options BIND9

Buka file:

```bash
sudo nano /etc/bind/named.conf.options
```

Gunakan konfigurasi berikut:

```conf
options {
        directory "/var/cache/bind";

        listen-on { 127.0.0.1; 192.168.100.10; };
        listen-on-v6 { none; };

        allow-query { localhost; 192.168.100.0/24; };
        recursion yes;

        forwarders {
                8.8.8.8;
                1.1.1.1;
        };

        dnssec-validation auto;
};
```

### C.2 Menambahkan Zona Domain

Buka file:

```bash
sudo nano /etc/bind/named.conf.local
```

Tambahkan konfigurasi zona:

```conf
zone "signifygesture.me" {
        type master;
        file "/etc/bind/db.signifygesture.me";
};
```

### C.3 Membuat File Zona

Salin template zona:

```bash
sudo cp /etc/bind/db.local /etc/bind/db.signifygesture.me
sudo nano /etc/bind/db.signifygesture.me
```

Isi file zona:

```dns
$TTL    604800
@       IN      SOA     ns1.signifygesture.me. admin.signifygesture.me. (
                        2026071301 ; Serial
                        604800     ; Refresh
                        86400      ; Retry
                        2419200    ; Expire
                        604800 )   ; Negative Cache TTL

@       IN      NS      ns1.signifygesture.me.
@       IN      A       192.168.100.10
ns1     IN      A       192.168.100.10
server  IN      A       192.168.100.10
www     IN      A       192.168.100.10
```

Keterangan record:

| Record | Fungsi |
| --- | --- |
| `@` | Domain utama `signifygesture.me` mengarah ke `192.168.100.10` |
| `ns1` | Name server lokal untuk domain `signifygesture.me` |
| `server` | Hostname server lokal |
| `www` | Subdomain website `www.signifygesture.me` |

### C.4 Validasi Konfigurasi BIND9

Periksa konfigurasi utama:

```bash
sudo named-checkconf
```

Jika tidak ada output, konfigurasi valid.

Periksa file zona:

```bash
sudo named-checkzone signifygesture.me /etc/bind/db.signifygesture.me
```

Hasil yang diharapkan:

```text
zone signifygesture.me/IN: loaded serial 2026071301
OK
```

Restart BIND9:

```bash
sudo systemctl restart bind9
sudo systemctl status bind9
```

### C.5 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot isi /etc/bind/named.conf.local]
[Screenshot isi /etc/bind/db.signifygesture.me]
[Screenshot output named-checkconf]
[Screenshot output named-checkzone]
[Screenshot status bind9 setelah restart]
```

---

## D. Pengujian DNS

### D.1 Pengujian dengan nslookup

Uji domain `www.signifygesture.me`:

```bash
nslookup www.signifygesture.me 192.168.100.10
```

Hasil yang diharapkan:

```text
Server:         192.168.100.10
Address:        192.168.100.10#53

Name:   www.signifygesture.me
Address: 192.168.100.10
```

Uji domain utama:

```bash
nslookup signifygesture.me 192.168.100.10
```

Hasil yang diharapkan:

```text
Name:   signifygesture.me
Address: 192.168.100.10
```

### D.2 Pengujian dengan dig

```bash
dig @192.168.100.10 www.signifygesture.me
```

Hasil yang diharapkan pada bagian `ANSWER SECTION`:

```text
www.signifygesture.me. 604800 IN A 192.168.100.10
```

Uji name server:

```bash
dig @192.168.100.10 signifygesture.me NS
```

Hasil yang diharapkan:

```text
signifygesture.me. 604800 IN NS ns1.signifygesture.me.
```

### D.3 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot nslookup www.signifygesture.me]
[Screenshot nslookup signifygesture.me]
[Screenshot dig www.signifygesture.me]
[Screenshot dig NS signifygesture.me]
```

---

## E. Instalasi Web Server

### E.1 Instal Apache2

```bash
sudo apt install apache2 -y
```

### E.2 Aktifkan dan Jalankan Apache2

```bash
sudo systemctl enable apache2
sudo systemctl restart apache2
sudo systemctl status apache2
```

Hasil yang diharapkan:

```text
Active: active (running)
```

### E.3 Pengujian Localhost

```bash
curl -I http://localhost
```

Hasil yang diharapkan:

```text
HTTP/1.1 200 OK
Server: Apache
```

### E.4 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot instalasi apache2 berhasil]
[Screenshot status apache2 active running]
[Screenshot curl -I http://localhost]
```

---

## F. Pembuatan Website

### F.1 Membuat Halaman index.html

Buka file:

```bash
sudo nano /var/www/html/index.html
```

Isi halaman website:

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SignifyAI - DNS Server & Web Server</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f7fb;
      color: #172033;
    }

    main {
      max-width: 760px;
      margin: 48px auto;
      padding: 32px;
      background: #ffffff;
      border: 1px solid #d9e2ef;
      border-radius: 8px;
    }

    h1 {
      margin-top: 0;
      color: #0f766e;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }

    td {
      border: 1px solid #d9e2ef;
      padding: 10px;
    }

    .status {
      margin-top: 24px;
      padding: 16px;
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #166534;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <main>
    <h1>SignifyAI</h1>
    <p>Aplikasi penerjemah Bahasa Isyarat Indonesia atau BISINDO secara real-time.</p>

    <table>
      <tr>
        <td>Nama</td>
        <td>Meiske Priskilla Sahertian</td>
      </tr>
      <tr>
        <td>NIM</td>
        <td>3312401001</td>
      </tr>
      <tr>
        <td>Kelas</td>
        <td>IF 4D Pagi</td>
      </tr>
      <tr>
        <td>Domain Lokal</td>
        <td>www.signifygesture.me</td>
      </tr>
      <tr>
        <td>IP Server</td>
        <td>192.168.100.10</td>
      </tr>
    </table>

    <div class="status">DNS Server & Web Server Berhasil</div>
  </main>
</body>
</html>
```

### F.2 Validasi File Website

```bash
ls -l /var/www/html/index.html
curl http://localhost
```

Hasil yang diharapkan:

```text
<title>SignifyAI - DNS Server & Web Server</title>
DNS Server & Web Server Berhasil
```

### F.3 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot isi /var/www/html/index.html]
[Screenshot curl http://localhost]
[Screenshot halaman website terbuka di browser]
```

---

## G. Integrasi DNS-Web

### G.1 Memastikan Resolver Menggunakan DNS Lokal

Pada server atau client yang akan mengakses website, pastikan DNS mengarah ke `192.168.100.10`.

Cek resolver:

```bash
resolvectl status
```

Hasil yang diharapkan:

```text
DNS Servers: 192.168.100.10
DNS Domain: signifygesture.me
```

Jika client menggunakan Ubuntu Desktop, DNS dapat diatur melalui pengaturan jaringan atau Netplan dengan DNS `192.168.100.10`.

### G.2 Uji Resolusi Domain

```bash
ping -c 4 www.signifygesture.me
```

Hasil yang diharapkan:

```text
PING www.signifygesture.me (192.168.100.10)
```

### G.3 Uji Akses Website via Domain

```bash
curl http://www.signifygesture.me
```

Hasil yang diharapkan:

```text
DNS Server & Web Server Berhasil
```

Buka melalui browser:

```text
http://www.signifygesture.me
```

Website harus menampilkan identitas mahasiswa dan tulisan:

```text
DNS Server & Web Server Berhasil
```

### G.4 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot resolvectl status]
[Screenshot ping www.signifygesture.me]
[Screenshot curl http://www.signifygesture.me]
[Screenshot browser membuka http://www.signifygesture.me]
```

---

## H. Firewall

### H.1 Mengaktifkan UFW

Sebelum mengaktifkan firewall, pastikan SSH dibuka agar koneksi remote tidak terputus.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
```

### H.2 Membuka Port DNS dan HTTP

Buka DNS UDP dan TCP port 53:

```bash
sudo ufw allow 53/udp
sudo ufw allow 53/tcp
```

Buka HTTP port 80:

```bash
sudo ufw allow 80/tcp
```

Aktifkan UFW:

```bash
sudo ufw enable
```

### H.3 Validasi Status Firewall

```bash
sudo ufw status verbose
```

Hasil yang diharapkan:

```text
Status: active
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
53/udp                     ALLOW IN    Anywhere
53/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
```

Jika rule `OpenSSH` tampil sebagai nama service, hasil tersebut tetap benar:

```text
OpenSSH                    ALLOW IN    Anywhere
```

### H.4 Bukti Screenshot

Tempel screenshot berikut:

```text
[Screenshot rule UFW]
[Screenshot sudo ufw status verbose]
```

---

## 3. Rekap Validasi Akhir

| Komponen | Perintah Validasi | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- |
| Network | `ip addr show enp0s3` | IP `192.168.100.10/24` muncul | [Isi: Berhasil/Gagal] |
| Route | `ip route` | Default gateway `192.168.100.1` muncul | [Isi: Berhasil/Gagal] |
| BIND9 | `systemctl status bind9` | `active (running)` | [Isi: Berhasil/Gagal] |
| Zona DNS | `named-checkzone signifygesture.me /etc/bind/db.signifygesture.me` | `OK` | [Isi: Berhasil/Gagal] |
| DNS A Record | `nslookup www.signifygesture.me 192.168.100.10` | Address `192.168.100.10` | [Isi: Berhasil/Gagal] |
| Apache2 | `systemctl status apache2` | `active (running)` | [Isi: Berhasil/Gagal] |
| Website Localhost | `curl http://localhost` | Teks berhasil muncul | [Isi: Berhasil/Gagal] |
| Integrasi DNS-Web | `curl http://www.signifygesture.me` | Teks berhasil muncul | [Isi: Berhasil/Gagal] |
| Firewall | `ufw status verbose` | SSH, DNS, dan HTTP terbuka | [Isi: Berhasil/Gagal] |

---

## 4. Kesimpulan

Praktikum instalasi dan perawatan perangkat lunak berhasil dilakukan dengan membangun DNS Server menggunakan BIND9 dan Web Server menggunakan Apache2 pada Ubuntu Server 22.04 LTS. Domain lokal `signifygesture.me` dan subdomain `www.signifygesture.me` berhasil diarahkan ke IP server `192.168.100.10`.

Website lokal SignifyAI dapat diakses melalui:

```text
http://www.signifygesture.me
```

Konfigurasi firewall UFW juga telah diterapkan sehingga hanya layanan SSH, DNS, dan HTTP yang dibuka. Dengan demikian, seluruh komponen praktikum dari konfigurasi jaringan, instalasi DNS, konfigurasi zona, pengujian DNS, instalasi Apache2, pembuatan website, integrasi DNS-Web, sampai firewall telah selesai sesuai rubrik penilaian.

---

## 5. Lampiran Bukti Praktikum

Gunakan bagian ini untuk menempelkan screenshot hasil praktikum.

### Lampiran A - Konfigurasi Jaringan

```text
[Tempel screenshot ip addr]
[Tempel screenshot ip route]
```

### Lampiran B - Instalasi DNS Server

```text
[Tempel screenshot apt install bind9]
[Tempel screenshot systemctl status bind9]
```

### Lampiran C - Konfigurasi DNS

```text
[Tempel screenshot named.conf.local]
[Tempel screenshot db.signifygesture.me]
[Tempel screenshot named-checkconf]
[Tempel screenshot named-checkzone]
```

### Lampiran D - Pengujian DNS

```text
[Tempel screenshot nslookup]
[Tempel screenshot dig]
```

### Lampiran E - Instalasi Web Server

```text
[Tempel screenshot apt install apache2]
[Tempel screenshot systemctl status apache2]
```

### Lampiran F - Pembuatan Website

```text
[Tempel screenshot index.html]
[Tempel screenshot curl localhost]
```

### Lampiran G - Integrasi DNS-Web

```text
[Tempel screenshot curl http://www.signifygesture.me]
[Tempel screenshot website di browser]
```

### Lampiran H - Firewall

```text
[Tempel screenshot ufw status verbose]
```
