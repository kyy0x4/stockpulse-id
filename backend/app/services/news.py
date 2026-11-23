"""Fetch berita pasar internasional (kripto, saham AS, makro, geopolitik) dari RSS + analisa dampak."""

import re
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

from app.data.tickers import NEW_ASSETS

# Sumber RSS gratis (tanpa API key). Setiap kategori punya beberapa feed agar
# cakupan berita luas dan tidak bergantung pada satu penerbit.
FEEDS = {
    # Kripto global
    "crypto": [
        "https://www.coindesk.com/arc/outboundfeeds/rss/",
        "https://cointelegraph.com/rss",
        "https://decrypt.co/feed",
        "https://www.theblock.co/rss.xml",
    ],
    # Saham & pasar AS
    "us": [
        "https://www.cnbc.com/id/100003114/device/rss/rss.html",
        "https://finance.yahoo.com/news/rssindex",
        "https://feeds.content.dowjones.io/public/rss/mw_topstories",
        "https://www.nasdaq.com/feed/rssoutbound?category=Markets",
    ],
    # Data & kebijakan ekonomi AS
    "macro": [
        "https://www.cnbc.com/id/20910258/device/rss/rss.html",
        "https://www.federalreserve.gov/feeds/press_all.xml",
        "https://www.bls.gov/feed/news_release.rss",
        "https://www.ecb.europa.eu/rss/press.html",
    ],
    # Geopolitik global
    "geopolitik": [
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://feeds.npr.org/1004/rss.xml",
        "https://www.theguardian.com/world/rss",
    ],
}

# Alias kategori lama → kategori baru
CATEGORY_ALIAS = {"market": "us", "ekbis": "macro", "ekonomi": "macro", "world": "geopolitik"}

UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36 PulseTerminal"
}

# Mapping nama perusahaan / aset → ticker (untuk mendeteksi aset yang disebut di berita)
COMPANY_NAMES = {
    # ── Saham AS ──
    "apple": "AAPL", "iphone": "AAPL",
    "microsoft": "MSFT", "azure": "MSFT",
    "nvidia": "NVDA", "geforce": "NVDA",
    "broadcom": "AVGO",
    "advanced micro devices": "AMD", "amd": "AMD",
    "intel": "INTC",
    "salesforce": "CRM",
    "oracle": "ORCL",
    "amazon": "AMZN", "aws": "AMZN",
    "tesla": "TSLA", "elon musk": "TSLA",
    "home depot": "HD",
    "lowe's": "LOW", "lowes": "LOW",
    "target": "TGT",
    "nike": "NKE",
    "walmart": "WMT",
    "costco": "COST",
    "unitedhealth": "UNH",
    "johnson & johnson": "JNJ", "johnson and johnson": "JNJ",
    "pfizer": "PFE",
    "moderna": "MRNA",
    "jpmorgan": "JPM", "jp morgan": "JPM",
    "visa": "V",
    "mastercard": "MA",
    "paypal": "PYPL",
    "bank of america": "BAC",
    "goldman sachs": "GS", "goldman": "GS",
    "exxon": "XOM", "exxonmobil": "XOM",
    "conocophillips": "COP",
    "enbridge": "ENB",
    "alphabet": "GOOGL", "google": "GOOGL",
    "meta platforms": "META", "facebook": "META", "instagram": "META",
    "disney": "DIS",
    "netflix": "NFLX",
    "t-mobile": "TMUS",
    "verizon": "VZ",
    "boeing": "BA",
    "caterpillar": "CAT",
    "union pacific": "UNP",
    "honeywell": "HON",
    "ge aerospace": "GE",
    # ── Kripto spot ──
    "bitcoin": "BTC", "btc": "BTC",
    "ethereum": "ETH", "ether": "ETH", "eth": "ETH",
    "solana": "SOL", "sol": "SOL",
    "xrp": "XRP", "ripple": "XRP",
    "cardano": "ADA", "ada": "ADA",
    "dogecoin": "DOGE", "doge": "DOGE",
    "avalanche": "AVAX", "avax": "AVAX",
    "chainlink": "LINK", "link": "LINK",
    "polkadot": "DOT", "dot": "DOT",
    "litecoin": "LTC", "ltc": "LTC",
}

# ── Sentimen: kata lemah/kuat + negasi (Indonesia + Inggris) ─────────────
STRONG_POSITIVE = [
    # Indonesia
    "melompat", "melonjak", "meroket", "cetak rekor", "all-time", "rally", "bullish",
    "rekor", "berlipat", "surplus", "menguat", "penguatan", "lonjakan", "cuan",
    # Inggris
    "surge", "soar", "skyrocket", "record high", "breakout", "bull run",
    "strong buy", "beat estimates", "upgrade", "all-time high",
]
POSITIVE = [
    # Indonesia
    "naik", "tumbuh", "tumbuhnya", "untung", "profit", "membaik", "bonus",
    "akuisisi", "ekspansi", "optimis", "optimisme", "harapan", "kenaikan", "laba",
    "positif", "dukung", "meningkat", "meningkatkan", "pendapatan", "berhasil", "kuat",
    "subsidi", "insentif", "percepatan", "menanjak", "mendongkrak", "keuntungan",
    "menang", "tender", "kontrak", "pembagian", "cairkan", "buyback", "perkuat",
    "perbaikan", "menguatkan", "mendorong", "rebound", "apresiasi", "perkasa",
    "impresif", "moncer", "subur", "gemilang", "meninggi",
    # Inggris
    "gain", "gains", "rise", "rises", "rising", "jump", "jumps", "climb", "climbs",
    "growth", "grow", "grew", "beat", "beats", "strong", "positive", "upside",
    "buy", "bullish", "approval", "approved", "adoption", "partnership", "inflow",
    "inflows", "record", "high", "outperform", "upbeat", "optimism", "recovery",
    "recover", "profit", "profits", "revenue", "earnings", "demand",
]
STRONG_NEGATIVE = [
    # Indonesia
    "anjlok", "jeblok", "merosot", "terpuruk", "pailit", "bangkrut", "resesi", "krisis",
    "gagal bayar", "delisting", "korupsi", "perang", "collapse",
    # Inggris
    "crash", "plunge", "plummet", "tumble", "selloff", "sell-off", "bear market",
    "bankruptcy", "default", "meltdown", "panic", "hack", "exploit", "fraud",
    "catastrophe", "invasion", "war",
]
NEGATIVE = [
    # Indonesia
    "turun", "rugi", "pelemahan", "melemah", "gagal", "penurunan", "kerugian", "sanksi",
    "phk", "drop", "minus", "tekanan", "jual", "bearish", "kekhawatiran", "tarif",
    "protes", "mogok", "pemecatan", "defisit", "utang", "tunggakan", "tertekan",
    "koreksi", "penjualan", "merugi", "mengalami kerugian", "menurunkan", "terancam",
    "penyidikan", "denda", "tuntutan", "kebakaran", "kecelakaan", "bencana",
    "peringatan", "warning", "terkoreksi", "jebol", "lesu",
    # Inggris
    "fall", "falls", "falling", "drop", "drops", "decline", "declines", "slump",
    "slumps", "loss", "losses", "miss", "misses", "weak", "negative", "downside",
    "sell", "bearish", "downgrade", "lawsuit", "investigation", "fine", "penalty",
    "ban", "banned", "sanction", "sanctions", "tariff", "tariffs", "inflation",
    "recession", "layoff", "layoffs", "strike", "strikes", "conflict", "tension",
    "tensions", "attack", "risk", "risks", "fear", "fears", "uncertainty", "outflow",
    "outflows", "warning", "cut", "cuts", "slowdown", "slowing",
]

NEGATIONS = {"tidak", "bukan", "tak", "tanpa", "belum", "jangan", "menolak", "stop"}

WORD_RE = re.compile(r"[a-z0-9]+")
TICKER_RE = re.compile(r"\$([A-Z]{2,5})\b|saham\s+([A-Z]{2,5})\b", re.IGNORECASE)
UPPER_WORD_RE = re.compile(r"\b[A-Z]{2,5}\b")

# Berapa banyak feed per kategori yang ditelusuri paralel
MAX_FEEDS = 4

# Kata kunci relevansi pasar/bisnis — feed umum difilter
RELEVANCE_KEYS = [
    # Inggris / global
    "stock", "stocks", "market", "markets", "wall street", "nasdaq", "s&p", "dow",
    "earnings", "revenue", "profit", "fed", "federal reserve", "interest rate",
    "inflation", "cpi", "jobs", "payroll", "gdp", "economy", "economic", "treasury",
    "yield", "bond", "dollar", "oil", "gold", "commodity", "commodities", "tariff",
    "trade", "sanction", "sanctions", "geopolitic", "geopolitics", "war", "conflict",
    "election", "opec", "china", "europe", "ecb", "bank of japan", "boj",
    # Kripto
    "bitcoin", "ethereum", "crypto", "cryptocurrency", "blockchain", "token", "coin",
    "defi", "stablecoin", "etf", "binance", "coinbase", "solana", "xrp", "altcoin",
    # Indonesia (dipertahankan untuk konteks)
    "saham", "ihsg", "bursa", "emiten", "rupiah", "bank sentral", "inflasi",
    "suku bunga", "ekonomi", "investasi", "obligasi", "dividen", "ipo", "trading",
]

# ── Deteksi event ──────────────────────────────────────────
# Setiap event: (label, bobot, arah, scope, match_fn(low) -> pos atau None)
# arah: +1 positif, -1 negatif, 0 kontekstual (ikut sentimen)
# scope: emiten / sektor / pasar

def _near(low, a, b, dist=26):
    """Cari dua frasa (urutan bebas) yang jaraknya <= dist karakter. Return pos terawal."""
    pa = list(re.finditer(r"\b" + re.escape(a) + r"\b", low))
    pb = [m for m in re.finditer(r"\b" + re.escape(b) + r"\b", low)]
    best = None
    for m in pa:
        for j in pb:
            if abs(m.start() - j.start()) <= dist:
                pos = min(m.start(), j.start())
                if best is None or pos < best:
                    best = pos
    return best


def _any_near(low, phrases, dirs, dist=22):
    """Salah satu frasa + salah satu kata arah dalam jarak dekat. Return pos dir."""
    for ph in phrases:
        for d in dirs:
            pos = _near(low, ph, d, dist)
            if pos is not None:
                return pos
    return None


def _ev(label, weight, direction, scope, pairs=None, words=None, dist=26):
    """Buat rule event. `pairs` = dua frasa dekat; `words` = kata tunggal."""
    def match(low):
        if pairs:
            for a, b in pairs:
                pos = _near(low, a, b, dist)
                if pos is not None:
                    return pos
        if words:
            for w in words:
                m = re.search(r"\b" + re.escape(w) + r"\b", low)
                if m:
                    return m.start()
        return None
    return (label, weight, direction, scope, match)


UP_DIRS = [
    "naik", "tumbuh", "meningkat", "melompat", "melonjak", "meroket", "menguat", "rekor", "berlipat",
    "rise", "rises", "gain", "gains", "jump", "jumps", "surge", "surges", "climb", "climbs",
    "beat", "beats", "stronger", "higher", "up",
]
DOWN_DIRS = [
    "turun", "anjlok", "menurun", "merosot", "jeblok", "melemah", "tertekan", "koreksi",
    "fall", "falls", "drop", "drops", "plunge", "plunges", "decline", "declines", "slump",
    "slumps", "miss", "misses", "weaker", "lower", "down",
]
RATE_CUT = [
    "turun", "dipotong", "pangkas", "menurunkan", "cut", "terendah", "longgarkan", "dilonggarkan",
    "cuts", "cutting", "lower", "lowering", "reduce", "reduces", "reduction", "dovish", "easing",
]
RATE_HIKE = [
    "naik", "dinaikkan", "kenaikan", "menaikkan", "hawkish", "ketat", "dinaikkan lagi",
    "hike", "hikes", "hiking", "raise", "raises", "raising", "higher", "tightening", "restrictive",
]

EVENT_RULES = [
    # ── Kinerja keuangan ──
    _ev("kinerja keuangan", 0.72, 1, "emiten",
        pairs=[("laba bersih", d) for d in UP_DIRS] + [("laba", "cetak rekor")] +
              [("earnings", d) for d in UP_DIRS] + [("revenue", d) for d in UP_DIRS] +
              [("profit", d) for d in UP_DIRS]),
    _ev("kinerja keuangan", 0.6, 1, "emiten",
        pairs=[("laba", d) for d in ["naik", "tumbuh", "meningkat", "melonjak", "membaik", "rekor", "positif"]] +
              [("beat", "estimates"), ("beat", "expectations"), ("above", "estimates")]),
    _ev("kinerja keuangan", 0.7, -1, "emiten",
        pairs=[("laba", d) for d in DOWN_DIRS] + [("earnings", d) for d in DOWN_DIRS] +
              [("revenue", d) for d in DOWN_DIRS] + [("profit", d) for d in DOWN_DIRS]),
    _ev("kinerja keuangan", 0.65, -1, "emiten",
        words=["merugi", "mengalami kerugian", "mencatat rugi", "rugi bersih",
               "net loss", "loss", "losses", "writedown", "impairment"]),
    _ev("kinerja keuangan", 0.55, -1, "emiten",
        pairs=[("rugi", d) for d in ["naik", "melebar", "melonjak", "membengkak"]] +
              [("miss", "estimates"), ("miss", "expectations"), ("below", "estimates")]),
    # ── Dividen ──
    _ev("pembagian dividen", 0.5, 1, "emiten",
        pairs=[("pembagian", "dividen"), ("bagikan", "dividen"), ("membagikan", "dividen"),
               ("umumkan", "dividen"), ("cair", "dividen"), ("dividen", "interim"), ("dividen", "final"),
               ("dividend", "increase"), ("dividend", "raise"), ("special", "dividend")] +
              [("dividen", d) for d in ["naik", "tumbuh", "meningkat", "lebih tinggi"]]),
    _ev("dividen", 0.45, -1, "emiten",
        pairs=[("dividen", "turun"), ("dividen", "dipotong"), ("cut", "dividen"),
               ("dividend", "cut"), ("dividend", "suspend")]),
    # ── Aksi korporasi ──
    _ev("akuisisi & ekspansi", 0.5, 1, "emiten",
        words=["akuisisi", "mengakuisisi", "pengambilalihan", "ambil alih", "ekspansi", "perluasan bisnis",
               "acquisition", "acquire", "acquires", "merger talks", "expansion", "takeover"]),
    _ev("merger", 0.5, 1, "emiten", words=["merger", "penggabungan usaha", "merger", "consolidation"]),
    _ev("aksi korporasi", 0.4, 0, "emiten",
        words=["right issue", "rights issue", "hmetd", "restrukturisasi", "restructuring",
               "spinoff", "spin-off", "buyback", "share repurchase"]),
    _ev("buyback", 0.5, 1, "emiten", words=["buyback", "pembelian kembali saham", "share repurchase"]),
    _ev("kontrak & proyek", 0.5, 1, "emiten",
        pairs=[("menangkan", "kontrak"), ("menangkan", "tender"), ("menangkan", "proyek"),
               ("peroleh", "kontrak"), ("peroleh", "proyek"), ("dapat", "kontrak"),
               ("wins", "contract"), ("awarded", "contract"), ("signs", "deal")]),
    _ev("IPO / listing", 0.5, 1, "emiten",
        words=["ipo", "initial public offering", "direct listing"],
        pairs=[("mencatatkan", "saham"), ("goes public", "stock")]),
    # ── Kebijakan moneter & makro AS ──
    _ev("kebijakan moneter", 0.72, 1, "pasar",
        pairs=[("suku bunga", d) for d in RATE_CUT] + [("bi rate", d) for d in RATE_CUT] +
              [("fed", d) for d in RATE_CUT] + [("interest rate", d) for d in RATE_CUT] +
              [("federal reserve", d) for d in RATE_CUT],
        words=["the fed memangkas", "fed cut", "pemangkasan suku bunga", "rate cut", "rate cuts",
               "dovish fed", "fed pivot", "quantitative easing", "qe"]),
    _ev("kebijakan moneter", 0.72, -1, "pasar",
        pairs=[("suku bunga", d) for d in RATE_HIKE] + [("bi rate", d) for d in RATE_HIKE] +
              [("fed", d) for d in RATE_HIKE] + [("interest rate", d) for d in RATE_HIKE] +
              [("federal reserve", d) for d in RATE_HIKE],
        words=["kenaikan suku bunga acuan", "rate hike", "rate hikes", "hawkish fed",
               "quantitative tightening", "qt"]),
    _ev("inflasi", 0.5, 1, "pasar",
        pairs=[("inflasi", d) for d in ["turun", "melandai", "terkendali", "reda", "rendah"]] +
              [("inflation", d) for d in ["cools", "cools down", "eases", "slows", "falls", "drops", "lower"]] +
              [("cpi", d) for d in ["cools", "eases", "slows", "falls", "drops", "lower"]]),
    _ev("inflasi", 0.55, -1, "pasar",
        pairs=[("inflasi", d) for d in ["naik", "melonjak", "meningkat", "tinggi"]] +
              [("inflation", d) for d in ["rises", "jumps", "surges", "accelerates", "hot", "higher"]] +
              [("cpi", d) for d in ["rises", "jumps", "surges", "accelerates", "hot", "higher"]]),
    _ev("nilai tukar", 0.45, -1, "pasar",
        pairs=[("rupiah", d) for d in ["melemah", "depresiasi", "jatuh", "tertekan", "merosot"]] +
              [("dollar", d) for d in ["strengthens", "surges", "rises", "stronger"]] +
              [("nilai tukar", "melemah")]),
    _ev("nilai tukar", 0.45, 1, "pasar",
        pairs=[("rupiah", d) for d in ["menguat", "apresiasi", "perkasa"]] +
              [("dollar", d) for d in ["weakens", "falls", "drops", "weaker"]] +
              [("nilai tukar", "menguat")]),
    # ── Data ekonomi AS ──
    _ev("data ekonomi", 0.45, 1, "pasar",
        pairs=[("jobs", d) for d in ["beat", "beats", "strong", "rises", "surges"]] +
              [("payroll", d) for d in ["beat", "beats", "strong", "rises", "surges"]] +
              [("gdp", d) for d in ["beat", "beats", "strong", "grows", "growth"]] +
              [("retail sales", d) for d in ["beat", "beats", "rise", "rises", "strong"]]),
    _ev("data ekonomi", 0.45, -1, "pasar",
        pairs=[("jobs", d) for d in ["miss", "misses", "weak", "falls", "slump"]] +
              [("payroll", d) for d in ["miss", "misses", "weak", "falls", "slump"]] +
              [("gdp", d) for d in ["miss", "misses", "weak", "contracts", "shrinks"]] +
              [("retail sales", d) for d in ["miss", "misses", "fall", "falls", "weak"]]),
    _ev("kebijakan fiskal", 0.3, 0, "pasar",
        words=["anggaran", "pajak", "bea cukai", "penerimaan negara", "apbn", "subsidi", "belanja negara",
               "fiscal", "budget", "tax", "spending", "stimulus", "debt ceiling"]),
    _ev("kebijakan perdagangan", 0.4, 0, "pasar",
        words=["tarif impor", "larangan ekspor", "kuota impor", "perdagangan bilateral", "ekspor",
               "tariff", "tariffs", "trade war", "export ban", "import quota", "trade deal", "sanctions"]),
    _ev("sentimen pasar", 0.5, 1, "pasar",
        pairs=[("ihsg", d) for d in ["menguat", "naik", "rebound", "rally", "melompat", "hijau"]] +
              [("s&p", d) for d in ["rises", "gains", "rally", "surges", "record"]] +
              [("nasdaq", d) for d in ["rises", "gains", "rally", "surges", "record"]] +
              [("dow", d) for d in ["rises", "gains", "rally", "surges", "record"]] +
              [("bitcoin", d) for d in ["rises", "gains", "rally", "surges", "record", "soars"]] +
              [("stocks", d) for d in ["rise", "rally", "gain", "surge", "climb"]] +
              [("pasar saham", "menguat"), ("bursa", "menguat")]),
    _ev("sentimen pasar", 0.5, -1, "pasar",
        pairs=[("ihsg", d) for d in ["melemah", "turun", "tertekan", "koreksi", "anjlok", "merah"]] +
              [("s&p", d) for d in ["falls", "drops", "slumps", "plunges", "selloff"]] +
              [("nasdaq", d) for d in ["falls", "drops", "slumps", "plunges", "selloff"]] +
              [("dow", d) for d in ["falls", "drops", "slumps", "plunges", "selloff"]] +
              [("bitcoin", d) for d in ["falls", "drops", "slumps", "plunges", "crashes"]] +
              [("stocks", d) for d in ["fall", "drop", "slump", "plunge", "selloff"]] +
              [("pasar saham", "melemah"), ("bursa", "tertekan")]),
    # ── Kripto spesifik ──
    _ev("ETF & adopsi institusi", 0.7, 1, "pasar",
        pairs=[("etf", d) for d in ["approve", "approves", "approved", "approval", "launch", "inflow", "inflows"]] +
              [("institutional", d) for d in ["adoption", "inflow", "buying"]] +
              [("bitcoin", "etf"), ("ethereum", "etf")],
        words=["spot bitcoin etf", "spot ethereum etf", "crypto etf"]),
    _ev("regulasi kripto", 0.55, -1, "pasar",
        words=["crypto ban", "crackdown", "sec lawsuit", "sec charges", "regulatory action",
               "exchange hack", "hacked", "exploit", "stolen funds", "insolvency", "bankruptcy"]),
    _ev("regulasi kripto", 0.5, 1, "pasar",
        words=["crypto regulation clarity", "regulatory clarity", "crypto framework",
               "stablecoin bill", "market structure bill", "crypto adoption"]),
    # ── Geopolitik ──
    _ev("geopolitik", 0.6, -1, "pasar",
        words=["war", "invasion", "military strike", "airstrike", "missile", "conflict escalation",
               "sanctions", "embargo", "blockade", "coup", "terror attack", "geopolitical tension"]),
    _ev("geopolitik", 0.5, 1, "pasar",
        words=["ceasefire", "peace deal", "truce", "de-escalation", "diplomatic breakthrough",
               "trade agreement", "sanctions lifted"]),
    _ev("risiko energi", 0.55, -1, "pasar",
        pairs=[("oil", d) for d in ["surges", "jumps", "spikes", "rises", "soars"]] +
              [("crude", d) for d in ["surges", "jumps", "spikes", "rises", "soars"]] +
              [("opec", d) for d in ["cuts production", "supply cut"]]),
    # ── Risiko emiten ──
    _ev("PHK / operasional", 0.6, -1, "emiten",
        words=["phk", "pemutusan hubungan kerja", "dirumahkan", "layoffs", "layoff", "job cuts"]),
    _ev("risiko hukum", 0.65, -1, "emiten",
        words=["sanksi", "denda", "tuntutan", "penyidikan", "korupsi", "gratifikasi", "delisting",
               "lawsuit", "investigation", "fine", "penalty", "sec charges", "antitrust"]),
    _ev("kegagalan usaha", 0.85, -1, "emiten",
        words=["gagal bayar", "pailit", "bangkrut", "insolvensi", "penundaan kewajiban",
               "bankruptcy", "default", "insolvency", "chapter 11"]),
    _ev("risiko operasional", 0.6, -1, "emiten",
        words=["kebakaran", "kecelakaan", "bencana", "kerusuhan", "unjuk rasa",
               "outage", "recall", "cyberattack", "data breach"]),
]


# Komoditas: frasa + kata arah dalam jarak dekat (diproses khusus)
COMMODITY_PHRASES = [
    "harga minyak", "harga batu bara", "harga nikel", "harga emas", "harga tembaga",
    "harga timah", "harga sawit", "harga cpco", "harga gas",
    "oil price", "gold price", "copper price", "natural gas", "crude oil", "brent",
]
COMMODITY_UP = ["naik", "melonjak", "menguat", "menanjak", "melompat",
                "rise", "rises", "surge", "surges", "jump", "jumps", "soar", "soars", "climb"]
COMMODITY_DOWN = ["turun", "anjlok", "melemah", "merosot", "tertekan",
                  "fall", "falls", "drop", "drops", "plunge", "plunges", "slump", "slumps"]


def _match_events(low):
    """Cocokkan semua rule event, terapkan flip negasi → list (label,bobot,arah,scope)."""
    matched = []
    for label, weight, direction, scope, fn in EVENT_RULES:
        pos = fn(low)
        if pos is None:
            continue
        if direction != 0 and _negated_before(low, pos):
            direction = -direction
            if label == "pembagian dividen" and direction == -1:
                label = "pemangkasan dividen"
        matched.append((label, weight, direction, scope))

    # komoditas (frasa & arah berjarak lebih bebas)
    up = _any_near(low, COMMODITY_PHRASES, COMMODITY_UP)
    down = _any_near(low, COMMODITY_PHRASES, COMMODITY_DOWN)
    if up is not None or down is not None:
        if up is not None and down is None:
            matched.append(("komoditas", 0.5, 1, "sektor"))
        elif down is not None and up is None:
            matched.append(("komoditas", 0.5, -1, "sektor"))
        else:
            matched.append(("komoditas", 0.5, 0, "sektor"))
    return matched


def _negated_before(low, pos, dist=14):
    window = low[max(0, pos - dist):pos + 8]
    return any(re.search(r"\b" + re.escape(n) + r"\b", window) for n in NEGATIONS)


def _relevant(title):
    low = (title or "").lower()
    return any(k in low for k in RELEVANCE_KEYS)


def _fetch(url, timeout=18):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()


def _parse_dt(value):
    try:
        dt = parsedate_to_datetime(value)
        return dt.astimezone().isoformat()
    except Exception:
        return None


def _img_from_desc(text):
    match = re.search(r'<img[^>]+src="([^"]+)"', text or "")
    if match:
        return match.group(1).replace("&amp;", "&")
    return None


def _parse_feed(url):
    """Baca satu RSS → daftar item mentah. Kembali [] jika gagal / bukan XML."""
    try:
        xml = _fetch(url)
        root = ElementTree.fromstring(xml)
    except Exception:
        return []
    out = []
    for it in root.findall(".//item"):
        title = (it.findtext("title") or "").strip()
        if not title:
            continue
        link = (it.findtext("link") or "").strip()
        desc = it.findtext("description") or ""
        pub_date = _parse_dt(it.findtext("pubDate") or "")
        enclosure = it.find("enclosure")
        image = (enclosure.attrib.get("url") if enclosure is not None else None) or _img_from_desc(desc)
        out.append({
            "title": title,
            "link": link,
            "image": image,
            "published": pub_date,
            "description": re.sub(r"<[^>]+>", " ", desc)[:400],
        })
    return out


def detect_tickers(text):
    """Temukan ticker & nama aset yang disebut dalam text (saham AS + kripto).

    Strategi: cocokkan kode di dalam whitelist universe baru (NEW_ASSETS)
    untuk menghindari false positive seperti ETF/SEC/FED.
    """
    low = (text or "").lower()
    found = set()
    # 1) kode dengan konteks eksplisit: $AAPL atau "saham AAPL"
    for m in TICKER_RE.finditer(text or ""):
        code = (m.group(1) or m.group(2) or "").upper()
        if len(code) >= 2 and code in NEW_ASSETS:
            found.add(code)
    # 2) kata uppercase 2-5 huruf yang memang aset terdaftar
    for m in UPPER_WORD_RE.finditer(text or ""):
        code = m.group(0)
        if code in NEW_ASSETS:
            found.add(code)
    # 3) nama perusahaan / alias (word boundary)
    for alias, code in COMPANY_NAMES.items():
        if re.search(r"\b" + re.escape(alias) + r"\b", low) and code in NEW_ASSETS:
            found.add(code)
    return sorted(found)


def _negated(tokens, i):
    """True jika token ke-i didahului kata negasi dalam 2 token terakhir."""
    for j in range(max(0, i - 2), i):
        if tokens[j] in NEGATIONS:
            return True
    return False


def analyze_sentiment(text):
    """Skor sentimen -1..1 beserta label, dengan negasi + bobot kata kuat."""
    low = (text or "").lower()
    tokens = [m.group(0) for m in WORD_RE.finditer(low)]
    pos = 0.0
    neg = 0.0
    for i, w in enumerate(tokens):
        if w in STRONG_POSITIVE:
            weight, direction = 2.0, 1
        elif w in POSITIVE:
            weight, direction = 1.0, 1
        elif w in STRONG_NEGATIVE:
            weight, direction = 2.0, -1
        elif w in NEGATIVE:
            weight, direction = 1.0, -1
        else:
            continue
        if _negated(tokens, i):
            direction = -direction
        if direction > 0:
            pos += weight
        else:
            neg += weight
    total = pos + neg
    if total == 0:
        return 0.0, "netral"
    # kurangi ekstrem bila bukti minim (satu kata saja tidak boleh langsung 100%)
    confidence = min(1.0, total / 3.0)
    score = ((pos - neg) / total) * confidence
    if score >= 0.12:
        return round(score, 2), "positif"
    if score <= -0.12:
        return round(score, 2), "negatif"
    return round(score, 2), "netral"


def _resolve_scope(ticks, event_scope):
    """Tentukan scope dampak: aset / sektor / pasar."""
    sectors = set()
    kinds = set()
    for t in ticks:
        meta = NEW_ASSETS.get(t) or {}
        if meta.get("sector"):
            sectors.add(meta["sector"])
        if meta.get("kind"):
            kinds.add(meta["kind"])
    if event_scope:
        scope = event_scope
    elif ticks:
        scope = "emiten"
    else:
        scope = "umum"
    # widening: banyak aset/sektor → dampak melebar ke pasar/sektor
    if ticks and scope in ("emiten", "umum"):
        if len(ticks) >= 3 or len(sectors) >= 3:
            scope = "pasar"
        elif len(sectors) == 1 and len(ticks) >= 2:
            scope = "sektor"
        elif len(ticks) >= 2 and len(sectors) >= 2:
            scope = "sektor"
    return scope, sectors


def _scope_target(scope, sectors, ticks=None):
    kinds = {(NEW_ASSETS.get(t) or {}).get("kind") for t in (ticks or [])}
    if scope == "pasar":
        if kinds == {"crypto"}:
            return "pasar kripto secara keseluruhan"
        if kinds == {"us_stock"}:
            return "pasar saham AS (S&P 500 / Nasdaq)"
        return "pasar global (saham AS & kripto)"
    if scope == "sektor":
        if not sectors:
            return "sektor terkait"
        return f"sektor {', '.join(sorted(sectors))}"
    return "harga aset terkait"


def _scope_label(scope):
    return {"emiten": "ASET", "sektor": "SEKTOR", "pasar": "PASAR", "umum": "UMUM"}.get(scope, "UMUM")


def _event_text(events):
    if not events:
        return None
    elabel, weight, direction, scope = max(events, key=lambda e: (e[1], abs(e[2])))
    return elabel


def analyze_news(item):
    """Tambahkan analisa sentimen, event, emiten terkait, dan dampak ke satu berita."""
    body = f"{item.get('title', '')} {item.get('description', '')}"
    low = body.lower()
    score, label = analyze_sentiment(body)
    ticks = detect_tickers(body)

    events = _match_events(low)
    event_label = _event_text(events)
    event_scope = None
    if events:
        el, w, d, s = max(events, key=lambda e: (e[1], abs(e[2])))
        event_scope = s if (d != 0 or not ticks) else None

    # gabungkan sentimen + event (event lebih otoritatif arahnya)
    impact = score
    if events:
        elabel, w, d, scope = max(events, key=lambda e: (e[1], abs(e[2])))
        if d != 0:
            impact = impact * 0.4 + d * w * 0.6
        else:
            impact = impact * 0.9

    # scope dampak
    scope, sectors = _resolve_scope(ticks, event_scope)

    # widening: makin banyak emiten/sektor terdampak, dorongan sedikit lebih besar
    if ticks:
        boost = 0.08 if scope == "pasar" else 0.05 if scope == "sektor" else 0.02
        impact += boost if impact >= 0 else -boost
    impact = max(-1.0, min(1.0, impact))

    # klasifikasi
    if impact >= 0.45:
        direction, strength = "positif", "kuat"
    elif impact >= 0.15:
        direction, strength = "positif", "moderat"
    elif impact <= -0.45:
        direction, strength = "negatif", "kuat"
    elif impact <= -0.15:
        direction, strength = "negatif", "moderat"
    else:
        direction, strength = "netral", "terbatas"

    target = _scope_target(scope, sectors, ticks)
    if direction == "positif":
        ihsg_view = f"berpotensi menguatkan {target}"
    elif direction == "negatif":
        ihsg_view = f"berpotensi menekan {target}"
    else:
        ihsg_view = "netral, dampak selektif tergantung reaksi pasar"

    if event_label:
        evt_phrase = f"Berita seputar {event_label}"
    else:
        evt_phrase = "Berita ini"
    if direction == "positif":
        move = (
            f"{evt_phrase} membawa sentimen positif. {target.capitalize()} "
            "berpeluang bergerak naik, terutama bila didukung volume transaksi."
        )
    elif direction == "negatif":
        move = (
            f"{evt_phrase} membawa sentimen negatif. {target.capitalize()} "
            "berisiko tertekan hingga pasar mencerna kabar ini."
        )
    else:
        move = (
            f"{evt_phrase} belum menunjukkan arah yang jelas. Dampak "
            f"bergantung pada reaksi pasar dan rilis data lanjutan — pantau {target}."
        )

    related = []
    for t in ticks:
        related.append({
            "ticker": t,
            "direction": direction,
            "note": f"Sentimen {direction} pada berita ini",
        })

    return {
        **item,
        "sentiment": label,
        "sentiment_score": score,
        "related": related,
        "impact": {
            "ihsg": ihsg_view,
            "asset": ihsg_view,
            "market_move": move,
            "strength": round(abs(impact) * 100),
            "direction": direction,
            "scope": scope,
            "scope_label": _scope_label(scope),
            "event": event_label,
            "label": strength,
        },
    }


def _resolve_category(category):
    """Normalisasi kategori: dukung alias lama + kategori 'all'."""
    cat = (category or "us").lower()
    cat = CATEGORY_ALIAS.get(cat, cat)
    if cat == "all":
        return "all"
    return cat if cat in FEEDS else "us"


def fetch_news(category="us", limit=30):
    """Gabungkan beberapa feed secara paralel, urut berdasarkan waktu."""
    cat = _resolve_category(category)
    if cat == "all":
        urls = []
        for feeds in FEEDS.values():
            urls.extend(feeds[:2])
    else:
        urls = FEEDS[cat][:MAX_FEEDS]

    import concurrent.futures as cf
    merged = []
    with cf.ThreadPoolExecutor(max_workers=max(1, len(urls))) as ex:
        for items in ex.map(_parse_feed, urls):
            merged.extend(items)

    # Filter relevansi: berita non-market (resep, tips umum) dikeluarkan
    filtered = [it for it in merged if _relevant(it["title"])]

    # dedup berdasarkan judul (case-insensitive)
    seen = set()
    unique = []
    for it in filtered:
        key = it["title"].lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(it)

    # urutkan: berita dengan tanggal lebih baru didahulukan
    def _sort_key(it):
        dt = it.get("published")
        try:
            return datetime.fromisoformat(dt.replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0

    unique.sort(key=_sort_key, reverse=True)
    return [analyze_news(it) for it in unique[:limit]]