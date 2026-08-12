"""Fetch berita pasar saham Indonesia dari RSS CNBC Indonesia."""

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
        out.append({
            "title": title.strip(),
            "link": link,
            "image": image,
            "published": pub_date,
        })
    return out