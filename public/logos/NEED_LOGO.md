# Logo yang Perlu Di-download Manual

Logo di folder ini otomatis dipakai frontend dengan nama file **`{TICKER}.png`**
(contoh: `public/logos/BBCA.png`). Logo berikut masih **placeholder generik**
atau terlalu kecil — silakan download logo resmi tiap emiten dan simpan dengan
nama `{TICKER}.png` (PNG, background transparan) ke folder ini.

Cara download:
1. Buka situs resmi emiten (lihat kolom *Sumber*) atau cari di Google Images "logo {nama} png".
2. Simpan sebagai `public/logos/{TICKER}.png`.
3. Commit & deploy — logo langsung otomatis tampil di seluruh app.

> Jika file `{TICKER}.png` tidak ada, app otomatis pakai logo remote konfigurasi
> lalu fallback ke inisial bergradasi — jadi app tidak akan rusak tanpa logo.

## Prioritas (logo placeholder / terlalu kecil)

| Ticker | Nama Perusahaan | Sumber (domain situs resmi)            |
| ------ | --------------- | -------------------------------------- |
| AKRA   | AKR Corporindo  | akr.co.id                              |
| AMMN   | Amman Mineral   | amman.co.id                            |
| ASII   | Astra Intl      | astra.co.id                            |
| BBNI   | Bank Negara Indonesia | bni.co.id                         |
| BBRI   | Bank Rakyat Indonesia | bri.co.id                         |
| BBTN   | Bank Tabungan Nasional | btn.co.id                         |
| BJTM   | Bank Jatim       | bankjatim.co.id                        |
| BRIS   | Bank Syariah Indonesia | bankbsi.co.id                      |
| BSDE   | Bumi Serpong Damai | bsdcity.com                          |
| BUMI   | Bumi Resources   | bumiresources.com                      |
| ICBP   | Indofood CBP     | indofoodcbp.com                        |
| INDF   | Indofood         | indofood.com                           |
| INTP   | Indocement       | indocement.co.id                       |
| ISAT   | Indosat Ooredoo  | indosatooredoo.com                     |
| MAYA   | Maybank Indonesia | maybank.co.id                         |
| PGAS   | Perusahaan Gas Negara | pgn.co.id                          |
| SIDO   | Sido Muncul      | sidomuncul.co.id                       |
| TOWR   | Sarana Menara Nusantara | towr.co.id                      |

## Bonus (sudah bagus, tapi bisa diganti resmi)

Berikut yang logonya sudah tampil tapi berasal dari favicon kecil — opsi untuk
diganti logo resmi PNG resolusi tinggi:

| Ticker | Nama Perusahaan |
| ------ | --------------- |
| BBCA   | Bank Central Asia |
| BJBR   | Bank Jabar Banten |
| TLKM   | Telkom Indonesia |
| BMRI   | Bank Mandiri |
| ADRO   | Adaro Energy |
| GOTO   | GoTo Gojek Tokopedia |

## Semua ticker (daftar lengkap)

```
ACES ADHI ADRO AGRO AKRA AMMN ANTM ARTO ASII BBCA BBNI BBRI BBTN BJBR BJTM
BMRI BREN BRIS BRPT BSDE BTPS BUMI BYAN CLEO CPIN CTRA DCII DSSA ELSA ERAA
EXCL GGRM GOOD GOTO HEAL HMSP HRUM ICBP INCO INDF INKP INTP ISAT JSMR KLBF
MAPI MAYA MDKA MEDC MKPI MLBI MTEL MYOR NISP PANI PGAS PTBA PTPP PWON SIDO
SMCB SMGR SMMA SMRA TINS TKIM TLKM TOWR TPIA ULTJ UNVR WIKA
```

Script perbaruan otomatis (icon.horse) ada di `backend/scripts_collect_logos.py`.
Menimpa file logo yang sudah di-download manual — jalankan hanya untuk refresh.