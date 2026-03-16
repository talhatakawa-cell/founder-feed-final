import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zznxbmhlvarkajkkuhqi.supabase.co";
const supabaseKey = "sb_publishable_V9RGqaMWQY-lyR9pB_TQVA_raY0iRYw";

export const supabase = createClient(supabaseUrl, supabaseKey);