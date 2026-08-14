function pctToNum(v) {
  if (v == null) return null
  if (typeof v === 'number') return v * 100
  const n = parseFloat(String(v).replace('%', ''))
  return Number.isNaN(n) ? null : n
}

export function adaptStock(s) {
  const src = { ...s.payload, ...s }
  const f = src.fundamental || {}
  const t = src.technical || {}

  const isBackend = Boolean(f.metrics)
  const m = f.metrics || {}

  // Backend shape: raw numerics at top-level, formatted strings inside metrics.
  // Mock shape: already formatted for frontend directly.
  const fundamental = isBackend
    ? {
        per: src.per,
        pbv: src.pbv,
        roe: src.roe != null ? +(src.roe * 100).toFixed(1) : null,
        roa: src.roa != null ? +(src.roa * 100).toFixed(1) : pctToNum(m.roa),
        der: src.der,
        growth: pctToNum(m.growth),
        revenue_growth: pctToNum(m.revenue_growth),
        net_margin: pctToNum(m.net_margin),
        op_margin: pctToNum(m.op_margin),
        fcf_yield: pctToNum(m.fcf_yield),
        peg: m.peg != null ? parseFloat(m.peg) : null,
        market_cap: src.market_cap,
        score: f.score,
        rating: f.rating,
        pillars: f.pillars,
        components: f.components,
      }
    : { per: f.per, pbv: f.pbv, roe: f.roe, der: f.der, growth: f.growth, score: f.score, rating: f.rating, components: f.components }

  const technical = isBackend
    ? {
        rsi: t.rsi,
        macd: t.macd,
        trend: t.trend,
        vol: t.vol_ratio ?? t.vol,
        ema21: t.ema21,
        ema34: t.ema34,
        ema55: t.ema55,
        ema21w: t.ema21w,
        ema34w: t.ema34w,
        ema55w: t.ema55w,
        ema_cross: t.ema_cross,
        ema_cross_weekly: t.ema_cross_weekly,
        structure: t.structure,
        bos: t.bos,
        choch: t.choch,
        close: t.close,
        score: t.score,
        components: t.components,
      }
    : { rsi: t.rsi, macd: t.macd, trend: t.trend, vol: t.vol, score: t.score }

  return {
    ticker: src.ticker,
    name: src.name,
    sector: src.sector || 'Lainnya',
    website: src.website,
    logoUrl: `/logos/${src.ticker}.svg`,
    logoFallback: src.logo_url,
    price: src.price,
    change: src.change,
    volume: src.volume,
    marketCap: src.market_cap || src.marketCap || '—',
    composite: src.composite,
    signal: src.signal || 'HOLD',
    recommendation: src.recommendation,
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
