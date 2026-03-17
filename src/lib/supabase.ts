import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Establishment {
  id: string
  user_id: string
  name: string
  address: string | null
  city: string | null
  category: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  satisfaction_threshold: number
  redirect_url: string | null
  routing_question: string
  rating_format: string
  // Parametrage IA (CDC 7.8 : voix de marque complete)
  ai_tone: string
  ai_instructions: string | null
  ai_preferred_expressions: string | null
  ai_avoid_expressions: string | null
  ai_response_length: string
  ai_positive_style: string | null
  ai_negative_style: string | null
  ai_rules: string | null
  // Google Business Profile (CDC 10)
  google_place_id: string | null
  google_access_token: string | null
  google_refresh_token: string | null
  google_token_expires_at: string | null
  google_account_email: string | null
  google_business_name: string | null
  google_last_sync: string | null
  google_connection_status: string
  current_google_rating: number | null
  total_google_reviews: number
  is_active: boolean
  created_at: string
}

export interface Plate {
  id: string
  code: string
  establishment_id: string | null
  label: string | null
  plate_type: string // 'nfc' | 'qr'
  is_active: boolean
  activated_at: string | null
  created_at: string
}

export interface Scan {
  id: string
  plate_id: string
  establishment_id: string | null
  rating_given: number | null
  result: string // 'redirect' | 'feedback'
  plate_type: string | null
  created_at: string
}

export interface Feedback {
  id: string
  scan_id: string | null
  establishment_id: string
  plate_id: string | null
  rating: number | null
  comment: string | null
  client_first_name: string | null
  client_email: string | null
  client_phone: string | null
  source_plate_code: string | null
  status: string // 'unread' | 'read' | 'treated'
  created_at: string
}

export interface GoogleReview {
  id: string
  establishment_id: string
  google_review_id: string | null
  author_name: string | null
  rating: number | null
  comment: string | null
  review_date: string | null
  ai_suggested_reply: string | null
  final_reply: string | null
  reply_status: string // 'pending' | 'ai_generated' | 'published' | 'ignored'
  replied_at: string | null
  created_at: string
}

export interface Affiliate {
  id: string
  user_id: string
  referral_code: string
  referral_link: string | null
  commission_rate: number
  commission_duration_months: number
  total_earned: number
  iban: string | null
  is_active: boolean
}
