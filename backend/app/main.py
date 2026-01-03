from fastapi import FastAPI
from app.api.v1.trips import router as trips_router

app = FastAPI(title="Trip Discovery API")

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(trips_router, prefix="/api/v1/trips", tags=["Trips"])
