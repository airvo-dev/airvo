import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class RatingRequest(BaseModel):
    model_id: str
    model_name: str = ""
    prompt: str = ""
    rating: str
    route_category: str | None = None


@router.post("/api/ratings", tags=["Ratings"], summary="Submit a rating",
    description="Save a thumbs-up or thumbs-down rating for a model response. After 50 ratings the Smart Router uses them to prefer higher-rated models.")
async def submit_rating(req: RatingRequest):
    from airvo.ratings.store import add_rating

    if req.rating not in ("up", "down"):
        raise HTTPException(status_code=400, detail="rating must be 'up' or 'down'")
    entry = add_rating(
        model_id=req.model_id,
        model_name=req.model_name,
        prompt=req.prompt,
        rating=req.rating,
        route_category=req.route_category,
    )
    return {"ok": True, "entry": entry}


@router.get("/api/ratings/stats", tags=["Ratings"], summary="Get rating stats per model",
    description="Returns per-model up/down counts and score (0-1). 'ready' is true when >= 50 ratings exist and the Smart Router is using them.")
async def get_rating_stats():
    from airvo.ratings.store import get_stats

    return get_stats()


@router.delete("/api/ratings", tags=["Ratings"], summary="Clear all ratings")
async def clear_ratings():
    ratings_file = os.path.join(os.path.expanduser("~"), ".airvo", "ratings.json")
    try:
        if os.path.exists(ratings_file):
            os.remove(ratings_file)
    except Exception:
        pass
    return {"ok": True}
