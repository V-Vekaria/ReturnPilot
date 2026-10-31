from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app import config, db
from backend.app.api import cases, investigate

@asynccontextmanager
async def lifespan(_app: FastAPI):
	db.init_db()
	yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
	CORSMiddleware,
	allow_origins=config.ALLOWED_ORIGINS,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)
@app.get("/health")
def health():
	return {"status": "ok", "mode": config.INVESTIGATION_MODE}


@app.post("/api/dev/reset")
def reset_database():
	db.init_db(reset=True)
	return {"status": "ok"}


app.include_router(cases.router)
app.include_router(investigate.router)
