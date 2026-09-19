import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import init_db
from app.api.v1.consensus import router as consensus_router
from app.api.v1.executions import router as executions_router
from app.api.v1.providers import router as providers_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.settings import router as settings_router
from app.api.v1.health import router as health_router
from app.websocket.manager import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    print(f"[{settings.PROJECT_NAME}] Starting up backend engine...")
    init_db()
    yield
    print(f"[{settings.PROJECT_NAME}] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Mounts
app.include_router(consensus_router, prefix=settings.API_V1_STR)
app.include_router(executions_router, prefix=settings.API_V1_STR)
app.include_router(providers_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix=settings.API_V1_STR)

# WebSocket Real-Time Event Stream
@app.websocket("/ws/executions/{execution_id}")
async def websocket_execution_endpoint(websocket: WebSocket, execution_id: str):
    await ws_manager.connect(websocket, execution_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, execution_id)
    except Exception as e:
        ws_manager.disconnect(websocket, execution_id)

@app.get("/")
async def root():
    return {
        "title": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
