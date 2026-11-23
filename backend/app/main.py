from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.stocks import router as stocks_router
from app.routers.cron import router as cron_router
from app.routers.auth import router as auth_router
from app.routers.account import router as account_router
from app.routers.macro import router as macro_router

app = FastAPI(
    title="PulseTerminal API",
    description="Analisa saham AS & kripto spot + berita global & data makro",
    version="0.2.0",
)

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


@app.get("/")
def root():
    return {"name": "PulseTerminal API", "docs": "/docs"}