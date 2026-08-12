"""Fetch berita pasar saham Indonesia dari RSS CNBC Indonesia + analisa dampak."""

import re
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

FEEDS = {
    "market": "https://www.cnbcindonesia.com/market/rss",
    "ekbis": "https://www.cnbcindonesia.com/ekbis/rss",
}

UA = {"User-Agent": "Mozilla/5.0 (StockPulse ID; +https://stockpulse-id.vercel.app)"}

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

TICKER_RE = re.compile(r"\$([A-Z]{2,4})\b|saham\s+([A-Z]{2,4})\b")


def _fetch(url, timeout=15):
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


def detect_tickers(text):
    """Temukan ticker & nama perusahaan yang disebut dalam text."""
    low = (text or "").lower()
    found = set()
    for m in TICKER_RE.finditer(text or ""):
        code = (m.group(1) or m.group(2) or "").upper()
        if len(code) >= 2:
            found.add(code)
    for alias, code in COMPANY_NAMES.items():
        if alias in low:
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
    body = f"{item.get('title', '')} {item.get('description', '')} {item.get('summary', '')}"
    score, label = analyze_sentiment(body)
    ticks = detect_tickers(item.get("title", ""))
    return {
        **item,
        "sentiment": label,
        "sentiment_score": score,
        "related": [{"ticker": t} for t in ticks],
    }


def fetch_news(category="market", limit=20):
    url = FEEDS.get(category, FEEDS["market"])
    xml = _fetch(url)
    root = ElementTree.fromstring(xml)
    items = root.findall(".//item")

    out = []
    for it in items[:limit]:
        title = it.findtext("title") or ""
        link = it.findtext("link") or ""
        desc = it.findtext("description") or ""
        pub_date = _parse_dt(it.findtext("pubDate") or "")
        enclosure = it.find("enclosure")
        image = (enclosure.attrib.get("url") if enclosure is not None else None) or _img_from_desc(desc)
        out.append(analyze_news({
            "title": title.strip(),
            "link": link,
            "image": image,
            "published": pub_date,
            "description": desc,
        }))
    return out