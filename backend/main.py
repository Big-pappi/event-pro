"""InvitePro FastAPI backend.

Mock SaaS invitation platform API. All data is in-memory (see store.py).
Routes are defined WITHOUT the /api prefix — Vercel strips the routePrefix
before forwarding requests to this service.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

import io

import fastapi
import fastapi.middleware.cors
import fastapi.responses
import qrcode
from pydantic import BaseModel

import store

app = fastapi.FastAPI(title="InvitePro API")

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _plan(plan_id: str) -> dict:
    return next((p for p in store.PLANS if p["id"] == plan_id), store.PLANS[0])


# ===========================================================================
# Health
# ===========================================================================
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "invitepro-api"}


# ===========================================================================
# QR codes — generated server-side as PNG
# ===========================================================================
@app.get("/qr/{token}")
async def qr_code(token: str) -> fastapi.responses.Response:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(f"invitepro://checkin/{token}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1c1830", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return fastapi.responses.Response(
        content=buf.getvalue(),
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )


# ===========================================================================
# Auth (mock)
# ===========================================================================
class LoginBody(BaseModel):
    email: str
    password: str


class SignupBody(BaseModel):
    name: str
    email: str
    password: str
    company: Optional[str] = None


@app.post("/auth/login")
async def login(body: LoginBody) -> dict[str, Any]:
    user = next((u for u in store.USERS if u["email"].lower() == body.email.lower()), None)
    if user is None:
        # default to the demo agent so the prototype is easy to explore
        user = next(u for u in store.USERS if u["id"] == "usr_agent")
    return {"token": _id("tok"), "user": user}


@app.post("/auth/signup")
async def signup(body: SignupBody) -> dict[str, Any]:
    user = {
        "id": _id("usr"),
        "name": body.name,
        "email": body.email,
        "role": "agent",
        "plan_id": "free",
        "status": "active",
        "company": body.company or "",
        "created_at": _now(),
        "avatar": None,
    }
    store.USERS.append(user)
    return {"token": _id("tok"), "user": user}


@app.get("/auth/me")
async def me(role: str = "agent") -> dict[str, Any]:
    uid = "usr_admin" if role == "admin" else "usr_agent"
    user = next(u for u in store.USERS if u["id"] == uid)
    return {"user": user}


# ===========================================================================
# Plans
# ===========================================================================
@app.get("/plans")
async def list_plans() -> list[dict]:
    return store.PLANS


# ===========================================================================
# Agent dashboard stats
# ===========================================================================
@app.get("/dashboard/stats")
async def dashboard_stats(owner_id: str = "usr_agent") -> dict[str, Any]:
    events = [e for e in store.EVENTS if e["owner_id"] == owner_id]
    invitees = [i for i in store.INVITEES if i["owner_id"] == owner_id]
    campaigns = [c for c in store.CAMPAIGNS if c["owner_id"] == owner_id]
    accepted = len([i for i in invitees if i["rsvp"] == "accepted"])
    pending = len([i for i in invitees if i["rsvp"] == "pending"])
    declined = len([i for i in invitees if i["rsvp"] == "declined"])
    sent = sum(c["sent"] for c in campaigns)
    delivered = sum(c["delivered"] for c in campaigns)

    # 7-day activity series (mock distribution)
    activity = [
        {"day": d, "sent": v, "opened": int(v * 0.7)}
        for d, v in zip(
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            [4, 8, 6, 12, 9, 14, 7],
        )
    ]

    return {
        "events_total": len(events),
        "events_active": len([e for e in events if e["status"] == "active"]),
        "invitees_total": len(invitees),
        "rsvp": {"accepted": accepted, "pending": pending, "declined": declined},
        "messages_sent": sent,
        "messages_delivered": delivered,
        "delivery_rate": round((delivered / sent * 100) if sent else 0, 1),
        "activity": activity,
        "channels": [
            {"name": "WhatsApp", "value": 48},
            {"name": "Email", "value": 32},
            {"name": "SMS", "value": 20},
        ],
    }


# ===========================================================================
# Events
# ===========================================================================
class EventBody(BaseModel):
    title: str
    type: str = "Wedding"
    description: str = ""
    venue: str = ""
    address: str = ""
    starts_at: Optional[str] = None
    cover_color: str = "#7c3aed"
    status: str = "active"


@app.get("/events")
async def list_events(owner_id: str = "usr_agent") -> list[dict]:
    items = [e for e in store.EVENTS if e["owner_id"] == owner_id]
    for e in items:
        e["invitee_count"] = len([i for i in store.INVITEES if i["event_id"] == e["id"]])
    return sorted(items, key=lambda e: e["created_at"], reverse=True)


@app.get("/events/{event_id}")
async def get_event(event_id: str) -> dict:
    evt = next((e for e in store.EVENTS if e["id"] == event_id), None)
    if evt is None:
        raise fastapi.HTTPException(status_code=404, detail="Event not found")
    invitees = [i for i in store.INVITEES if i["event_id"] == event_id]
    return {
        **evt,
        "invitee_count": len(invitees),
        "rsvp": {
            "accepted": len([i for i in invitees if i["rsvp"] == "accepted"]),
            "pending": len([i for i in invitees if i["rsvp"] == "pending"]),
            "declined": len([i for i in invitees if i["rsvp"] == "declined"]),
        },
    }


@app.post("/events")
async def create_event(body: EventBody, owner_id: str = "usr_agent") -> dict:
    evt = {
        "id": _id("evt"),
        "owner_id": owner_id,
        "title": body.title,
        "type": body.type,
        "description": body.description,
        "venue": body.venue,
        "address": body.address,
        "starts_at": body.starts_at or _now(),
        "status": body.status,
        "cover_color": body.cover_color,
        "created_at": _now(),
        "invitee_count": 0,
    }
    store.EVENTS.append(evt)
    return evt


@app.put("/events/{event_id}")
async def update_event(event_id: str, body: EventBody) -> dict:
    evt = next((e for e in store.EVENTS if e["id"] == event_id), None)
    if evt is None:
        raise fastapi.HTTPException(status_code=404, detail="Event not found")
    evt.update(body.model_dump(exclude_unset=True))
    return evt


@app.delete("/events/{event_id}")
async def delete_event(event_id: str) -> dict:
    store.EVENTS[:] = [e for e in store.EVENTS if e["id"] != event_id]
    store.INVITEES[:] = [i for i in store.INVITEES if i["event_id"] != event_id]
    return {"ok": True}


# ===========================================================================
# Invitees
# ===========================================================================
class InviteeBody(BaseModel):
    event_id: str
    name: str
    email: str = ""
    phone: str = ""
    group: str = "Friends"
    rsvp: str = "pending"
    guests: int = 1


class BulkInviteeBody(BaseModel):
    event_id: str
    invitees: list[dict]


@app.get("/invitees")
async def list_invitees(
    owner_id: str = "usr_agent",
    event_id: Optional[str] = None,
    search: Optional[str] = None,
    rsvp: Optional[str] = None,
) -> list[dict]:
    items = [i for i in store.INVITEES if i["owner_id"] == owner_id]
    if event_id:
        items = [i for i in items if i["event_id"] == event_id]
    if rsvp and rsvp != "all":
        items = [i for i in items if i["rsvp"] == rsvp]
    if search:
        s = search.lower()
        items = [i for i in items if s in i["name"].lower() or s in i["email"].lower()]
    return sorted(items, key=lambda i: i["created_at"], reverse=True)


@app.post("/invitees")
async def create_invitee(body: InviteeBody, owner_id: str = "usr_agent") -> dict:
    inv = {
        "id": uuid.uuid4().hex[:12],
        "owner_id": owner_id,
        "event_id": body.event_id,
        "name": body.name,
        "email": body.email,
        "phone": body.phone,
        "group": body.group,
        "rsvp": body.rsvp,
        "guests": body.guests,
        "checked_in": False,
        "created_at": _now(),
    }
    store.INVITEES.append(inv)
    return inv


@app.post("/invitees/bulk")
async def bulk_create(body: BulkInviteeBody, owner_id: str = "usr_agent") -> dict:
    created = []
    for row in body.invitees:
        inv = {
            "id": uuid.uuid4().hex[:12],
            "owner_id": owner_id,
            "event_id": body.event_id,
            "name": row.get("name", "Guest"),
            "email": row.get("email", ""),
            "phone": row.get("phone", ""),
            "group": row.get("group", "Friends"),
            "rsvp": "pending",
            "guests": int(row.get("guests", 1) or 1),
            "checked_in": False,
            "created_at": _now(),
        }
        store.INVITEES.append(inv)
        created.append(inv)
    return {"created": len(created), "invitees": created}


@app.put("/invitees/{invitee_id}")
async def update_invitee(invitee_id: str, body: dict) -> dict:
    inv = next((i for i in store.INVITEES if i["id"] == invitee_id), None)
    if inv is None:
        raise fastapi.HTTPException(status_code=404, detail="Invitee not found")
    for k in ("name", "email", "phone", "group", "rsvp", "guests", "checked_in"):
        if k in body:
            inv[k] = body[k]
    return inv


@app.delete("/invitees/{invitee_id}")
async def delete_invitee(invitee_id: str) -> dict:
    store.INVITEES[:] = [i for i in store.INVITEES if i["id"] != invitee_id]
    return {"ok": True}


# ===========================================================================
# Templates
# ===========================================================================
class TemplateBody(BaseModel):
    name: str
    category: str = "Wedding"
    background: str = "#ffffff"
    width: int = 600
    height: int = 800
    layers: list[dict] = []
    thumbnail_color: str = "#7c3aed"
    is_premium: bool = False


@app.get("/templates")
async def list_templates(owner_id: str = "usr_agent", category: Optional[str] = None) -> list[dict]:
    items = [t for t in store.TEMPLATES if t["owner_id"] in (owner_id, "system")]
    if category and category != "All":
        items = [t for t in items if t["category"] == category]
    return sorted(items, key=lambda t: t["updated_at"], reverse=True)


@app.get("/templates/{template_id}")
async def get_template(template_id: str) -> dict:
    tpl = next((t for t in store.TEMPLATES if t["id"] == template_id), None)
    if tpl is None:
        raise fastapi.HTTPException(status_code=404, detail="Template not found")
    return tpl


@app.post("/templates")
async def create_template(body: TemplateBody, owner_id: str = "usr_agent") -> dict:
    tpl = {
        "id": _id("tpl"),
        "owner_id": owner_id,
        "name": body.name,
        "category": body.category,
        "is_premium": body.is_premium,
        "thumbnail_color": body.thumbnail_color,
        "width": body.width,
        "height": body.height,
        "background": body.background,
        "layers": body.layers,
        "updated_at": _now(),
    }
    store.TEMPLATES.append(tpl)
    return tpl


@app.put("/templates/{template_id}")
async def update_template(template_id: str, body: TemplateBody) -> dict:
    tpl = next((t for t in store.TEMPLATES if t["id"] == template_id), None)
    if tpl is None:
        raise fastapi.HTTPException(status_code=404, detail="Template not found")
    tpl.update(body.model_dump(exclude_unset=True))
    tpl["updated_at"] = _now()
    return tpl


@app.delete("/templates/{template_id}")
async def delete_template(template_id: str) -> dict:
    store.TEMPLATES[:] = [t for t in store.TEMPLATES if t["id"] != template_id]
    return {"ok": True}


# ===========================================================================
# Campaigns / invitation sending (simulated)
# ===========================================================================
class CampaignBody(BaseModel):
    event_id: str
    template_id: str
    name: str
    channel: str = "whatsapp"
    invitee_ids: list[str] = []


@app.get("/campaigns")
async def list_campaigns(owner_id: str = "usr_agent") -> list[dict]:
    items = [c for c in store.CAMPAIGNS if c["owner_id"] == owner_id]
    return sorted(items, key=lambda c: c["created_at"], reverse=True)


@app.post("/campaigns")
async def create_campaign(body: CampaignBody, owner_id: str = "usr_agent") -> dict:
    targets = body.invitee_ids or [
        i["id"] for i in store.INVITEES if i["event_id"] == body.event_id
    ]
    total = len(targets)
    # simulate near-complete delivery
    delivered = max(0, total - (1 if total > 8 else 0))
    cmp = {
        "id": _id("cmp"),
        "owner_id": owner_id,
        "event_id": body.event_id,
        "template_id": body.template_id,
        "name": body.name,
        "channel": body.channel,
        "status": "sending",
        "total": total,
        "sent": total,
        "delivered": delivered,
        "failed": total - delivered,
        "opened": int(delivered * 0.6),
        "created_at": _now(),
    }
    store.CAMPAIGNS.append(cmp)
    store.LOGS.insert(0, {
        "id": uuid.uuid4().hex[:12],
        "level": "info",
        "actor": "amara@bloomevents.co",
        "action": "campaign.created",
        "detail": f"{body.name} queued to {total} invitees via {body.channel}",
        "at": _now(),
    })
    return cmp


@app.post("/campaigns/{campaign_id}/advance")
async def advance_campaign(campaign_id: str) -> dict:
    """Simulate delivery progress for a sending campaign."""
    cmp = next((c for c in store.CAMPAIGNS if c["id"] == campaign_id), None)
    if cmp is None:
        raise fastapi.HTTPException(status_code=404, detail="Campaign not found")
    cmp["status"] = "completed"
    cmp["opened"] = int(cmp["delivered"] * 0.75)
    return cmp


# ===========================================================================
# Admin — users
# ===========================================================================
@app.get("/admin/stats")
async def admin_stats() -> dict[str, Any]:
    agents = [u for u in store.USERS if u["role"] == "agent"]
    paying = [u for u in agents if u["plan_id"] != "free"]
    mrr = sum(_plan(u["plan_id"])["price"] for u in paying)
    pending_payments = len([p for p in store.PAYMENTS if p["status"] == "pending"])
    return {
        "users_total": len(agents),
        "users_active": len([u for u in agents if u["status"] == "active"]),
        "events_total": len(store.EVENTS),
        "messages_total": sum(c["sent"] for c in store.CAMPAIGNS),
        "mrr": mrr,
        "pending_payments": pending_payments,
        "plan_distribution": [
            {"name": "Free", "value": len([u for u in agents if u["plan_id"] == "free"])},
            {"name": "Pro", "value": len([u for u in agents if u["plan_id"] == "pro"])},
            {"name": "Business", "value": len([u for u in agents if u["plan_id"] == "business"])},
        ],
        "revenue_trend": [
            {"month": m, "mrr": v}
            for m, v in zip(
                ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                [120, 158, 187, 205, 246, mrr],
            )
        ],
    }


@app.get("/admin/users")
async def admin_users(search: Optional[str] = None) -> list[dict]:
    items = [u for u in store.USERS if u["role"] == "agent"]
    if search:
        s = search.lower()
        items = [u for u in items if s in u["name"].lower() or s in u["email"].lower()]
    out = []
    for u in items:
        out.append({
            **u,
            "plan_name": _plan(u["plan_id"])["name"],
            "events": len([e for e in store.EVENTS if e["owner_id"] == u["id"]]),
        })
    return out


@app.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: dict) -> dict:
    user = next((u for u in store.USERS if u["id"] == user_id), None)
    if user is None:
        raise fastapi.HTTPException(status_code=404, detail="User not found")
    for k in ("status", "plan_id", "role"):
        if k in body:
            user[k] = body[k]
    return user


# ===========================================================================
# Admin — payments
# ===========================================================================
@app.get("/admin/payments")
async def admin_payments(status_filter: Optional[str] = None) -> list[dict]:
    items = list(store.PAYMENTS)
    if status_filter and status_filter != "all":
        items = [p for p in items if p["status"] == status_filter]
    for p in items:
        p["plan_name"] = _plan(p["plan_id"])["name"]
    return sorted(items, key=lambda p: p["created_at"], reverse=True)


@app.post("/admin/payments/{payment_id}/decision")
async def payment_decision(payment_id: str, body: dict) -> dict:
    pay = next((p for p in store.PAYMENTS if p["id"] == payment_id), None)
    if pay is None:
        raise fastapi.HTTPException(status_code=404, detail="Payment not found")
    decision = body.get("decision", "approved")
    pay["status"] = decision
    if decision == "approved":
        user = next((u for u in store.USERS if u["id"] == pay["user_id"]), None)
        if user:
            user["plan_id"] = pay["plan_id"]
            if user["status"] == "suspended":
                user["status"] = "active"
    store.LOGS.insert(0, {
        "id": uuid.uuid4().hex[:12],
        "level": "info",
        "actor": "admin@invitepro.app",
        "action": f"payment.{decision}",
        "detail": f"{decision.title()} {pay['reference']} for {pay['user_name']}",
        "at": _now(),
    })
    return pay


# ===========================================================================
# Admin — logs & settings
# ===========================================================================
@app.get("/admin/logs")
async def admin_logs(level: Optional[str] = None) -> list[dict]:
    items = list(store.LOGS)
    if level and level != "all":
        items = [l for l in items if l["level"] == level]
    return items


@app.get("/admin/settings")
async def get_settings() -> dict:
    return store.SETTINGS


@app.put("/admin/settings")
async def update_settings(body: dict) -> dict:
    for section, values in body.items():
        if section in store.SETTINGS and isinstance(values, dict):
            store.SETTINGS[section].update(values)
    return store.SETTINGS
