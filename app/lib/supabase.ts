import { createClient } from "@supabase/supabase-js";

// Server publishable client (safe to use server-side with publishable key)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
