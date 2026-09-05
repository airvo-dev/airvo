from fastapi import APIRouter
from pydantic import BaseModel

from airvo.config.settings import settings
from airvo.router.classifier import classify as _classify_prompt, CATEGORY_META

router = APIRouter()


@router.get("/api/router/categories", tags=["Smart Router"],
    summary="List all route categories with icon, label, and configured model.")
async def get_router_categories():
    prefs = settings.get_prefs()
    cats = []
    for key, meta in CATEGORY_META.items():
        cats.append({
            "category": key,
            "icon": meta["icon"],
            "label": meta["label"],
            "color": meta["color"],
            "model_id": prefs.get(f"router_{key}"),
        })
    return {"categories": cats}


class ClassifyRequest(BaseModel):
    prompt: str


@router.post("/api/router/classify", tags=["Smart Router"],
    summary="Classify a prompt and return its category.")
async def classify_prompt(req: ClassifyRequest):
    cat = _classify_prompt(req.prompt)
    meta = CATEGORY_META[cat]
    return {"category": cat, "icon": meta["icon"], "label": meta["label"]}
