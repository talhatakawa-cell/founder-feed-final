import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zznxbmhlvarkajkkuhqi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bnhibWhsdmFya2FqeGt1aHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjMxMjMsImV4cCI6MjA4OTE5OTEyM30.HFla80Dgiz05h7gq05K5gyxXVgtR1ShMAqlUjEKWrZA";

export const supabase = createClient(supabaseUrl, supabaseKey);