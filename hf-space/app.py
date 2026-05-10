"""
kit-bg-api — High-quality background removal API
Model: ZhengPeng7/BiRefNet (MIT license, SOTA quality)
Runtime: FastAPI on Hugging Face Spaces with ZeroGPU (free A100)

Endpoints:
  GET  /health        — keepalive ping
  POST /remove-bg     — multipart image → transparent PNG
"""

import io
import spaces
import torch
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from transformers import AutoModelForImageSegmentation
from torchvision import transforms

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="kit-bg-api", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kit.shreyannarula.com", "http://localhost:3000"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Model ─────────────────────────────────────────────────────────────────────

MODEL_ID = "ZhengPeng7/BiRefNet"

print(f"Loading {MODEL_ID}...")
birefnet = AutoModelForImageSegmentation.from_pretrained(
    MODEL_ID,
    trust_remote_code=True,
)
birefnet.eval()
print("Model ready (on CPU, will move to GPU per request).")

# Standard BiRefNet preprocessing
INPUT_SIZE = (1024, 1024)
transform = transforms.Compose([
    transforms.Resize(INPUT_SIZE),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


# ── Inference ─────────────────────────────────────────────────────────────────

@spaces.GPU
def remove_bg(image: Image.Image) -> Image.Image:
    """Run BiRefNet segmentation and return RGBA image with BG removed."""
    orig_w, orig_h = image.size

    # ZeroGPU allocates GPU per-call — move model and input to available device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    birefnet.to(device)

    inp = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        preds = birefnet(inp)[-1].sigmoid()

    # preds shape: [1, 1, H, W] — squeeze to (H, W)
    mask = preds[0, 0].cpu().numpy()

    # Resize mask to original size
    mask_img = Image.fromarray((mask * 255).astype(np.uint8)).resize(
        (orig_w, orig_h), Image.LANCZOS
    )

    # Composite onto transparent background
    result = image.convert("RGBA")
    result.putalpha(mask_img)
    return result


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return JSONResponse({"status": "ok", "model": MODEL_ID})


@app.post("/remove-bg")
async def remove_background(file: UploadFile = File(...)):
    # Validate MIME
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Unsupported format. Send JPEG, PNG, or WebP.")

    # Read + validate size (20 MB max)
    data = await file.read()
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(413, "Image too large. Max 20 MB.")

    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Could not decode image.")

    try:
        result = remove_bg(image)
    except Exception as e:
        raise HTTPException(500, f"Inference failed: {str(e)}")

    # Encode result as PNG
    out = io.BytesIO()
    result.save(out, format="PNG", optimize=True)
    out.seek(0)

    return Response(
        content=out.read(),
        media_type="image/png",
        headers={"Content-Disposition": "inline; filename=result.png"},
    )
