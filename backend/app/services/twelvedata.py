"""Twelve Data API client for free stock/crypto data."""
import os
import time
from typing import Optional, Dict, Any, List
import requests

API_KEY = os.getenv("TWELVEDATA_API_KEY", "")
BASE_URL = "https://api.twelvedata.com"

# Symbol mapping from internal ticker to Twelve Data format
SYMBOL_MAP = {
    # US Stocks (no suffix needed)
    "AAPL": "AAPL", "MSFT": "MSFT", "NVDA": "NVDA", "GOOGL": "GOOGL", 
    "AMZN": "AMZN", "TSLA": "TSLA", "META": "META", "NFLX": "NFLX",
    "JPM": "JPM", "V": "V", "MA": "MA", "WMT": "WMT", "JNJ": "JNJ",
    "XOM": "XOM", "BAC": "BAC", "DIS": "DIS", "CRM": "CRM", "ADBE": "ADBE",
    "PYPL": "PYPL", "INTC": "INTC", "AMD": "AMD", "UBER": "UBER", "SHOP": "SHOP",
    "COIN": "COIN", "SNOW": "SNOW", "DOCU": "DOCU", "TEAM": "TEAM", "ESTC": "ESTC",
    "PLTR": "PLTR", "DD": "DD", "LMT": "LMT", "HON": "HON", "GE": "GE",
    
    # ETFs
    "SPY": "SPY", "QQQ": "QQQ", "VOO": "VOO", "IWM": "IWM", "DIA": "DIA",
    "GLD": "GLD", "TLT": "TLT", "XLE": "XLE", "XLF": "XLF", "XLK": "XLK",
    
    # Crypto (pair notation)
    "BTC": "BTC_USD", "ETH": "ETH_USD", "SOL": "SOL_USD", "XRP": "XRP_USD",
    "ADA": "ADA_USD", "DOGE": "DOGE_USD", "AVAX": "AVAX_USD", "LINK": "LINK_USD",
    "DOT": "DOT_USD", "LTC": "LTC_USD",
}

def get_stock_quote(ticker: str) -> Optional[Dict[str, Any]]:
    """Get current quote for a ticker."""
    if not API_KEY:
        return None
    
    symbol = SYMBOL_MAP.get(ticker.upper(), ticker)
    
    try:
        response = requests.get(
            f"{BASE_URL}/quote",
            params={"symbol": symbol, "outputsize": "1", "interval": "1min"},
            timeout=10
        )
        data = response.json()
        
        if data.get("status") == "error":
            return None
            
        if "datetime" not in data:
            return None
            
        current_price = float(data.get("price", 0))
        open_price = float(data.get("open", current_price))
        change = current_price - open_price
        change_pct = (change / open_price * 100) if open_price > 0 else 0
        
        return {
            "price": current_price,
            "change": round(change, 4),
            "changePct": round(change_pct, 2),
            "volume": int(data.get("volume", 0)),
        }
    except Exception:
        return None

def get_batch_quotes(tickers: List[str]) -> Dict[str, Dict[str, Any]]:
    """Get quotes for multiple tickers."""
    if not API_KEY:
        return {}
    
    results = {}
    for ticker in tickers:
        quote = get_stock_quote(ticker)
        if quote:
            results[ticker] = quote
        time.sleep(0.1)  # Rate limit
    
    return results

def get_history(ticker: str, period: str = "1mo", interval: str = "1day") -> Optional[List[Dict]]:
    """Get historical prices."""
    if not API_KEY:
        return None
    
    symbol = SYMBOL_MAP.get(ticker.upper(), ticker)
    
    try:
        response = requests.get(
            f"{BASE_URL}/time_series",
            params={
                "symbol": symbol,
                "interval": interval,
                "outputsize": period,
                "order": "ASC"
            },
            timeout=15
        )
        data = response.json()
        
        if data.get("status") == "error" or "values" not in data:
            return None
            
        values = data.get("values", [])
        return [
            {
                "date": v.get("datetime", ""),
                "open": float(v.get("open", 0)),
                "high": float(v.get("high", 0)),
                "low": float(v.get("low", 0)),
                "close": float(v.get("close", 0)),
                "volume": int(v.get("volume", 0))
            }
            for v in values
        ]
    except Exception:
        return None

def get_company_info(ticker: str) -> Optional[Dict[str, Any]]:
    """Get company profile/info."""
    if not API_KEY:
        return None
    
    symbol = SYMBOL_MAP.get(ticker.upper(), ticker)
    
    try:
        response = requests.get(
            f"{BASE_URL}/profile",
            params={"symbol": symbol},
            timeout=10
        )
        data = response.json()
        
        if data.get("status") == "error":
            return None
            
        return {
            "name": data.get("name", ticker),
            "sector": data.get("sector", "Various"),
            "industry": data.get("industry", ""),
            "website": data.get("website", ""),
            "country": data.get("country", ""),
            "marketCap": float(data.get("market_cap", 0)),
            "pe": float(data.get("open")) if data.get("open") else None,
        }
    except Exception:
        return None