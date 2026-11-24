from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.stocks import router as stocks_router
from app.routers.cron import router as cron_router
from app.routers.auth import router as auth_router
from app.routers.account import router as account_router
from app.routers.macro import router as macro_router
from app.routers.alerts import router as alerts_router
from app.middleware.rate_limit import RateLimitMiddleware

app = FastAPI(
    title="MARKETIQ API",
    description="Analisa saham AS, ETF & kripto spot + berita global & data makro",
    version="0.2.0",
)

# Add rate limiting middleware (before CORS so it runs first)
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks_router)
app.include_router(cron_router)
app.include_router(auth_router)
app.include_router(account_router)
app.include_router(macro_router)
app.include_router(alerts_router)


@app.get("/")
def root():
    from app.services import cache as cache_svc
    return {"name": "MARKETIQ API", "docs": "/docs", "cache": cache_svc.health()}