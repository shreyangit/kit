---
title: Kit BG API
sdk: docker
pinned: false
license: mit
short_description: High-quality background removal API powering kit.shreyannarula.com
---

# kit-bg-api

BiRefNet-powered background removal API for [kit.shreyannarula.com](https://kit.shreyannarula.com).

- Model: `ZhengPeng7/BiRefNet` (MIT license)
- Runtime: FastAPI + ZeroGPU (free A100)
- POST `/remove-bg` → returns transparent PNG
- GET `/health` → keepalive ping endpoint
