"""
kit-api — Centralized API for Kit Tools
Runtime: FastAPI on Hugging Face Spaces with ZeroGPU (free A100)

This is the main entry point. New tools should be added to the `api/tools/` 
directory and mounted here using an APIRouter.

Endpoints:
  GET  /health                      — keepalive ping
  POST /api/v1/bg-remover/process   — background removal
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import tool routers
from api.tools import bg_remover

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="kit-api", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kit.shreyannarula.com", "http://localhost:3000"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Mount Tool Routers ────────────────────────────────────────────────────────

# Background Remover
app.include_router(
    bg_remover.router,
    prefix="/api/v1/bg-remover",
    tags=["Background Remover"]
)

# Add future tools here...
# app.include_router(image_upscaler.router, prefix="/api/v1/upscaler", tags=["Upscaler"])


# ── Global Routes ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Keepalive ping to prevent HF Space from sleeping."""
    # We don't load models here so the health check is always blazing fast
    # and doesn't consume memory.
    return JSONResponse({"status": "ok", "message": "kit-api is awake"})

# ── ZeroGPU Gradio Mount ──────────────────────────────────────────────────────
# ZeroGPU requires the Gradio SDK to initialize its CUDA interception hooks.
# We mount a dummy Gradio app here so you can deploy this as a "Gradio Space" 
# instead of a Docker Space, allowing our FastAPI routes to use @spaces.GPU.

import gradio as gr

def dummy(text=None):
    return "kit-api is running"

demo = gr.Interface(fn=dummy, inputs="text", outputs="text")
app = gr.mount_gradio_app(app, demo, path="/_gradio_empty")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
