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
    "bsi": "BRIS", "bank syariah": "BRIS", "bank syariah indonesia": "BRIS",
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
    "mayora": "MYOR", "mayora indah": "MYOR",
    "charoen": "CPIN", "charoen pokphand": "CPIN",
    "cleo": "CLEO",
    "ultrajaya": "ULTJ",
    "kalbe": "KLBF", "kalbe farma": "KLBF",
    "sido muncul": "SIDO", "sido": "SIDO",
    "hermina": "HEAL",
    "gojek": "GOTO", "tokopedia": "GOTO", "go to gojek": "GOTO",
    "bayang resources": "BYAN", "bayan": "BYAN",
    "bumi resources": "BUMI", "bumi": "BUMI",
    "barito pacific": "BRPT", "barito": "BRPT",
    "semen indonesia": "SMGR", "semen gresik": "SMGR",
    "indocement": "INTP",
    "wijaya karya": "WIKA",
    "pembangunan perumahan": "PTPP", "pp persero": "PTPP",
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
    "garuda": "GIAA", "garuda indonesia": "GIAA",
    "smartfren": "FREN",
    "japfa": "JPFA",
    "ramayana": "RALS",
    "metland": "MTLA",
    "indika": "INDY",
    "esam": "ESSA", "essa": "ESSA",
    "ancora": "ACRO",
    "merk": "MERK",
}

# ── Sentimen: kata lemah/kuat + negasi ─────────────────────
STRONG_POSITIVE = [
    "melompat", "melonjak", "meroket", "cetak rekor", "all-time", "rally", "bullish",
    "rekor", "berlipat", "surplus", "menguat", "penguatan", "lonjakan", "cuan",
]
POSITIVE = [
    "naik", "tumbuh", "tumbuhnya", "untung", "profit", "membaik", "bonus",
    "akuisisi", "ekspansi", "optimis", "optimisme", "harapan", "kenaikan", "laba",
    "positif", "dukung", "meningkat", "meningkatkan", "pendapatan", "berhasil", "kuat",
    "subsidi", "insentif", "percepatan", "menanjak", "mendongkrak", "keuntungan",
    "menang", "tender", "kontrak", "pembagian", "cairkan", "buyback", "perkuat",
    "perbaikan", "menguatkan", "mendorong", "rebound", "apresiasi", "perkasa",
    "impresif", "moncer", "subur", "gemilang", "meninggi",
]
STRONG_NEGATIVE = [
    "anjlok", "jeblok", "merosot", "terpuruk", "pailit", "bangkrut", "resesi", "krisis",
    "gagal bayar", "delisting", "korupsi", "perang", "tobat", "collapse",
]
NEGATIVE = [
    "turun", "rugi", "pelemahan", "melemah", "gagal", "penurunan", "kerugian", "sanksi",
    "phk", "drop", "minus", "tekanan", "jual", "bearish", "kekhawatiran", "tarif",
    "protes", "mogok", "pemecatan", "defisit", "utang", "tunggakan", "tertekan",
    "koreksi", "penjualan", "merugi", "mengalami kerugian", "menurunkan", "terancam",
    "penyidikan", "denda", "tuntutan", "kebakaran", "kecelakaan", "bencana",
    "peringatan", "warning", "terkoreksi", "jebol", "lesu",
]

NEGATIONS = {"tidak", "bukan", "tak", "tanpa", "belum", "jangan", "menolak", "stop"}

WORD_RE = re.compile(r"[a-z0-9]+")
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
    "laba bersih", "kinerja", "pendapatan", "restrukturisasi", "right issue",
    "buyback", "akuisisi", "merger", "kontrak baru", "menangkan tender",
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


UP_DIRS = ["naik", "tumbuh", "meningkat", "melompat", "melonjak", "meroket", "menguat", "rekor", "berlipat"]
DOWN_DIRS = ["turun", "anjlok", "menurun", "merosot", "jeblok", "melemah", "tertekan", "koreksi"]
RATE_CUT = ["turun", "dipotong", "pangkas", "menurunkan", "cut", "terendah", "longgarkan", "dilonggarkan"]
RATE_HIKE = ["naik", "dinaikkan", "kenaikan", "menaikkan", "hawkish", "ketat", "dinaikkan lagi"]

EVENT_RULES = [
    # kinerja keuangan
    _ev("kinerja keuangan", 0.72, 1, "emiten",
        pairs=[("laba bersih", d) for d in UP_DIRS] + [("laba", "cetak rekor")]),
    _ev("kinerja keuangan", 0.6, 1, "emiten",
        pairs=[("laba", d) for d in ["naik", "tumbuh", "meningkat", "melonjak", "membaik", "rekor", "positif"]]),
    _ev("kinerja keuangan", 0.7, -1, "emiten",
        pairs=[("laba", d) for d in DOWN_DIRS]),
    _ev("kinerja keuangan", 0.65, -1, "emiten",
        words=["merugi", "mengalami kerugian", "mencatat rugi", "rugi bersih"]),
    _ev("kinerja keuangan", 0.55, -1, "emiten",
        pairs=[("rugi", d) for d in ["naik", "melebar", "melonjak", "membengkak"]]),
    # dividen
    _ev("pembagian dividen", 0.5, 1, "emiten",
        pairs=[("pembagian", "dividen"), ("bagikan", "dividen"), ("membagikan", "dividen"),
               ("umumkan", "dividen"), ("cair", "dividen"), ("dividen", "interim"), ("dividen", "final")] +
              [("dividen", d) for d in ["naik", "tumbuh", "meningkat", "lebih tinggi"]]),
    _ev("dividen", 0.45, -1, "emiten",
        pairs=[("dividen", "turun"), ("dividen", "dipotong"), ("cut", "dividen")]),
    # aksi korporasi
    _ev("akuisisi & ekspansi", 0.5, 1, "emiten",
        words=["akuisisi", "mengakuisisi", "pengambilalihan", "ambil alih", "ekspansi", "perluasan bisnis"]),
    _ev("merger", 0.5, 1, "emiten", words=["merger", "penggabungan usaha"]),
    _ev("aksi korporasi", 0.4, 0, "emiten",
        words=["right issue", "rights issue", "hmetd", "restrukturisasi"]),
    _ev("buyback", 0.5, 1, "emiten", words=["buyback", "pembelian kembali saham"]),
    _ev("kontrak & proyek", 0.5, 1, "emiten",
        pairs=[("menangkan", "kontrak"), ("menangkan", "tender"), ("menangkan", "proyek"),
               ("peroleh", "kontrak"), ("peroleh", "proyek"), ("dapat", "kontrak")]),
    _ev("IPO / listing", 0.5, 1, "emiten",
        words=["ipo", "initial public offering"], pairs=[("mencatatkan", "saham")]),
    # kebijakan moneter & makro
    _ev("kebijakan moneter", 0.72, 1, "pasar",
        pairs=[("suku bunga", d) for d in RATE_CUT] + [("bi rate", d) for d in RATE_CUT],
        words=["the fed memangkas", "fed cut", "pemangkasan suku bunga"]),
    _ev("kebijakan moneter", 0.72, -1, "pasar",
        pairs=[("suku bunga", d) for d in RATE_HIKE] + [("bi rate", d) for d in RATE_HIKE],
        words=["kenaikan suku bunga acuan"]),
    _ev("inflasi", 0.5, 1, "pasar",
        pairs=[("inflasi", d) for d in ["turun", "melandai", "terkendali", "reda", "rendah"]]),
    _ev("inflasi", 0.55, -1, "pasar",
        pairs=[("inflasi", d) for d in ["naik", "melonjak", "meningkat", "tinggi"]]),
    _ev("nilai tukar", 0.45, -1, "pasar",
        pairs=[("rupiah", d) for d in ["melemah", "depresiasi", "jatuh", "tertekan", "merosot"]] +
              [("nilai tukar", "melemah")]),
    _ev("nilai tukar", 0.45, 1, "pasar",
        pairs=[("rupiah", d) for d in ["menguat", "apresiasi", "perkasa"]] +
              [("nilai tukar", "menguat")]),
    # kebijakan & data ekonomi (arah ditentukan sentimen, scope ditandai pasar)
    _ev("kebijakan fiskal", 0.3, 0, "pasar",
        words=["anggaran", "pajak", "bea cukai", "penerimaan negara", "apbn", "subsidi", "belanja negara"]),
    _ev("kebijakan perdagangan", 0.3, 0, "pasar",
        words=["tarif impor", "larangan ekspor", "kuota impor", "perdagangan bilateral", "ekspor"]),
    _ev("data ekonomi", 0.3, 0, "pasar",
        words=["pdb", "gdp", "neraca dagang", "cadangan devisa", "penjualan ritel", "konsumsi rumah tangga"]),
    _ev("sentimen pasar", 0.5, 1, "pasar",
        pairs=[("ihsg", d) for d in ["menguat", "naik", "rebound", "rally", "melompat", "hijau"]] +
              [("pasar saham", "menguat"), ("bursa", "menguat")]),
    _ev("sentimen pasar", 0.5, -1, "pasar",
        pairs=[("ihsg", d) for d in ["melemah", "turun", "tertekan", "koreksi", "anjlok", "merah"]] +
              [("pasar saham", "melemah"), ("bursa", "tertekan")]),
    # risiko
    _ev("PHK / operasional", 0.6, -1, "emiten",
        words=["phk", "pemutusan hubungan kerja", "dirumahkan"]),
    _ev("risiko hukum", 0.65, -1, "emiten",
        words=["sanksi", "denda", "tuntutan", "penyidikan", "korupsi", "gratifikasi", "delisting"]),
    _ev("kegagalan usaha", 0.85, -1, "emiten",
        words=["gagal bayar", "pailit", "bangkrut", "insolvensi", "penundaan kewajiban"]),
    _ev("risiko operasional", 0.6, -1, "emiten",
        words=["kebakaran", "kecelakaan", "bencana", "kerusuhan", "unjuk rasa"]),
]


# Komoditas: frasa + kata arah dalam jarak dekat (diproses khusus)
COMMODITY_PHRASES = [
    "harga minyak", "harga batu bara", "harga nikel", "harga emas", "harga tembaga",
    "harga timah", "harga sawit", "harga cpco", "harga gas",
]
COMMODITY_UP = ["naik", "melonjak", "menguat", "menanjak", "melompat"]
COMMODITY_DOWN = ["turun", "anjlok", "melemah", "merosot", "tertekan"]


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
    # 3) nama perusahaan / alias (word boundary, hindari false positive "dibayangi"→BYAN)
    for alias, code in COMPANY_NAMES.items():
        if re.search(r"\b" + re.escape(alias) + r"\b", low) and code in FULL_EMITEN:
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
    """Tentukan scope dampak: emiten / sektor / pasar."""
    sectors = set()
    for t in ticks:
        sec = FULL_EMITEN.get(t, {}).get("sector")
        if sec:
            sectors.add(sec)
    if event_scope:
        scope = event_scope
    elif ticks:
        scope = "emiten"
    else:
        scope = "umum"
    # widening: banyak emiten/sektor → dampak melebar ke pasar/sektor
    if ticks and scope in ("emiten", "umum"):
        if len(ticks) >= 3 or len(sectors) >= 3:
            scope = "pasar"
        elif len(sectors) == 1 and len(ticks) >= 2:
            scope = "sektor"
        elif len(ticks) >= 2 and len(sectors) >= 2:
            scope = "sektor"
    return scope, sectors


def _scope_target(scope, sectors):
    if scope == "pasar":
        return "IHSG secara keseluruhan"
    if scope == "sektor":
        if not sectors:
            return "sektor terkait"
        return f"sektor {', '.join(sorted(sectors))}"
    return "harga saham emiten terkait"


def _scope_label(scope):
    return {"emiten": "EMITEN", "sektor": "SEKTOR", "pasar": "PASAR", "umum": "UMUM"}.get(scope, "UMUM")


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

    target = _scope_target(scope, sectors)
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
            "market_move": move,
            "strength": round(abs(impact) * 100),
            "direction": direction,
            "scope": scope,
            "scope_label": _scope_label(scope),
            "event": event_label,
            "label": strength,
        },
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