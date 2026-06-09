"""In-memory mock data store for InvitePro.

Modeled on the platform spec so a real database can be swapped in later.
All data lives in process memory and resets when the server restarts.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta


def _id() -> str:
    return uuid.uuid4().hex[:12]


def _iso(days_offset: int = 0, hours: int = 0) -> str:
    return (datetime.utcnow() + timedelta(days=days_offset, hours=hours)).isoformat() + "Z"


# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------
PLANS = [
    {
        "id": "free",
        "name": "Free",
        "price": 0,
        "currency": "USD",
        "interval": "month",
        "event_limit": 1,
        "invitee_limit": 50,
        "message_limit": 100,
        "features": ["1 event", "50 invitees", "Basic templates", "Email sending"],
    },
    {
        "id": "pro",
        "name": "Pro",
        "price": 29,
        "currency": "USD",
        "interval": "month",
        "event_limit": 10,
        "invitee_limit": 2000,
        "message_limit": 10000,
        "features": [
            "10 events",
            "2,000 invitees",
            "Premium templates",
            "SMS + WhatsApp + Email",
            "Custom branding",
            "QR check-in",
        ],
    },
    {
        "id": "business",
        "name": "Business",
        "price": 99,
        "currency": "USD",
        "interval": "month",
        "event_limit": -1,
        "invitee_limit": -1,
        "message_limit": -1,
        "features": [
            "Unlimited events",
            "Unlimited invitees",
            "All templates",
            "Priority delivery",
            "Team seats",
            "API access",
            "Dedicated support",
        ],
    },
]


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
USERS = [
    {
        "id": "usr_admin",
        "name": "Platform Admin",
        "email": "admin@invitepro.app",
        "role": "admin",
        "plan_id": "business",
        "status": "active",
        "company": "InvitePro",
        "created_at": _iso(-220),
        "avatar": None,
    },
    {
        "id": "usr_agent",
        "name": "Amara Okafor",
        "email": "amara@bloomevents.co",
        "role": "agent",
        "plan_id": "pro",
        "status": "active",
        "company": "Bloom Events Co.",
        "created_at": _iso(-90),
        "avatar": None,
    },
    {
        "id": "usr_3",
        "name": "Daniel Mensah",
        "email": "daniel@regalplanners.com",
        "role": "agent",
        "plan_id": "free",
        "status": "active",
        "company": "Regal Planners",
        "created_at": _iso(-40),
        "avatar": None,
    },
    {
        "id": "usr_4",
        "name": "Sofia Romano",
        "email": "sofia@celebrazione.it",
        "role": "agent",
        "plan_id": "business",
        "status": "active",
        "company": "Celebrazione",
        "created_at": _iso(-160),
        "avatar": None,
    },
    {
        "id": "usr_5",
        "name": "Kwame Asante",
        "email": "kwame@goldcoastgala.com",
        "role": "agent",
        "plan_id": "pro",
        "status": "suspended",
        "company": "Gold Coast Gala",
        "created_at": _iso(-75),
        "avatar": None,
    },
]


# ---------------------------------------------------------------------------
# Events (owned by usr_agent)
# ---------------------------------------------------------------------------
EVENTS = [
    {
        "id": "evt_1",
        "owner_id": "usr_agent",
        "title": "Amara & Tunde — Wedding Celebration",
        "type": "Wedding",
        "description": "An evening of love, music and dancing as we tie the knot.",
        "venue": "The Grand Atrium, Lagos",
        "address": "12 Marina Road, Lagos Island",
        "starts_at": _iso(34, 10),
        "status": "active",
        "cover_color": "#7c3aed",
        "created_at": _iso(-30),
    },
    {
        "id": "evt_2",
        "owner_id": "usr_agent",
        "title": "TechFlow Annual Product Summit",
        "type": "Corporate",
        "description": "Keynotes, breakout sessions and a networking gala.",
        "venue": "Convention Centre Hall B",
        "address": "5 Innovation Drive, Accra",
        "starts_at": _iso(12, 9),
        "status": "active",
        "cover_color": "#0d9488",
        "created_at": _iso(-18),
    },
    {
        "id": "evt_3",
        "owner_id": "usr_agent",
        "title": "Zara's 30th Birthday Soirée",
        "type": "Birthday",
        "description": "A glamorous black & gold themed birthday dinner.",
        "venue": "Skyline Rooftop Lounge",
        "address": "88 Highrise Ave",
        "starts_at": _iso(-6, 19),
        "status": "completed",
        "cover_color": "#d97706",
        "created_at": _iso(-45),
    },
]


# ---------------------------------------------------------------------------
# Invitees
# ---------------------------------------------------------------------------
_FIRST = ["Grace", "Michael", "Linda", "Samuel", "Priya", "Carlos", "Aisha", "Noah",
          "Fatima", "Liam", "Chen", "Olivia", "Ahmed", "Emma", "Tunde", "Yuki"]
_LAST = ["Adebayo", "Smith", "Johnson", "Patel", "Garcia", "Khan", "Nguyen", "Owusu",
         "Rossi", "Cohen", "Mensah", "Wong", "Ali", "Brown", "Diallo", "Tanaka"]
_GROUPS = ["Family", "Friends", "VIP", "Colleagues", "Plus One"]
_RSVP = ["pending", "accepted", "declined", "accepted", "accepted", "pending"]


def _seed_invitees() -> list[dict]:
    out: list[dict] = []
    counter = 0
    for evt in EVENTS:
        n = 14 if evt["id"] == "evt_1" else (9 if evt["id"] == "evt_2" else 6)
        for i in range(n):
            fn = _FIRST[counter % len(_FIRST)]
            ln = _LAST[(counter * 3) % len(_LAST)]
            rsvp = _RSVP[counter % len(_RSVP)]
            out.append({
                "id": _id(),
                "event_id": evt["id"],
                "owner_id": evt["owner_id"],
                "name": f"{fn} {ln}",
                "email": f"{fn.lower()}.{ln.lower()}@example.com",
                "phone": f"+1555{(1000000 + counter * 37) % 9000000:07d}",
                "group": _GROUPS[counter % len(_GROUPS)],
                "rsvp": rsvp,
                "guests": (counter % 3) + 1,
                "checked_in": rsvp == "accepted" and evt["status"] == "completed" and i % 2 == 0,
                "created_at": _iso(-int(counter / 2) - 1),
            })
            counter += 1
    return out


INVITEES = _seed_invitees()


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
def _default_layers(title: str, accent: str) -> list[dict]:
    return [
        {"id": _id(), "type": "shape", "shape": "rect", "x": 0, "y": 0, "w": 600, "h": 800,
         "fill": "#faf5ff", "rotation": 0},
        {"id": _id(), "type": "shape", "shape": "rect", "x": 40, "y": 40, "w": 520, "h": 720,
         "fill": "transparent", "stroke": accent, "strokeWidth": 2, "rotation": 0},
        {"id": _id(), "type": "text", "text": "YOU ARE INVITED", "x": 120, "y": 110, "w": 360,
         "h": 40, "fontSize": 20, "fontFamily": "sans", "color": accent, "align": "center",
         "weight": "600", "letterSpacing": 6, "rotation": 0},
        {"id": _id(), "type": "text", "text": title, "x": 80, "y": 280, "w": 440, "h": 120,
         "fontSize": 52, "fontFamily": "serif", "color": "#1f2937", "align": "center",
         "weight": "700", "rotation": 0},
        {"id": _id(), "type": "text", "text": "{{event_date}}", "x": 120, "y": 470, "w": 360,
         "h": 40, "fontSize": 22, "fontFamily": "sans", "color": "#4b5563", "align": "center",
         "weight": "400", "rotation": 0},
        {"id": _id(), "type": "text", "text": "{{venue}}", "x": 120, "y": 520, "w": 360,
         "h": 40, "fontSize": 18, "fontFamily": "sans", "color": "#6b7280", "align": "center",
         "weight": "400", "rotation": 0},
        {"id": _id(), "type": "variable", "text": "{{guest_name}}", "x": 120, "y": 200, "w": 360,
         "h": 36, "fontSize": 18, "fontFamily": "sans", "color": accent, "align": "center",
         "weight": "500", "rotation": 0},
        {"id": _id(), "type": "qr", "x": 250, "y": 620, "w": 100, "h": 100, "rotation": 0},
    ]


TEMPLATES = [
    {
        "id": "tpl_1",
        "owner_id": "usr_agent",
        "name": "Royal Wedding — Lavender",
        "category": "Wedding",
        "is_premium": True,
        "thumbnail_color": "#7c3aed",
        "width": 600,
        "height": 800,
        "background": "#faf5ff",
        "layers": _default_layers("Amara\n&\nTunde", "#7c3aed"),
        "updated_at": _iso(-3),
    },
    {
        "id": "tpl_2",
        "owner_id": "usr_agent",
        "name": "Modern Corporate — Teal",
        "category": "Corporate",
        "is_premium": False,
        "thumbnail_color": "#0d9488",
        "width": 600,
        "height": 800,
        "background": "#f0fdfa",
        "layers": _default_layers("Product\nSummit", "#0d9488"),
        "updated_at": _iso(-7),
    },
    {
        "id": "tpl_3",
        "owner_id": "usr_agent",
        "name": "Birthday Gold Glam",
        "category": "Birthday",
        "is_premium": True,
        "thumbnail_color": "#d97706",
        "width": 600,
        "height": 800,
        "background": "#fffbeb",
        "layers": _default_layers("Zara is\n30!", "#d97706"),
        "updated_at": _iso(-1),
    },
    {
        "id": "tpl_4",
        "owner_id": "system",
        "name": "Minimal Botanical",
        "category": "Wedding",
        "is_premium": False,
        "thumbnail_color": "#65a30d",
        "width": 600,
        "height": 800,
        "background": "#f7fee7",
        "layers": _default_layers("Save the\nDate", "#65a30d"),
        "updated_at": _iso(-12),
    },
    {
        "id": "tpl_5",
        "owner_id": "system",
        "name": "Elegant Noir",
        "category": "Gala",
        "is_premium": True,
        "thumbnail_color": "#1f2937",
        "width": 600,
        "height": 800,
        "background": "#f9fafb",
        "layers": _default_layers("Annual\nGala", "#1f2937"),
        "updated_at": _iso(-20),
    },
    {
        "id": "tpl_6",
        "owner_id": "system",
        "name": "Festive Confetti",
        "category": "Birthday",
        "is_premium": False,
        "thumbnail_color": "#db2777",
        "width": 600,
        "height": 800,
        "background": "#fdf2f8",
        "layers": _default_layers("Let's\nCelebrate", "#db2777"),
        "updated_at": _iso(-9),
    },
]


# ---------------------------------------------------------------------------
# Invitation campaigns
# ---------------------------------------------------------------------------
CAMPAIGNS = [
    {
        "id": "cmp_1",
        "owner_id": "usr_agent",
        "event_id": "evt_1",
        "template_id": "tpl_1",
        "name": "Wedding — First Wave",
        "channel": "whatsapp",
        "status": "completed",
        "total": 14,
        "sent": 14,
        "delivered": 13,
        "failed": 1,
        "opened": 11,
        "created_at": _iso(-10),
    },
    {
        "id": "cmp_2",
        "owner_id": "usr_agent",
        "event_id": "evt_2",
        "template_id": "tpl_2",
        "name": "Summit — Save the Date",
        "channel": "email",
        "status": "sending",
        "total": 9,
        "sent": 6,
        "delivered": 5,
        "failed": 0,
        "opened": 3,
        "created_at": _iso(-2),
    },
]


# ---------------------------------------------------------------------------
# Payments (manual approval queue)
# ---------------------------------------------------------------------------
PAYMENTS = [
    {
        "id": "pay_1",
        "user_id": "usr_3",
        "user_name": "Daniel Mensah",
        "plan_id": "pro",
        "amount": 29,
        "currency": "USD",
        "method": "Bank Transfer",
        "reference": "TRX-88210",
        "status": "pending",
        "created_at": _iso(-1),
    },
    {
        "id": "pay_2",
        "user_id": "usr_5",
        "user_name": "Kwame Asante",
        "plan_id": "business",
        "amount": 99,
        "currency": "USD",
        "method": "Mobile Money",
        "reference": "MOMO-44021",
        "status": "pending",
        "created_at": _iso(-3),
    },
    {
        "id": "pay_3",
        "user_id": "usr_4",
        "user_name": "Sofia Romano",
        "plan_id": "business",
        "amount": 99,
        "currency": "USD",
        "method": "Card",
        "reference": "CARD-90122",
        "status": "approved",
        "created_at": _iso(-30),
    },
]


# ---------------------------------------------------------------------------
# System logs
# ---------------------------------------------------------------------------
LOGS = [
    {"id": _id(), "level": "info", "actor": "amara@bloomevents.co",
     "action": "campaign.completed", "detail": "Wedding — First Wave delivered to 13/14", "at": _iso(0, -2)},
    {"id": _id(), "level": "warning", "actor": "system",
     "action": "message.failed", "detail": "WhatsApp delivery failed for +15551000259", "at": _iso(0, -3)},
    {"id": _id(), "level": "info", "actor": "daniel@regalplanners.com",
     "action": "payment.submitted", "detail": "Bank transfer TRX-88210 for Pro plan", "at": _iso(-1)},
    {"id": _id(), "level": "info", "actor": "admin@invitepro.app",
     "action": "payment.approved", "detail": "Approved CARD-90122 for Sofia Romano", "at": _iso(-2)},
    {"id": _id(), "level": "error", "actor": "system",
     "action": "auth.failed", "detail": "5 failed login attempts for unknown@spam.io", "at": _iso(-2, -4)},
    {"id": _id(), "level": "info", "actor": "kwame@goldcoastgala.com",
     "action": "user.suspended", "detail": "Account suspended pending review", "at": _iso(-4)},
]


# ---------------------------------------------------------------------------
# Platform settings
# ---------------------------------------------------------------------------
SETTINGS = {
    "platform": {
        "name": "InvitePro",
        "support_email": "support@invitepro.app",
        "default_currency": "USD",
        "signups_enabled": True,
        "maintenance_mode": False,
    },
    "integrations": {
        "twilio_sms": {"enabled": False, "status": "not_configured"},
        "twilio_whatsapp": {"enabled": False, "status": "not_configured"},
        "email_smtp": {"enabled": True, "status": "active"},
        "cloud_storage": {"enabled": True, "status": "active", "provider": "Cloudinary"},
    },
    "security": {
        "enforce_2fa": False,
        "session_timeout_minutes": 120,
        "password_min_length": 8,
    },
}
