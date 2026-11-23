"""Daftar universe aset: saham AS, ETF, kripto spot, dan sisa master IDX."""

# Sektor saham IDX (Indonesian Stocks) - DEPRECATED
SECTOR_GROUP = {}

# Semua emiten IDX - DEPRECATED
FULL_EMITEN = {}

# Daftar inti untuk screener/analisa - DEPRECATED
CORE_TICKERS = []

# ─────────────────────────────────────────────────────────────────────────────
# ASSET BARU — Kripto Spot & Saham AS (target pivot produk dari fokus IDX)
# ─────────────────────────────────────────────────────────────────────────────

# Saham AS (Yahoo Finance memakai ticker tanpa suffix, mis. AAPL)
US_STOCKS = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology"},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology"},
    "NVDA": {"name": "NVIDIA Corp.", "sector": "Technology"},
    "AVGO": {"name": "Broadcom Inc.", "sector": "Technology"},
    "AMD": {"name": "Advanced Micro Devices", "sector": "Technology"},
    "INTC": {"name": "Intel Corp.", "sector": "Technology"},
    "CRM": {"name": "Salesforce Inc.", "sector": "Technology"},
    "ORCL": {"name": "Oracle Corp.", "sector": "Technology"},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Cyclical"},
    "TSLA": {"name": "Tesla Inc.", "sector": "Consumer Cyclical"},
    "HD": {"name": "Home Depot Inc.", "sector": "Consumer Cyclical"},
    "LOW": {"name": "Lowe's Cos. Inc.", "sector": "Consumer Cyclical"},
    "TGT": {"name": "Target Corp.", "sector": "Consumer Cyclical"},
    "NKE": {"name": "Nike Inc.", "sector": "Consumer Defensive"},
    "WMT": {"name": "Walmart Inc.", "sector": "Consumer Defensive"},
    "COST": {"name": "Costco Wholesale", "sector": "Consumer Defensive"},
    "UNH": {"name": "UnitedHealth Group", "sector": "Healthcare"},
    "JNJ": {"name": "Johnson & Johnson", "sector": "Healthcare"},
    "PFE": {"name": "Pfizer Inc.", "sector": "Healthcare"},
    "MRNA": {"name": "Moderna Inc.", "sector": "Healthcare"},
    "JPM": {"name": "JPMorgan Chase & Co.", "sector": "Financials"},
    "V": {"name": "Visa Inc.", "sector": "Financials"},
    "MA": {"name": "Mastercard Inc.", "sector": "Financials"},
    "PYPL": {"name": "PayPal Holdings", "sector": "Financials"},
    "BAC": {"name": "Bank of America Corp.", "sector": "Financials"},
    "GS": {"name": "Goldman Sachs Group", "sector": "Financials"},
    "XOM": {"name": "Exxon Mobil Corp.", "sector": "Energy"},
    "COP": {"name": "ConocoPhillips", "sector": "Energy"},
    "ENB": {"name": "Enbridge Inc.", "sector": "Energy"},
    "GOOGL": {"name": "Alphabet Inc. Class A", "sector": "Communication Services"},
    "META": {"name": "Meta Platforms Inc.", "sector": "Communication Services"},
    "DIS": {"name": "The Walt Disney Co.", "sector": "Communication Services"},
    "NFLX": {"name": "Netflix Inc.", "sector": "Communication Services"},
    "TMUS": {"name": "T-Mobile US Inc.", "sector": "Communication Services"},
    "VZ": {"name": "Verizon Communications Inc.", "sector": "Communication Services"},
    "BA": {"name": "The Boeing Co.", "sector": "Industrials"},
    "CAT": {"name": "Caterpillar Inc.", "sector": "Industrials"},
    "UNP": {"name": "Union Pacific Corp.", "sector": "Industrials"},
    "HON": {"name": "Honeywell International", "sector": "Industrials"},
    "GE": {"name": "GE Aerospace", "sector": "Industrials"},
}

# ETF indeks & sektor AS (diperlakukan seperti profil pasar, tanpa laporan keuangan)
ETFS = {
    "SPY": {"name": "SPDR S&P 500 ETF Trust"},
    "QQQ": {"name": "Invesco QQQ Trust"},
    "VOO": {"name": "Vanguard S&P 500 ETF"},
    "IWM": {"name": "iShares Russell 2000 ETF"},
    "DIA": {"name": "SPDR Dow Jones Industrial Average ETF Trust"},
    "GLD": {"name": "SPDR Gold Shares"},
    "TLT": {"name": "iShares 20+ Year Treasury Bond ETF"},
    "XLE": {"name": "Energy Select Sector SPDR Fund"},
    "XLF": {"name": "Financial Select Sector SPDR Fund"},
    "XLK": {"name": "Technology Select Sector SPDR Fund"},
}

# Kripto spot (Yahoo Finance memakai ticker-USD, mis. BTC-USD)
CRYPTO = {
    "BTC": {"name": "Bitcoin", "yf": "BTC-USD"},
    "ETH": {"name": "Ethereum", "yf": "ETH-USD"},
    "SOL": {"name": "Solana", "yf": "SOL-USD"},
    "XRP": {"name": "XRP", "yf": "XRP-USD"},
    "ADA": {"name": "Cardano", "yf": "ADA-USD"},
    "DOGE": {"name": "Dogecoin", "yf": "DOGE-USD"},
    "AVAX": {"name": "Avalanche", "yf": "AVAX-USD"},
    "LINK": {"name": "Chainlink", "yf": "LINK-USD"},
    "DOT": {"name": "Polkadot", "yf": "DOT-USD"},
    "LTC": {"name": "Litecoin", "yf": "LTC-USD"},
}

CRYPTO_TICKERS = sorted(CRYPTO)

# Indeks & aset makro pasar (crypto + ekuitas AS)
MARKET_ASSETS = [
    {"ticker": "SPX", "yf": "^GSPC", "name": "S&P 500", "kind": "index"},
    {"ticker": "IXIC", "yf": "^IXIC", "name": "Nasdaq Composite", "kind": "index"},
    {"ticker": "DJI", "yf": "^DJI", "name": "Dow Jones Industrial Average", "kind": "index"},
    {"ticker": "BTC", "yf": "BTC-USD", "name": "Bitcoin", "kind": "crypto"},
    {"ticker": "ETH", "yf": "ETH-USD", "name": "Ethereum", "kind": "crypto"},
]

# Gabungan universe baru untuk screener: saham AS + ETF + kripto spot
NEW_ASSET_TICKERS = sorted(
    set(US_STOCKS.keys())
    | set(ETFS.keys())
    | set(CRYPTO_TICKERS)
    | {a["ticker"] for a in MARKET_ASSETS if a["kind"] != "index"}
)

# Peta ticker → metadata untuk universe baru
NEW_ASSETS = {
    **{t: {**m, "kind": "us_stock"} for t, m in US_STOCKS.items()},
    **{t: {**m, "kind": "etf", "sector": "ETF"} for t, m in ETFS.items()},
    **{t: {**m, "kind": "crypto", "sector": "Kripto"} for t, m in CRYPTO.items()},
}

# Sektor untuk universe baru (GICS + Kripto)
NEW_SECTOR_GROUPS = [
    "Technology",
    "Communication Services",
    "Consumer Cyclical",
    "Consumer Defensive",
    "Financials",
    "Healthcare",
    "Energy",
    "Industrials",
    "ETF",
    "Kripto",
]

ALL_TICKERS = NEW_ASSET_TICKERS

LOGO_OVERRIDES = {}
