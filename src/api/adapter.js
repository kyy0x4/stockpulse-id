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
  const kind = src.kind || (['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT', 'LTC'].includes(src.ticker) ? 'crypto' : 'us_stock')
  const isProfile = kind === 'crypto' || kind === 'etf'

  // Backend sudah menormalkan ROE/ROA ke persen (mis. 0.14 → 14), jadi jangan
  // dikali 100 lagi di sini.
  const roeNum = src.roe != null ? Number(src.roe) : pctToNum(m.roe)
  const roaNum = src.roa != null ? Number(src.roa) : pctToNum(m.roa)
  const capStr = src.market_cap != null && src.market_cap !== '—' ? src.market_cap : (src.marketCap ?? null)

  // Backend shape: raw numerics at top-level, formatted strings inside metrics.
  // Mock shape: already formatted for frontend directly.
  const fundamental = isBackend
    ? {
        per: isProfile ? null : src.per,
        pbv: isProfile ? null : src.pbv,
        roe: !isProfile && roeNum != null ? +roeNum.toFixed(1) : null,
        roa: !isProfile && roaNum != null ? +roaNum.toFixed(1) : null,
        der: isProfile ? null : src.der,
        growth: pctToNum(m.growth),
        revenue_growth: pctToNum(m.revenue_growth),
        net_margin: pctToNum(m.net_margin),
        op_margin: pctToNum(m.op_margin),
        fcf_yield: pctToNum(m.fcf_yield),
        peg: m.peg != null ? parseFloat(m.peg) : null,
        market_cap: capStr,
        score: f.score,
        rating: f.rating,
        pillars: f.pillars,
        components: f.components,
        metrics: m,
        return_30d: pctToNum(m.return_30d),
        return_90d: pctToNum(m.return_90d),
        return_1y: pctToNum(m.return_1y),
        drawdown_52w: pctToNum(m.drawdown_52w),
      }
    : {
        per: f.per,
        pbv: f.pbv,
        roe: f.roe,
        der: f.der,
        growth: f.growth,
        score: f.score,
        rating: f.rating,
        pillars: f.pillars,
        components: f.components,
        metrics: f.metrics,
        return_30d: pctToNum(f.metrics?.return_30d),
        return_90d: pctToNum(f.metrics?.return_90d),
        return_1y: pctToNum(f.metrics?.return_1y),
        drawdown_52w: pctToNum(f.metrics?.drawdown_52w),
      }

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
    kind,
    currency: src.currency || 'USD',
    sector: src.sector || 'Lainnya',
    website: src.website,
    logoUrl: src.logo_url || src.logoUrl || null,
    logoFallback: src.logo_fallback || src.logoFallback || null,
    price: src.price,
    change: src.change,
    volume: src.volume,
    marketCap: capStr,
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
