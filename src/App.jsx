import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import StockDetailPage from './pages/StockDetailPage'
import { useStocks } from './hooks/useStocks'
import { stocks as mockStocks } from './data/stocks'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ScreenerPage = lazy(() => import('./pages/ScreenerPage'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))
const MarketPage = lazy(() => import('./pages/MarketPage'))

const FAV_KEY = 'stockpulse-favorites'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.every((t) => typeof t === 'string')) return arr
    }
  } catch {
    /* ignore */
  }
  return ['BBCA', 'BBRI', 'ASII']
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-up/20 border-t-up" />
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [favorites, setFavorites] = useState(loadFavorites)
  const { stocks, loading, usingMock } = useStocks()

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites))
    } catch {
      /* ignore */
    }
  }, [favorites])

  const toggleFav = (ticker) => {
    setFavorites((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker],
    )
  }

  const data = stocks.length ? stocks : mockStocks

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 grid-pattern pointer-events-none" aria-hidden="true" />
      <div className="fixed -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-500/[0.06] blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="fixed -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-teal-500/[0.05] blur-[120px] pointer-events-none" aria-hidden="true" />

      <Sidebar
        active={page}
        onNavigate={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="relative ml-0 lg:ml-[240px] transition-all duration-300">
        <Topbar
          query={query}
          onSearch={setQuery}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main className="px-4 py-6 sm:px-6 md:px-8">
          <div className="mb-4">
            {usingMock && (
              <span className="text-[11px] text-warning/80 font-mono">mode demo · backend tidak terhubung, pakai data mock</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <PageWrapper key={page}>
              <Suspense fallback={<PageFallback />}>
                {page === 'dashboard' && (
                  <DashboardPage
                    stocks={data}
                    loading={loading}
                    onSelectStock={setSelected}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                  />
                )}
                {page === 'screener' && (
                  <ScreenerPage
                    stocks={data}
                    onSelectStock={setSelected}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                  />
                )}
                {page === 'watchlist' && (
                  <WatchlistPage
                    favorites={favorites}
                    stocks={data}
                    onSelectStock={setSelected}
                    onToggleFav={toggleFav}
                  />
                )}
                {page === 'market' && <MarketPage stocks={data} />}
              </Suspense>
            </PageWrapper>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selected && (
          <StockDetailPage
            stock={selected}
            onClose={() => setSelected(null)}
            onToggleFav={toggleFav}
            favorites={favorites}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
