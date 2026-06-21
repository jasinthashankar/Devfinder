"""
DevFinder Backend - FastAPI Application Entrypoint
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from utils.config import settings, validate_settings
from scheduler.task_scheduler import start_scheduler
from api import auth_routes, repo_routes, job_routes, misc_routes

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    missing = validate_settings()
    if missing:
        print(f"[WARNING] Missing/placeholder config values: {', '.join(missing)}")
        print("[WARNING] Update backend/.env before relying on Supabase/Groq features.")
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="DevFinder API",
    description="AI-Powered Developer Opportunity Discovery Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(repo_routes.router)
app.include_router(job_routes.router)
app.include_router(misc_routes.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "DevFinder API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
