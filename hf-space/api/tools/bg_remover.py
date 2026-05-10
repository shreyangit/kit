import io
import traceback
import torch
import numpy as np
from PIL import Image
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import Response

router = APIRouter()

# ── Lazy Loading State ────────────────────────────────────────────────────────

MODEL_ID = "ZhengPeng7/BiRefNet"
_model = None
_transform = None

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def get_model():
    """Lazy load the model only when the endpoint is hit, saving memory."""
    global _model, _transform
    if _model is None:
        from transformers import AutoModelForImageSegmentation
        from torchvision import transforms
        
        print(f"Loading {MODEL_ID} on {DEVICE}...")
        _model = AutoModelForImageSegmentation.from_pretrained(
            MODEL_ID,
            trust_remote_code=True,
            torch_dtype=torch.float32,
        )
        _model.to(DEVICE)
        _model.eval()
        
        _transform = transforms.Compose([
            transforms.Resize((1024, 1024)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        print(f"{MODEL_ID} loaded on {DEVICE}.")
    return _model, _transform


# ── Inference ─────────────────────────────────────────────────────────────────

def remove_bg(image: Image.Image) -> Image.Image:
    """Run BiRefNet segmentation and return RGBA image with BG removed."""
    model, transform = get_model()
    orig_w, orig_h = image.size

    inp = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        preds = model(inp)[-1].sigmoid()

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

@router.post("/process")
async def process_image(file: UploadFile = File(...)):
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
        traceback.print_exc()
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
