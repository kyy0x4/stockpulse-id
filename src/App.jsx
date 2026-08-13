import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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
const NewsPage = lazy(() => import('./pages/NewsPage'))

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

function Shell({ favorites, toggleFav, selected, setSelected }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { stocks, loading, usingMock } = useStocks()

  const page = location.pathname.replace(/^\//, '') || 'dashboard'

  const navigateTo = (id) => navigate(id === 'dashboard' ? '/' : `/${id}`)

  const data = stocks.length ? stocks : mockStocks

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 grid-pattern pointer-events-none" aria-hidden="true" />
      <div className="fixed -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-500/[0.06] blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="fixed -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-teal-500/[0.05] blur-[120px] pointer-events-none" aria-hidden="true" />

      <Sidebar
        active={page}
        onNavigate={navigateTo}
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
            <PageWrapper key={location.pathname}>
              <Suspense fallback={<PageFallback />}>
                <Routes location={location}>
                  <Route path="/" element={<DashboardPage
                    stocks={data}
                    loading={loading}
                    onSelectStock={setSelected}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                  />} />
                  <Route path="/screener" element={<ScreenerPage
                    stocks={data}
                    onSelectStock={setSelected}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                  />} />
                  <Route path="/watchlist" element={<WatchlistPage
                    favorites={favorites}
                    stocks={data}
                    onSelectStock={setSelected}
                    onToggleFav={toggleFav}
                  />} />
                  <Route path="/market" element={<MarketPage stocks={data} />} />
                  <Route path="/news" element={<NewsPage onSelectStock={setSelected} />} />
                  <Route path="*" element={<DashboardPage
                    stocks={data}
                    loading={loading}
                    onSelectStock={setSelected}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                  />} />
                </Routes>
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

export default function App() {
  const [favorites, setFavorites] = useState(loadFavorites)
  const [selected, setSelected] = useState(null)

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

  return (
    <BrowserRouter>
      <Shell favorites={favorites} toggleFav={toggleFav} selected={selected} setSelected={setSelected} />
    </BrowserRouter>
  )
}