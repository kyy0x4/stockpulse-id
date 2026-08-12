SECTOR_MAP = {
    "banc": "Perbankan",
    "cns": "Konsumen",
    "tlcm": "Telekomunikasi",
    "mining": "Tambang",
    "energy": "Energi",
    "infr": "Infrastruktur",
    "indl": "Industri",
    "tech": "Teknologi",
    "trns": "Transportasi",
    "prop": "Properti",
    "pfp": "Finansial",
    "agri": "Pertanian",
    "medi": "Media",
    "heal": "Kesehatan",
    "retail": "Ritel",
    "auto": "Otomotif",
}

SECTOR_GROUP = {
    "Financial Services": "Perbankan",
    "Money Center Banks": "Perbankan",
    "Banks Regional": "Perbankan",
    "Consumer Defensive": "Konsumen",
    "Consumer Cyclical": "Konsumen",
    "Communication Services": "Telekomunikasi",
    "Basic Materials": "Tambang",
    "Energy": "Energi",
    "Utilities": "Energi",
    "Industrials": "Industri",
    "Technology": "Teknologi",
    "Real Estate": "Properti",
    "Healthcare": "Kesehatan",
    "Media": "Media",
    "Perbankan": "Perbankan",
    "Konsumen": "Konsumen",
    "Telekomunikasi": "Telekomunikasi",
    "Tambang": "Tambang",
    "Energi": "Energi",
    "Infrastruktur": "Infrastruktur",
    "Industri": "Industri",
    "Teknologi": "Teknologi",
    "Properti": "Properti",
    "Media": "Media",
    "Kesehatan": "Kesehatan",
}

SECTOR_GROUPS = [
    "Perbankan", "Konsumen", "Tambang", "Energi", "Telekomunikasi",
    "Infrastruktur", "Industri", "Teknologi", "Properti", "Media",
    "Kesehatan",
]

TICKERS = [
    "BBCA", "BBRI", "BMRI", "BBNI", "BRIS", "TLKM", "ISAT", "EXCL",
    "ASII", "ADRO", "PTBA", "ANTM", "INCO", "MDKA", "TINS", "HRUM", "MEDC",
    "PGAS", "ICBP", "INDF", "UNVR", "MYOR", "CPIN", "CLEO", "ULTJ",
    "KLBF", "SIDO", "HEAL", "GOOD", "GOTO", "DCII", "BYAN", "BUMI", "BRPT",
    "SMGR", "INTP", "WIKA", "PTPP", "JSMR", "TOWR", "MTEL", "ACES",
    "MAPI", "ERAA", "AMMN", "ARTO", "BREN", "BBTN",
]

VALUE_STOCKS = [
    "GGRM", "HMSP", "MLBI", "ADHI", "BJBR", "BJTM", "BRIS", "BTPS",
    "MAYA", "AGRO", "NISP", "SMCB", "SMMA", "TKIM", "INKP", "TPIA",
    "BSDE", "CTRA", "PWON", "SMRA", "PANI", "MKPI", "ELSA", "AKRA", "DSSA",
    "INDF",
]

ALL_TICKERS = sorted(set(TICKERS + VALUE_STOCKS))

# Override logo untuk ticker yang sumber defaultnya (tickerlogos + favicon Google)
# gagal total. URL diverifikasi bisa diakses publik.
LOGO_OVERRIDES = {
    "TLKM": "https://icon.horse/icon/telkom.co.id",
    "CPIN": "https://icon.horse/icon/cp.co.id",
    "MLBI": "https://icon.horse/icon/multibintang.co.id",
    "SMGR": "https://icon.horse/icon/sig.id",
    "AMMN": "https://icon.horse/icon/amman.co.id",
}