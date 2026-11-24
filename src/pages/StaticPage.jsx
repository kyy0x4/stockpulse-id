import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const CONTENT = {
  'about': {
    title: 'About MARKETIQ',
    sections: [
      {
        heading: 'Siapa Kami',
        body: 'MARKETIQ adalah platform data pasar generasi baru yang merangkum informasi saham AS, ETF, dan kripto ke dalam satu terminal yang cepat, rapi, dan fokus pada keputusan. Kami membangun pengalaman yang mengutamakan kecepatan dan kejelasan data — bukan deretan angka tanpa konteks.'
      },
      {
        heading: 'Apa Yang Kami Layani',
        body: 'Screener 88+ aset, detail fundamental dan teknikal per aset, chartTradingView real-time, berita market & makro, watchlist, dan portofolio tracking. Data harga saham AS & ETF berasal dari Yahoo Finance; data kripto spot dari Binance dan CoinGecko — diperbarui berkala di backend kami.'
      },
      {
        heading: 'Prinsip Kami',
        body: 'Data transparan, sumber jelas, dan sinyal yang dapat diaudit. Skor BUY/HOLD/SELL kami dihasilkan dari gabungan metrik fundamental, teknikal, dan momentum — bukan rekomendasi keuangan. Semua pengguna dapat membuka detail per metrik untuk memahami logika di baliknya.'
      },
      {
        heading: 'Kontak',
        body: 'Punya umpan balik atau pertanyaan? Hubungi kami di support@marketiq.app. Kami memantau setiap laporan dan berusaha merespons dalam 1×24 jam kerja.'
      }
    ]
  },
  'contact': {
    title: 'Hubungi Kami',
    sections: [
      {
        heading: 'Pusat Bantuan',
        body: 'Kunjungi halaman FAQ di dashboard atau kirimkan pertanyaan langsung ke support@marketiq.app. Untuk laporan bug, sertakan browser, OS, dan tangkapan layar (jika relevan).'
      },
      {
        heading: 'Kemitraan & Media',
        body: 'Untuk kerjasama konten, kemitraan data, atau permintaan media, email ke partnerships@marketiq.app. Kami terbuka terhadap integrasi API dan program afiliasi — detail tersedia setelah verifikasi.'
      },
      {
        heading: 'Respons & SLA',
        body: 'Tiket dukungan prioritas (Pro/Enterprise) diupayakan direspons di bawah 4 jam kerja pada hari kerja. Untuk semua rencana, maksimal 24 jam kerja.'
      }
    ]
  },
  'disclaimer': {
    title: 'Pernyataan Tanggung Jawab',
    sections: [
      {
        heading: 'Bukan Nasihat Keuangan',
        body: 'Semua konten di MARKETIQ — termasuk sinyal BUY/HOLD/SELL, skor komposit, analisis teknikal, dan berita — disediakan hanya untuk tujuan informasi dan edukasi. Bukan rekomendasi jual/beli, ajakan, atau nasihat investasi, pajak, atau hukum.'
      },
      {
        heading: 'Risiko Pasar',
        body: 'Saham, ETF, dan kripto memiliki risiko tinggi. Harga dapat berfluktuasi tajam; nilaimata uang kripto lebih volatil. Jangan berinvestasi lebih dari yang siap Anda kehilangan. Selalu lakukan riset mandiri (DYOR) sebelum mengambil keputusan.'
      },
      {
        heading: 'Akurasi Data',
        body: 'Data dikumpulkan dari sumber pihak ketiga (Yahoo Finance, Binance, CoinGecko, API berita) dan dapat memiliki jeda (delay), kesalahan, atau revisi. MARKETIQ tidak menjamin kelengkapan atau ketepatan absolut untuk keputusan finansial.'
      },
      {
        heading: 'Penggunaan',
        body: 'Anda bertanggung jawab penuh atas segala keputusan investasi yang diambil berdasarkan konten MARKETIQ. Kami tidak menerima tanggung jawab atas kerugian yang timbul dari penggunaan platform ini.'
      }
    ]
  },
  'terms': {
    title: 'Ketentuan Penggunaan',
    sections: [
      {
        heading: '1. Penerimaan',
        body: 'Dengan mengakses MARKETIQ, Anda menyetujui ketentuan ini. Jika tidak setuju, hentikan penggunaan platform.'
      },
      {
        heading: '2. Akun & Keamanan',
        body: 'Anda bertanggung jawab menjaga kerahasiaan kredensial akun. Laporkan segera akses yang tidak sah. Kami berhak membatasi/menonaktifkan akun yang menyalahgunakan layanan.'
      },
      {
        heading: '3. Lisensi Konten',
        body: 'Seluruh data, UI, logo, dan analisis MARKETIQ dilindungi hak cipta. Dilarang mengulang, mereproduksi, atau memperjualbelikan konten tanpa izin tertulis. Rencana Pro/Enterprise termasuk lisensi penggunaan komersial sesuai kontrak.'
      },
      {
        heading: '4. Pengecualian Tanggung Jawab',
        body: 'MARKETIQ disediakan "sebagaimana adanya". Kami tidak menjamin uptime, akurasi, atau kebebasan dari kesalahan. Dalam hal yang diperbolehkan hukum, tanggung jawab kami dibatasi nilai langganan 12 bulan terakhir.'
      },
      {
        heading: '5. Penghentian Layanan',
        body: 'Kami dapat menghentikan layanan secara permanen atau sementara dengan alasan sah (keamanan, pemeliharaan, pelanggaran). Data akun Anda tetap dapat diekspor dalam periode pemberitahuan 30 hari.'
      },
      {
        heading: '6. Hukum yang Berlaku',
        body: 'Ketentuan ini diatur oleh hukum yurisdiksi tempat entitas MARKETIQ terdaftar. Perselisihan diselesaikan di pengadilan yang berwenang.'
      }
    ]
  },
  'privacy': {
    title: 'Kebijakan Privasi',
    sections: [
      {
        heading: 'Data yang Kami Kumpulkan',
        body: 'Identitas akun (email, nama), preferensi watchlist & portofolio, log akses (IP, browser, jam), dan data analitik agregat. Kami tidak menjual data pribadi Anda ke pihak ketiga.'
      },
      {
        heading: 'Penggunaan',
        body: 'Data digunakan untuk: menyajikan personalisasi (watchlist, sinyal), menjaga keamanan akun, dan meningkatkan produk. Analitik agregat (anonim) membantu pengembangan fitur.'
      },
      {
        heading: 'Penyimpanan & Retensi',
        body: 'Data disimpan di server ber-enkripsi (TLS/At-Rest). Setelah akun dihapus, data dihapus permanen dalam 30 hari. Log akses maksimal 90 hari.'
      },
      {
        heading: 'Kontrol Pengguna',
        body: 'Anda dapat mengekspor/menghapus data watchlist, portofolio, dan preferensi kapan saja dari halaman Akun. Untuk permintaan penghapusan total (GDPR/CCPA), email privacy@marketiq.app.'
      },
      {
        heading: 'Perubahan Kebijakan',
        body: 'Kebijakan ini dapat diperbarui. Perubahan material akan diumumkan di platform dan di-email 14 hari sebelum berlaku.'
      }
    ]
  }
}

export default function StaticPage({ slug }) {
  const page = CONTENT[slug] || CONTENT.disclaimer
  const { pathname } = useLocation()

  return (
    <div className="page-wrap" style={{ paddingTop: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="cg-card"
        style={{ maxWidth: 880, margin: '0 auto', padding: 28 }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{page.title}</h1>
        <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
          Diperbarui: Nov 2026 · MARKETIQ Legal
        </p>

        {page.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: i === page.sections.length - 1 ? 0 : 22 }}>
            <h2 style={{
              fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{
                height: 6, width: 6, borderRadius: 3, background: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent-dim)'
              }} />
              {s.heading}
            </h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text2)' }}>{s.body}</p>
          </div>
        ))}

        <div style={{
          marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
        }}>
          <span>© 2026 MARKETIQ · All rights reserved.</span>
          <span>{pathname.replace(/^\//, '').replace(/-/g, ' ').toUpperCase()}</span>
        </div>
      </motion.div>
    </div>
  )
}
