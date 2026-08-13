from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.stocks import router as stocks_router
from app.routers.cron import router as cron_router

app = FastAPI(
    title="StockPulse ID API",
    description="Analisa fundamental & teknikal saham Indonesia",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks_router)
app.include_router(cron_router)


@app.get("/")
def root():
    return {"name": "StockPulse ID API", "docs": "/docs"}