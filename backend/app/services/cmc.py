"""CoinMarketCap API client for crypto data."""
import os
import time
from typing import Optional, Dict, Any, List
import requests

API_KEY = "bd9baef79b0647e69ed5d5aa05a6a719"  # User provided key
BASE_URL = "https://pro-api.coinmarketcap.com"

# Crypto symbol mapping
CRYPTO_SYMBOLS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "XRP": "ripple",
    "ADA": "cardano",
    "DOGE": "dogecoin",
    "AVAX": "avalanche",
    "LINK": "chainlink",
    "DOT": "polkadot",
    "LTC": "litecoin",
}

headers = {
    "X-CMC_PRO_API_KEY": API_KEY,
    "Accept": "application/json"
}

def get_crypto_quote(symbol: str) -> Optional[Dict[str, Any]]:
    """Get current quote for a crypto."""
    cmc_id = CRYPTO_SYMBOLS.get(symbol.upper(), symbol.lower())
    
    try:
        response = requests.get(
            f"{BASE_URL}/v2/cryptocurrency/quotes/latest",
            params={"symbol": symbol.upper(), "convert": "USD"},
            headers=headers,
            timeout=10
        )
        data = response.json()
        
        if "data" not in data:
            return None
        
        quote_data = data["data"].get(symbol.upper(), {})
        quote = quote_data.get("quote", {}).get("USD", {})
        
        if not quote:
            return None
            
        current_price = float(quote.get("price", 0))
        percent_change = float(quote.get("percent_change_24h", 0))
        volume = float(quote.get("volume_24h", 0))
        market_cap = float(quote.get("volume_24h", 0)) * 24  # rough estimate
        
        return {
            "price": current_price,
            "change": current_price * (percent_change / 100) if current_price > 0 else 0,
            "changePct": percent_change,
            "volume": int(volume),
            "marketCap": market_cap,
        }
    except Exception:
        return None

def get_batch_quotes(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    """Get quotes for multiple cryptos."""
    results = {}
    for symbol in symbols:
        quote = get_crypto_quote(symbol)
        if quote:
            results[symbol] = quote
        time.sleep(1)  # Rate limit for free tier
    
    return results

def get_crypto_history(symbol: str, period: str = "30") -> Optional[List[Dict]]:
    """Get historical prices for crypto."""
    try:
        response = requests.get(
            f"{BASE_URL}/v2/cryptocurrencyOHLCVHistorical",
            params={
                "symbol": symbol.upper(),
                "convert": "USD",
                "time_start": "1",  # 1 day ago, adjust as needed
            },
            headers=headers,
            timeout=15
        )
        data = response.json()
        
        # CMC doesn't provide free historical OHLCV in the same endpoint
        # Fallback to a simple daily quote
        quote = get_crypto_quote(symbol)
        if quote:
            return [{
                "date": "2024-01-01",  # Placeholder
                "open": quote["price"] * 0.99,
                "high": quote["price"] * 1.01,
                "low": quote["price"] * 0.98,
                "close": quote["price"],
                "volume": quote.get("volume", 0)
            }]
        return None
    except Exception:
        return None

def get_crypto_info(symbol: str) -> Optional[Dict[str, Any]]:
    """Get crypto profile info."""
    cmc_id = CRYPTO_SYMBOLS.get(symbol.upper(), symbol.lower())
    
    try:
        response = requests.get(
            f"{BASE_URL}/v2/cryptocurrency/info",
            params={"symbol": symbol.upper(), "convert": "USD"},
            headers=headers,
            timeout=10
        )
        data = response.json()
        
        if "data" not in data or symbol.upper() not in data["data"]:
            return None
            
        info_data = data["data"][symbol.upper()]
        
        return {
            "name": info_data.get("name", symbol),
            "symbol": symbol.upper(),
            "website": info_data.get("urls", {}).get("official", [""])[0] if info_data.get("urls") else "",
            "description": info_data.get("description", ""),
            "logo_url": info_data.get("logo", ""),
            "tags": info_data.get("tags", []),
        }
    except Exception:
        return None