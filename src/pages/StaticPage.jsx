import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { ChevronRight, FileText, Scroll, BookOpen, ShieldAlert, Mail } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'

const CONTENT = {
  'about': {
    icon: FileText,
    title: 'About MARKETIQ',
    badge: 'PROFIL',
    sections: [
      {
        heading: 'Siapa Kami',
        body: 'MARKETIQ adalah platform data pasar generasi baru yang merangkum informasi saham AS, ETF, dan kripto ke dalam satu terminal yang cepat, rapi, dan fokus pada keputusan. Kami membangun pengalaman yang mengutamakan kecepatan dan kejelasan data — bukan deretan angka tanpa konteks.'
      },
      {
        heading: 'Apa Yang Kami Layani',
        body: 'Screener 88+ aset, detail fundamental dan teknikal per aset, chart TradingView real-time, berita market & makro, watchlist, dan portofolio tracking. Data harga saham AS & ETF berasal dari Yahoo Finance; data kripto spot dari Binance dan CoinGecko — diperbarui berkala di backend kami.'
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
    icon: Mail,
    title: 'Hubungi Kami',
    badge: 'DUKUNGAN',
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
    icon: ShieldAlert,
    title: 'Pernyataan Tanggung Jawab',
    badge: 'LEGAL',
    sections: [
      {
        heading: 'Bukan Nasihat Keuangan',
        body: 'Semua konten di MARKETIQ — termasuk sinyal BUY/HOLD/SELL, skor komposit, analisis teknikal, dan berita — disediakan hanya untuk tujuan informasi dan edukasi. Bukan rekomendasi jual/beli, ajakan, atau nasihat investasi, pajak, atau hukum.'
      },
      {
        heading: 'Risiko Pasar',
        body: 'Saham, ETF, dan kripto memiliki risiko tinggi. Harga dapat berfluktuasi tajam; nilai mata uang kripto lebih volatil. Jangan berinvestasi lebih dari yang siap Anda kehilangan. Selalu lakukan riset mandiri (DYOR) sebelum mengambil keputusan.'
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
    icon: Scroll,
    title: 'Ketentuan Penggunaan',
    badge: 'LEGAL',
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
    icon: BookOpen,
    title: 'Kebijakan Privasi',
    badge: 'LEGAL',
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
  const Icon = page.icon

  return (
    <div className="page-wrap pt-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-[880px] mx-auto"
      >
        <Card>
          <CardHeader className="px-6 pt-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-accent-dim border border-accent-line flex items-center justify-center">
                <Icon size={18} className="text-accent" />
              </div>
              <div>
                <CardTitle className="font-display text-[24px] font-extrabold text-foreground">
                  {page.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px] font-mono tracking-[0.1em]">
                    {page.badge}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Diperbarui: Nov 2026 · MARKETIQ Legal
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <Accordion type="multiple" defaultValue={page.sections.map((_, i) => `item-${i}`)} className="flex flex-col gap-1">
              {page.sections.map((s, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-[13px] font-semibold text-foreground hover:text-accent">
                    <span className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {s.heading}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[13.5px] leading-[1.65] text-ink-soft mt-2.5">
                    {s.body}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Separator className="my-5" />

            <div className="text-[11px] text-muted-foreground font-mono flex justify-between flex-wrap gap-2.5">
              <span>© 2026 MARKETIQ · All rights reserved.</span>
              <span>{pathname.replace(/^\//, '').replace(/-/g, ' ').toUpperCase()}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
