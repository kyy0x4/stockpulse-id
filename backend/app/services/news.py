"""Fetch berita pasar saham Indonesia dari banyak RSS + analisa dampak."""

import re
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

from app.data.tickers import FULL_EMITEN

# Banyak sumber RSS gratis → jumlah berita jauh lebih banyak dari satu sumber.
# Setiap kategori punya beberapa feed. "market" = pasar saham, "ekbis" = ekonomi bisnis umum.
FEEDS = {
    "market": [
        "https://www.cnbcindonesia.com/market/rss",
        "https://www.antaranews.com/rss/terkini",
        "https://katadata.co.id/rss",
    ],
    "ekbis": [
        "https://www.cnbcindonesia.com/market/rss",
        "https://www.antaranews.com/rss/terkini",
        "https://www.antaranews.com/rss/ekonomi",
        "https://katadata.co.id/rss",
    ],
}

UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36 PlotFinansialID"
}

# Mapping nama perusahaan → ticker (untuk mendeteksi saham yang disebut di berita)
COMPANY_NAMES = {
    "bca": "BBCA", "bank central asia": "BBCA",
    "bri": "BBRI", "bank rakyat indonesia": "BBRI",
    "mandiri": "BMRI", "bank mandiri": "BMRI",
    "bni": "BBNI", "bank negara indonesia": "BBNI",
    "bank syariah": "BRIS", "bank syariah indonesia": "BRIS",
    "telkom": "TLKM", "telkomsel": "TLKM",
    "indosat": "ISAT", "indosat ooredoo": "ISAT",
    "xl axiata": "EXCL", "xl": "EXCL",
    "astra": "ASII", "astra international": "ASII",
    "adaro": "ADRO",
    "bukit asam": "PTBA",
    "antam": "ANTM", "ancam": "ANTM",
    "vale": "INCO",
    "merdeka copper": "MDKA", "merdeka copper gold": "MDKA",
    "timah": "TINS",
    "harum energy": "HRUM",
    "medco": "MEDC",
    "perusahaan gas": "PGAS",
    "indofood": "INDF", "indofood cbp": "ICBP",
    "unilever": "UNVR",
    "mayora": "MYOR",
    "charoen": "CPIN", "charoen pokphand": "CPIN",
    "cleo": "CLEO",
    "ultrajaya": "ULTJ",
    "kalbe": "KLBF",
    "sido muncul": "SIDO", "sido": "SIDO",
    "hermina": "HEAL",
    "gojek": "GOTO", "tokopedia": "GOTO", "go to gojek": "GOTO",
    "bayang resources": "BYAN", "bayan": "BYAN",
    "bumi resources": "BUMI", "bumi": "BUMI",
    "barito pacific": "BRPT", "barito": "BRPT",
    "semen indonesia": "SMGR", "semen gresik": "SMGR",
    "indocement": "INTP",
    "wijaya karya": "WIKA",
    "pembangunan perumahan": "PTPP",
    "jasamarga": "JSMR", "jasa marga": "JSMR",
    "sarwana": "TOWR", "towr": "TOWR",
    "mitratel": "MTEL",
    "ace hardware": "ACES", "ace": "ACES",
    "map": "MAPI", "mitra adiperkasa": "MAPI", "map boga": "MAPI",
    "erajaya": "ERAA",
    "amman mineral": "AMMN", "amman": "AMMN",
    "arto": "ARTO",
    "barito renewables": "BREN",
    "gede": "GOOD",
    "gudang garam": "GGRM",
    "hm sampoerna": "HMSP", "sampoerna": "HMSP",
    "bintang": "MLBI", "multibintang": "MLBI",
    "adhi karya": "ADHI",
    "bjb": "BJBR", "bank jabar": "BJBR",
    "bank banten": "BJTM", "bank jatim": "BJTM",
    "maybank": "MAYA",
    "agro": "AGRO", "bank agro": "AGRO",
    "nisp": "NISP", "bank ocbc": "NISP",
    "semen batu": "SMCB", "holcim": "SMCB",
    "semen merah": "SMMA",
    "tiga pilar": "TPIA", "chandra asri": "TPIA",
    "bsd": "BSDE", "sinar mas land": "BSDE",
    "ciputra": "CTRA",
    "pakuwon": "PWON",
    "maspion": "SMRA", "summarecon": "SMRA",
    "pan openside": "PANI", "parkan": "PANI",
    "miko": "MKPI", "metropolitan kentjana": "MKPI",
    "surya es": "ELSA", "elsa": "ELSA",
    "akr": "AKRA", "akr corporindo": "AKRA",
    "dssa": "DSSA", "dian swastatika": "DSSA",
}

# Leksikon sentimen (Bahasa Indonesia / istilah pasar)
POSITIVE = [
    "naik", "tumbuh", "tumbuhnya", "untung", "profit", "rekor", "menguat", "penguatan",
    "melonjak", "membaik", "cuan", "bonus", "dividen", "akuisisi", "ekspansi", "optimis",
    "optimisme", "harapan", "lonjakan", "kenaikan", "surplus", "laba", "positif", "dukung",
    "meningkat", "meningkatkan", "pendapatan", "cetak", "all-time", "rally", "bullish",
    "berhasil", "kuat", "subsidi", "insentif", "percepatan", "menanjak", "mendongkrak",
]
NEGATIVE = [
    "turun", "rugi", "anjlok", "pelemahan", "melemah", "gagal", "penurunan", "merosot",
    "krisis", "resesi", "kerugian", "sanksi", "phk", "drop", "minus", "tekanan", "jual",
    "bearish", "kekhawatiran", "perang", "tarif", "protes", "mogok", "jiplak", "korupsi",
    "pemecatan", "defisit", "utang", "tunggakan", "pailit", "bangkrut", "turunnya",
    "menurunkan", "tertekan", "tobat", "terpuruk", "koreksi", "penjualan", "harga minyak turun",
]

TICKER_RE = re.compile(r"\$([A-Z]{2,4})\b|saham\s+([A-Z]{2,4})\b", re.IGNORECASE)
UPPER_WORD_RE = re.compile(r"\b[A-Z]{2,4}\b")

# Berapa banyak feed per kategori yang ditelusuri paralel
MAX_FEEDS = 4

# Kata kunci relevansi pasar/bisnis — feed umum (Antara/terkini) difilter
RELEVANCE_KEYS = [
    "saham", "ihsg", "bursa", "emiten", "rupiah", "bank sentral", "bank", "laba",
    "untung", "ekonomi", "bisnis", "investasi", "obligasi", "sukuk", "dividen",
    "nilai tukar", "inflasi", "suku bunga", "pasar modal", "ipo", "trading",
    "reksa dana", "ekspor", "impor", "pajak", "anggaran", "perusahaan",
    "korporasi", "manufaktur", "tambang", "minyak", "batu bara", "energi",
    "sektoral", "telekomunikasi", "teknologi", "digital", "e-commerce",
    "fintech", "aplikasi", "ritel", "ekspansi", "akuisisi", "kontrak",
    "pengangguran", "tenaga kerja", "upah", "bumn", "kementerian",
    "pemerintah", "fiskal", "moneter", "dolar", "emas", "komoditas",
    "msci", "wall street", "nasdaq", "giias", "kendaraan listrik", "ev",
    "smelter", "nikel", "timah", "sawit", "cpco", "steel", "baja",
]


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
    """Temukan ticker & nama perusahaan yang disebut dalam text.

    Strategi: cocokkan kode di dalam whitelist emiten asli IDX (FULL_EMITEN)
    untuk menghindari false positive seperti IHSG/MSCI/BANK.
    """
    low = (text or "").lower()
    found = set()
    # 1) kode dengan konteks eksplisit: $BBCA atau "saham BBCA"
    for m in TICKER_RE.finditer(text or ""):
        code = (m.group(1) or m.group(2) or "").upper()
        if len(code) >= 2 and code in FULL_EMITEN:
            found.add(code)
    # 2) kata uppercase 2-4 huruf yang memang emiten terdaftar
    for m in UPPER_WORD_RE.finditer(text or ""):
        code = m.group(0)
        if code in FULL_EMITEN:
            found.add(code)
    # 3) nama perusahaan / alias
    for alias, code in COMPANY_NAMES.items():
        if alias in low and code in FULL_EMITEN:
            found.add(code)
    return sorted(found)


def analyze_sentiment(text):
    """Skor sentimen -1..1 beserta label."""
    low = (text or "").lower()
    pos = sum(1 for w in POSITIVE if w in low)
    neg = sum(1 for w in NEGATIVE if w in low)
    total = pos + neg
    if total == 0:
        return 0.0, "netral"
    score = (pos - neg) / total
    if score >= 0.15:
        return round(score, 2), "positif"
    if score <= -0.15:
        return round(score, 2), "negatif"
    return round(score, 2), "netral"


def analyze_news(item):
    """Tambahkan analisa sentimen + emiten terkait ke satu item berita."""
    body = f"{item.get('title', '')} {item.get('description', '')}"
    score, label = analyze_sentiment(body)
    ticks = detect_tickers(body)
    return {
        **item,
        "sentiment": label,
        "sentiment_score": score,
        "related": [{"ticker": t} for t in ticks],
    }


def fetch_news(category="market", limit=30):
    """Gabungkan beberapa feed secara paralel, urut berdasarkan waktu."""
    urls = FEEDS.get(category, FEEDS["market"])[:MAX_FEEDS]

    import concurrent.futures as cf
    merged = []
    with cf.ThreadPoolExecutor(max_workers=len(urls)) as ex:
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