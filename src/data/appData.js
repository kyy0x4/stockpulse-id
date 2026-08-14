
export const INDICES = [
  { name: 'IHSG',   value: 7423.15, change: +42.31,  changePct: +0.57 },
  { name: 'LQ45',   value: 1042.88, change: +8.12,   changePct: +0.79 },
  { name: 'IDX30',  value: 598.44,  change: +3.87,   changePct: +0.65 },
  { name: 'IDX80',  value: 214.32,  change: -0.91,   changePct: -0.42 },
  { name: 'IDXSMC', value: 312.67,  change: -1.23,   changePct: -0.39 },
  { name: 'USD/IDR',value: 15820,   change: -45,     changePct: -0.28 },
]

export const SECTORS = ['All', 'Financials', 'Consumer', 'Energy', 'Technology', 'Healthcare', 'Infrastructure', 'Mining', 'Industrial', 'Property']

export const STOCKS = [
  { ticker:'BBCA', name:'Bank Central Asia',    sector:'Financials',     price:9825,  change:+75,   changePct:+0.77, volume:'28.4M',  mktCap:'1.21T', pe:24.2, pbv:4.8,  roe:21.3, div:1.8, fundamental:88, technical:82, signal:'Buy',        sparkline:[9600,9650,9720,9700,9750,9800,9825] },
  { ticker:'BBRI', name:'Bank Rakyat Indonesia',sector:'Financials',     price:5275,  change:+50,   changePct:+0.96, volume:'112.3M', mktCap:'796B',  pe:13.8, pbv:2.4,  roe:18.7, div:3.2, fundamental:85, technical:79, signal:'Buy',        sparkline:[5100,5150,5200,5180,5220,5250,5275] },
  { ticker:'TLKM', name:'Telkom Indonesia',     sector:'Technology',     price:3890,  change:-30,   changePct:-0.77, volume:'44.1M',  mktCap:'386B',  pe:16.4, pbv:3.1,  roe:19.8, div:4.5, fundamental:76, technical:58, signal:'Hold',       sparkline:[3980,3960,3940,3920,3910,3900,3890] },
  { ticker:'ASII', name:'Astra International',  sector:'Industrial',     price:5050,  change:+100,  changePct:+2.02, volume:'31.8M',  mktCap:'204B',  pe:10.2, pbv:1.7,  roe:17.2, div:3.8, fundamental:82, technical:85, signal:'Strong Buy', sparkline:[4850,4880,4920,4960,5000,5030,5050] },
  { ticker:'UNVR', name:'Unilever Indonesia',   sector:'Consumer',       price:2980,  change:-40,   changePct:-1.32, volume:'18.7M',  mktCap:'113B',  pe:22.1, pbv:22.4, roe:103.5,div:3.4, fundamental:65, technical:42, signal:'Sell',       sparkline:[3100,3080,3050,3030,3010,2990,2980] },
  { ticker:'PTBA', name:'Bukit Asam',           sector:'Mining',         price:3120,  change:+60,   changePct:+1.96, volume:'23.5M',  mktCap:'72B',   pe:7.4,  pbv:2.2,  roe:30.1, div:8.2, fundamental:84, technical:76, signal:'Buy',        sparkline:[2950,2980,3020,3050,3090,3100,3120] },
  { ticker:'ICBP', name:'Indofood CBP',         sector:'Consumer',       price:11025, change:+125,  changePct:+1.15, volume:'8.2M',   mktCap:'128B',  pe:18.6, pbv:3.9,  roe:21.4, div:2.1, fundamental:80, technical:73, signal:'Buy',        sparkline:[10750,10800,10880,10920,10980,11000,11025] },
  { ticker:'ANTM', name:'Aneka Tambang',        sector:'Mining',         price:1785,  change:-15,   changePct:-0.83, volume:'67.4M',  mktCap:'42B',   pe:12.3, pbv:1.4,  roe:11.7, div:1.5, fundamental:68, technical:55, signal:'Hold',       sparkline:[1830,1820,1810,1800,1790,1780,1785] },
  { ticker:'KLBF', name:'Kalbe Farma',          sector:'Healthcare',     price:1680,  change:+20,   changePct:+1.20, volume:'15.9M',  mktCap:'78B',   pe:25.8, pbv:4.6,  roe:18.2, div:2.3, fundamental:79, technical:68, signal:'Hold',       sparkline:[1630,1645,1655,1662,1668,1675,1680] },
  { ticker:'JSMR', name:'Jasa Marga',           sector:'Infrastructure', price:4420,  change:+80,   changePct:+1.84, volume:'9.1M',   mktCap:'66B',   pe:19.2, pbv:2.8,  roe:14.6, div:2.8, fundamental:72, technical:77, signal:'Buy',        sparkline:[4280,4300,4340,4370,4390,4410,4420] },
  { ticker:'BMRI', name:'Bank Mandiri',         sector:'Financials',     price:6350,  change:+100,  changePct:+1.60, volume:'58.2M',  mktCap:'593B',  pe:11.6, pbv:2.0,  roe:17.8, div:3.5, fundamental:86, technical:81, signal:'Buy',        sparkline:[6150,6200,6250,6280,6310,6335,6350] },
  { ticker:'HMSP', name:'HM Sampoerna',         sector:'Consumer',       price:1310,  change:-20,   changePct:-1.50, volume:'42.1M',  mktCap:'152B',  pe:16.9, pbv:5.1,  roe:30.4, div:5.9, fundamental:62, technical:38, signal:'Sell',       sparkline:[1360,1350,1340,1330,1325,1315,1310] },
  { ticker:'SMGR', name:'Semen Indonesia',      sector:'Industrial',     price:6225,  change:+75,   changePct:+1.22, volume:'7.3M',   mktCap:'37B',   pe:14.7, pbv:1.4,  roe:9.8,  div:2.2, fundamental:70, technical:64, signal:'Hold',       sparkline:[6100,6130,6155,6175,6195,6210,6225] },
  { ticker:'CPIN', name:'Charoen Pokphand',     sector:'Consumer',       price:5150,  change:+150,  changePct:+3.00, volume:'12.8M',  mktCap:'84B',   pe:20.4, pbv:3.6,  roe:17.9, div:1.9, fundamental:77, technical:88, signal:'Strong Buy', sparkline:[4850,4900,4980,5040,5080,5120,5150] },
  { ticker:'BBNI', name:'Bank Negara Indonesia',sector:'Financials',     price:5500,  change:+75,   changePct:+1.38, volume:'39.4M',  mktCap:'207B',  pe:9.8,  pbv:1.4,  roe:15.3, div:3.1, fundamental:81, technical:75, signal:'Buy',        sparkline:[5350,5380,5420,5450,5470,5490,5500] },
]

export const NEWS = [
  { id:1, title:'BBCA Catat Laba Bersih Rp 48,6 Triliun di Semester I 2026, Naik 12,3% YoY', source:'Kontan', time:'2j lalu', category:'Earnings', ticker:'BBCA', sentiment:'positive' },
  { id:2, title:'Harga Batu Bara Newcastle Melemah ke USD 142/ton, Saham PTBA dan ITMG Tertekan', source:'Bisnis.com', time:'3j lalu', category:'Komoditas', ticker:'PTBA', sentiment:'negative' },
  { id:3, title:'BI Pertahankan Suku Bunga Acuan 5,75%, Rupiah Menguat ke Rp 15.820/USD', source:'Detik Finance', time:'5j lalu', category:'Makro', ticker:null, sentiment:'positive' },
  { id:4, title:'ASII Ekspansi ke Kendaraan Listrik, Gandeng BYD untuk Produksi Lokal Mulai 2027', source:'CNBC Indonesia', time:'7j lalu', category:'Korporasi', ticker:'ASII', sentiment:'positive' },
  { id:5, title:'Inflasi Juli 2026 Tercatat 2,84% YoY, Sesuai Target BI', source:'Republika', time:'8j lalu', category:'Makro', ticker:null, sentiment:'neutral' },
  { id:6, title:'UNVR Pangkas Dividen 40%, Analis Rekomendasikan Sell Jelang Laporan Keuangan', source:'IDX Channel', time:'10j lalu', category:'Dividen', ticker:'UNVR', sentiment:'negative' },
  { id:7, title:'TLKM Investasi USD 800 Juta untuk Infrastruktur Data Center di Batam', source:'Tempo', time:'12j lalu', category:'Ekspansi', ticker:'TLKM', sentiment:'positive' },
  { id:8, title:'IPO Teknologi Terbesar 2026 Dijadwalkan September, Bidik Dana Rp 3,2 Triliun', source:'Market Bisnis', time:'1h lalu', category:'IPO', ticker:null, sentiment:'positive' },
]

export const SECTOR_MARKET = [
  { name:'Financials',     change:+1.42, stocks:8,  advDec:'6/2' },
  { name:'Consumer',       change:-0.38, stocks:14, advDec:'5/9' },
  { name:'Technology',     change:-0.77, stocks:5,  advDec:'2/3' },
  { name:'Industrial',     change:+1.56, stocks:7,  advDec:'5/2' },
  { name:'Mining',         change:+0.94, stocks:11, advDec:'7/4' },
  { name:'Healthcare',     change:+0.62, stocks:6,  advDec:'4/2' },
  { name:'Infrastructure', change:+1.84, stocks:9,  advDec:'7/2' },
  { name:'Energy',         change:+2.10, stocks:4,  advDec:'4/0' },
  { name:'Property',       change:-0.52, stocks:12, advDec:'4/8' },
]
