function pctToNum(v) {
  if (v == null) return null
  if (typeof v === 'number') return v * 100
  const n = parseFloat(String(v).replace('%', ''))
  return Number.isNaN(n) ? null : n
}

export function adaptStock(s) {
  const f = s.fundamental || {}
  const t = s.technical || {}

  const isBackend = Boolean(f.metrics)
  const m = f.metrics || {}

  // Backend shape: raw numerics at top-level, formatted strings inside metrics.
  // Mock shape: already formatted for frontend directly.
  const fundamental = isBackend
    ? {
        per: s.per,
        pbv: s.pbv,
        roe: s.roe != null ? +(s.roe * 100).toFixed(1) : null,
        roa: s.roe != null ? +(s.roe * 100).toFixed(1) : null,
        der: s.der,
        growth: pctToNum(m.growth),
        revenue_growth: pctToNum(m.revenue_growth),
        net_margin: pctToNum(m.net_margin),
        market_cap: s.market_cap,
        score: f.score,
        rating: f.rating,
        components: f.components,
      }
    : { per: f.per, pbv: f.pbv, roe: f.roe, der: f.der, growth: f.growth, score: f.score, rating: f.rating, components: f.components }

  const technical = isBackend
    ? {
        rsi: t.rsi,
        macd: t.macd,
        trend: t.trend,
        vol: t.vol_ratio,
        sma50: t.sma50,
        sma200: t.sma200,
        close: t.close,
        score: t.score,
        components: t.components,
      }
    : { rsi: t.rsi, macd: t.macd, trend: t.trend, vol: t.vol, score: t.score }

  return {
    ticker: s.ticker,
    name: s.name,
    sector: s.sector || 'Lainnya',
    price: s.price,
    change: s.change,
    volume: s.volume,
    marketCap: s.market_cap || s.marketCap || '—',
    composite: s.composite,
    signal: s.signal || 'HOLD',
    recommendation: s.recommendation,
    fundamental,
    technical,
  }
}

export function adaptHistory(rows = []) {
  return rows.map((r) => ({
    date: r.date,
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
    volume: r.volume,
  }))
}