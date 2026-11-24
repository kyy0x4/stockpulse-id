import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import TopNav from './components/layout/TopNav'
import TickerTape from './components/layout/TickerTape'
import Footer from './components/layout/Footer'
import StockDetailPage from './pages/StockDetailPage'
import AuthPage from './pages/AuthPage'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { accountApi } from './api/auth'
import { useTheme } from './theme/ThemeProvider'
import { useStocks } from './hooks/useStocks'
import { stocks as mockStocks } from './data/stocks'
import { viewStock } from './components/ui/DashboardComponents'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ScreenerPage = lazy(() => import('./pages/ScreenerPage'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))
const MarketPage = lazy(() => import('./pages/MarketPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const MarketPulsePage = lazy(() => import('./pages/MarketPulsePage'))
const NewsImpactPage = lazy(() => import('./pages/NewsImpactPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const MacroPage = lazy(() => import('./pages/MacroPage'))
const StaticPage = lazy(() => import('./pages/StaticPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

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

function StockDetailRoute({ stocks, favorites, onToggleFav, theme }) {
  const { ticker } = useParams()
  const navigate = useNavigate()
  const stock = stocks.find((s) => s.ticker === ticker?.toUpperCase())

  if (!stock) {
    return (
      <div style={{ padding: 28 }}>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Saham tidak ditemukan</p>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: 14, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', padding: '8px 12px', cursor: 'pointer' }}
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  return (
    <StockDetailPage
      stock={stock}
      onClose={() => navigate(-1)}
      onToggleFav={onToggleFav}
      favorites={favorites}
      theme={theme}
    />
  )
}

function Shell({ favorites, toggleFav, theme, toggleTheme, stocks, loading, usingMock, user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const page = location.pathname.replace(/^\//, '') || 'dashboard'

  const navigateTo = (id) => {
    if (id === 'dashboard') navigate('/')
    else navigate(`/${id}`)
  }

  const baseData = stocks.length ? stocks : mockStocks
  const data = query.trim()
    ? baseData.filter((s) => {
        const v = viewStock(s)
        const q = query.trim().toLowerCase()
        return (
          String(v.ticker || '').toLowerCase().includes(q) ||
          String(v.name || '').toLowerCase().includes(q) ||
          String(v.sector || '').toLowerCase().includes(q)
        )
      })
    : baseData

  const openDetail = (stock) => navigate(`/stock/${stock.ticker}`)

  return (
    <div className="app-shell">
      <TopNav
        page={page}
        onNavigate={navigateTo}
        query={query}
        onSearch={setQuery}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onLogout={onLogout}
      />

      <TickerTape stocks={data} />

      <main className="app-main">
        {usingMock && (
          <div className="page-wrap" style={{ paddingBottom: 0, paddingTop: 10 }}>
            <span className="tag tag-amber" style={{ height: 24 }}>mode demo · backend tidak terhubung</span>
          </div>
        )}
        <div className="page-wrap">
          <AnimatePresence mode="wait">
            <PageWrapper key={location.pathname}>
              <Suspense fallback={<PageFallback />}>
                <Routes location={location}>
                  <Route path="/" element={<DashboardPage
                    stocks={data}
                    loading={loading}
                    onSelectStock={openDetail}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                    theme={theme}
                  />} />
                  <Route path="/screener" element={<ScreenerPage
                    stocks={data}
                    onSelectStock={openDetail}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                    theme={theme}
                  />} />
                  <Route path="/watchlist" element={<WatchlistPage
                    favorites={favorites}
                    stocks={data}
                    onSelectStock={openDetail}
                    onToggleFav={toggleFav}
                    theme={theme}
                  />} />
                  <Route path="/market" element={<MarketPage stocks={data} theme={theme} />} />
                  <Route path="/macro" element={<MacroPage />} />
                  <Route path="/news" element={<NewsPage onSelectStock={openDetail} stocks={data} theme={theme} />} />
                  <Route path="/market-pulse" element={<MarketPulsePage stocks={data} theme={theme} />} />
                  <Route path="/news-impact" element={<NewsImpactPage onSelectStock={openDetail} stocks={data} theme={theme} />} />
                  <Route path="/portfolio" element={<PortfolioPage stocks={data} onSelectStock={openDetail} />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/about" element={<StaticPage slug="about" />} />
                  <Route path="/contact" element={<StaticPage slug="contact" />} />
                  <Route path="/disclaimer" element={<StaticPage slug="disclaimer" />} />
                  <Route path="/terms" element={<StaticPage slug="terms" />} />
                  <Route path="/privacy" element={<StaticPage slug="privacy" />} />
                  <Route path="/stock/:ticker" element={<StockDetailRoute stocks={data} favorites={favorites} onToggleFav={toggleFav} theme={theme} />} />
                  <Route path="*" element={<DashboardPage
                    stocks={data}
                    loading={loading}
                    onSelectStock={openDetail}
                    onToggleFav={toggleFav}
                    favorites={favorites}
                    theme={theme}
                  />} />
                </Routes>
              </Suspense>
            </PageWrapper>
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Splash() {
  return (
    <div className="fixed inset-0 grid-bg flex flex-col items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-up/20 border-t-up" />
      <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.3em', color: 'var(--text3)' }}>
        MARKET<span style={{ color: 'var(--accent)' }}>IQ</span>
      </div>
    </div>
  )
}

function Root() {
  const { user, initializing, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { stocks, loading, usingMock } = useStocks()
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    if (user) {
      accountApi
        .watchlist()
        .then((r) => setFavorites(r.tickers || []))
        .catch(() => setFavorites([]))
    } else {
      setFavorites([])
    }
  }, [user])

  const toggleFav = (ticker) => {
    setFavorites((prev) => {
      const on = !prev.includes(ticker)
      const next = on ? [...prev, ticker] : prev.filter((t) => t !== ticker)
      ;(on ? accountApi.addWatch(ticker) : accountApi.removeWatch(ticker)).catch(() => {})
      return next
    })
  }

  if (initializing) return <Splash />

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    )
  }

  return (
    <Shell
      favorites={favorites}
      toggleFav={toggleFav}
      theme={theme}
      toggleTheme={toggleTheme}
      stocks={stocks}
      loading={loading}
      usingMock={usingMock}
      user={user}
      onLogout={logout}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </AuthProvider>
  )
}