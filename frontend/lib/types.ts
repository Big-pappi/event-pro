// Shared TypeScript types mirroring the FastAPI backend models.

export type Role = 'agent' | 'admin'

export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  event_limit: number
  invitee_limit: number
  message_limit: number
  features: string[]
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  plan_id: string
  status: 'active' | 'suspended'
  company: string
  created_at: string
  avatar: string | null
  plan_name?: string
  events?: number
}

export type EventStatus = 'draft' | 'active' | 'completed'

export interface EventItem {
  id: string
  owner_id: string
  title: string
  type: string
  description: string
  venue: string
  address: string
  starts_at: string
  status: EventStatus
  cover_color: string
  created_at: string
  invitee_count?: number
  rsvp?: RsvpBreakdown
}

export interface RsvpBreakdown {
  accepted: number
  pending: number
  declined: number
}

export type RsvpStatus = 'pending' | 'accepted' | 'declined'

export interface Invitee {
  id: string
  owner_id: string
  event_id: string
  name: string
  email: string
  phone: string
  group: string
  rsvp: RsvpStatus
  guests: number
  checked_in: boolean
  created_at: string
}

export type LayerType = 'text' | 'image' | 'shape' | 'qr' | 'variable'

export interface Layer {
  id: string
  type: LayerType
  x: number
  y: number
  w: number
  h: number
  rotation: number
  // text / variable
  text?: string
  fontSize?: number
  fontFamily?: 'sans' | 'serif'
  color?: string
  align?: 'left' | 'center' | 'right'
  weight?: string
  letterSpacing?: number
  // shape
  shape?: 'rect' | 'circle'
  fill?: string
  stroke?: string
  strokeWidth?: number
  // image
  src?: string
  locked?: boolean
}

export interface Template {
  id: string
  owner_id: string
  name: string
  category: string
  is_premium: boolean
  thumbnail_color: string
  width: number
  height: number
  background: string
  layers: Layer[]
  updated_at: string
}

export interface Campaign {
  id: string
  owner_id: string
  event_id: string
  template_id: string
  name: string
  channel: 'whatsapp' | 'sms' | 'email'
  status: 'sending' | 'completed'
  total: number
  sent: number
  delivered: number
  failed: number
  opened: number
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  user_name: string
  plan_id: string
  amount: number
  currency: string
  method: string
  reference: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  plan_name?: string
}

export interface LogEntry {
  id: string
  level: 'info' | 'warning' | 'error'
  actor: string
  action: string
  detail: string
  at: string
}

export interface AgentStats {
  events_total: number
  events_active: number
  invitees_total: number
  rsvp: RsvpBreakdown
  messages_sent: number
  messages_delivered: number
  delivery_rate: number
  activity: { day: string; sent: number; opened: number }[]
  channels: { name: string; value: number }[]
}

export interface AdminStats {
  users_total: number
  users_active: number
  events_total: number
  messages_total: number
  mrr: number
  pending_payments: number
  plan_distribution: { name: string; value: number }[]
  revenue_trend: { month: string; mrr: number }[]
}

export interface Settings {
  platform: {
    name: string
    support_email: string
    default_currency: string
    signups_enabled: boolean
    maintenance_mode: boolean
  }
  integrations: Record<
    string,
    { enabled: boolean; status: string; provider?: string }
  >
  security: {
    enforce_2fa: boolean
    session_timeout_minutes: number
    password_min_length: number
  }
}
