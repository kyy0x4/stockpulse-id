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

# Kripto spot — 30 aset terbesar via Binance API (spot USDT)
# `binance`: quote currency default USDT. 10 pertama di-include di MARKET_ASSETS.
CRYPTO = {
    "BTC": {"name": "Bitcoin", "yf": "BTC-USD", "binance": "USDT", "cg_id": "bitcoin"},
    "ETH": {"name": "Ethereum", "yf": "ETH-USD", "binance": "USDT", "cg_id": "ethereum"},
    "USDT": {"name": "Tether USD", "yf": "USDT-USD", "binance": "USDC", "cg_id": "tether"},
    "BNB": {"name": "BNB", "yf": None, "binance": "USDT", "cg_id": "binancecoin"},
    "XRP": {"name": "XRP", "yf": "XRP-USD", "binance": "USDT", "cg_id": "ripple"},
    "SOL": {"name": "Solana", "yf": "SOL-USD", "binance": "USDT", "cg_id": "solana"},
    "USDC": {"name": "USD Coin", "yf": "USDC-USD", "binance": "USDT", "cg_id": "usd-coin"},
    "TRX": {"name": "TRON", "yf": "TRX-USD", "binance": "USDT", "cg_id": "tron"},
    "DOGE": {"name": "Dogecoin", "yf": "DOGE-USD", "binance": "USDT", "cg_id": "dogecoin"},
    "ADA": {"name": "Cardano", "yf": "ADA-USD", "binance": "USDT", "cg_id": "cardano"},
    "TON": {"name": "Toncoin", "yf": None, "binance": "USDT", "cg_id": "the-open-network"},
    "LINK": {"name": "Chainlink", "yf": "LINK-USD", "binance": "USDT", "cg_id": "chainlink"},
    "LTC": {"name": "Litecoin", "yf": "LTC-USD", "binance": "USDT", "cg_id": "litecoin"},
    "UNI": {"name": "Uniswap", "yf": "UNI-USD", "binance": "USDT", "cg_id": "uniswap"},
    "XLM": {"name": "Stellar", "yf": "XLM-USD", "binance": "USDT", "cg_id": "stellar"},
    "BCH": {"name": "Bitcoin Cash", "yf": "BCH-USD", "binance": "USDT", "cg_id": "bitcoin-cash"},
    "XMR": {"name": "Monero", "yf": "XMR-USD", "binance": "USDT", "cg_id": "monero"},
    "HYPE": {"name": "Hyperliquid", "yf": None, "binance": "USDT", "cg_id": "hyperliquid"},
    "NEAR": {"name": "NEAR Protocol", "yf": "NEAR-USD", "binance": "USDT", "cg_id": "near"},
    "ICP": {"name": "Internet Computer", "yf": "ICP-USD", "binance": "USDT", "cg_id": "internet-computer"},
    "ETC": {"name": "Ether Classic", "yf": "ETC-USD", "binance": "USDT", "cg_id": "ethereum-classic"},
    "POL": {"name": "Polygon", "yf": "POL-USD", "binance": "USDT", "cg_id": "polygon-ecosystem-token"},
    "APT": {"name": "Aptos", "yf": "APT-USD", "binance": "USDT", "cg_id": "aptos"},
    "ARB": {"name": "Arbitrum", "yf": "ARB-USD", "binance": "USDT", "cg_id": "arbitrum"},
    "FIL": {"name": "Filecoin", "yf": "FIL-USD", "binance": "USDT", "cg_id": "filecoin"},
    "ATOM": {"name": "Cosmos", "yf": "ATOM-USD", "binance": "USDT", "cg_id": "cosmos"},
    "AVAX": {"name": "Avalanche", "yf": "AVAX-USD", "binance": "USDT", "cg_id": "avalanche-2"},
    "JUP": {"name": "Jupiter", "yf": None, "binance": "USDT", "cg_id": "jupiter"},
    "SHIB": {"name": "Shiba Inu", "yf": "SHIB-USD", "binance": "USDT", "cg_id": "shiba-inu"},
    "INJ": {"name": "Injective", "yf": "INJ-USD", "binance": "USDT", "cg_id": "injective"},
    "DOT": {"name": "Polkadot", "yf": "DOT-USD", "binance": "USDT", "cg_id": "polkadot"},
    "OP": {"name": "Optimism", "yf": "OP-USD", "binance": "USDT", "cg_id": "optimism"},
    "GALA": {"name": "Gala", "yf": "GALA-USD", "binance": "USDT", "cg_id": "gala"},
    "WIF": {"name": "dogwifhat", "yf": None, "binance": "USDT", "cg_id": "dogwifhat"},
    "SEI": {"name": "Sei", "yf": "SEI-USD", "binance": "USDT", "cg_id": "sei-v2"},
    "AAVE": {"name": "Aave", "yf": "AAVE-USD", "binance": "USDT", "cg_id": "aave"},
    "SUI": {"name": "Sui", "yf": "SUI-USD", "binance": "USDT", "cg_id": "sui"},
    "SAND": {"name": "The Sandbox", "yf": "SAND-USD", "binance": "USDT", "cg_id": "the-sandbox"},
    "STX": {"name": "Stacks", "yf": "STX-USD", "binance": "USDT", "cg_id": "stacks-2"},
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

# Kripto untuk screener (40 dari 40 — semua CRYPTO)
# Gabungan universe baru untuk screener: saham AS (40) + ETF (10) + kripto (40)
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
