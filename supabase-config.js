// supabase-config.js
// Config กลางของ Supabase — ใช้ร่วมกันทุกหน้า (login, register, elderly-home,
// caregiver-dashboard, medical-dashboard)
//
// ต้องโหลด SDK (@supabase/supabase-js@2) ก่อนไฟล์นี้เสมอ เพราะไฟล์นี้ใช้ window.supabase

const SUPABASE_URL = "https://vboyxvlhztdrtswfuhzw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Wa3BSlPrINmpC9Xgw0EEcg_uGb319o-";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);