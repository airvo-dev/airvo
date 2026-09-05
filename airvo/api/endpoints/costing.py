from datetime import date
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from airvo.config.settings import settings
from airvo.cost.pricing import estimate_cost_from_total, format_cost, get_monthly_cost, get_savings_vs_gpt4o

router = APIRouter()


@router.get("/api/cost/monthly", tags=["Cost"],
    summary="Get cost breakdown for the current month",
    description="Returns per-model cost totals for the current calendar month in USD.")
def cost_monthly():
    month_key = date.today().strftime("%Y-%m")
    monthly = get_monthly_cost(month_key)
    total = sum(monthly.values())

    stats = settings.get_stats()
    total_savings = 0.0
    for model_id, model_stats in stats.items():
        tokens = model_stats.get("tokens", 0)
        total_savings += get_savings_vs_gpt4o(model_id, tokens)

    return {
        "month": month_key,
        "by_model": monthly,
        "total_usd": round(total, 6),
        "total_fmt": format_cost(total),
        "savings_vs_gpt4o_usd": round(total_savings, 4),
        "savings_fmt": format_cost(total_savings),
    }


@router.get("/api/cost/estimate", tags=["Cost"],
    summary="Estimate cost for a given model and token count")
def cost_estimate(model_id: str = "openai/gpt-4o", tokens: int = 1000):
    cost = estimate_cost_from_total(model_id, tokens)
    savings = get_savings_vs_gpt4o(model_id, tokens)
    return {
        "model": model_id,
        "tokens": tokens,
        "cost_usd": cost,
        "cost_fmt": format_cost(cost),
        "savings_usd": savings,
        "savings_fmt": format_cost(savings),
        "is_free": cost == 0.0,
    }


@router.get("/api/budget", tags=["Cost"], summary="Get current monthly budget settings and usage")
def get_budget():
    prefs = settings.get_prefs()
    month_key = date.today().strftime("%Y-%m")
    monthly = get_monthly_cost(month_key)
    spent = round(sum(monthly.values()), 6)
    budget = float(prefs.get("cost_budget_usd", 0.0))
    alert_pct = int(prefs.get("cost_budget_alert_pct", 80))
    pct_used = round((spent / budget * 100), 1) if budget > 0 else None

    return {
        "budget_usd": budget,
        "unlimited": budget == 0.0,
        "spent_usd": spent,
        "spent_fmt": format_cost(spent),
        "remaining_usd": round(max(0.0, budget - spent), 6) if budget > 0 else None,
        "pct_used": pct_used,
        "alert_pct": alert_pct,
        "alert_triggered": (pct_used is not None and pct_used >= alert_pct),
        "budget_exceeded": (budget > 0 and spent >= budget),
        "month": month_key,
    }


class BudgetUpdate(BaseModel):
    cost_budget_usd: Optional[float] = None
    cost_budget_alert_pct: Optional[int] = None


@router.put("/api/budget", tags=["Cost"], summary="Update monthly budget settings")
def update_budget(body: BudgetUpdate):
    updates = {}
    if body.cost_budget_usd is not None:
        updates["cost_budget_usd"] = max(0.0, body.cost_budget_usd)
    if body.cost_budget_alert_pct is not None:
        updates["cost_budget_alert_pct"] = max(1, min(100, body.cost_budget_alert_pct))
    if updates:
        settings.update_prefs(updates)
    return get_budget()
