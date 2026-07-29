import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "xrwnrdsymxgkpmhbddn";
export const supabaseUrl = `https://${PROJECT_REF}.supabase.co`;
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyd25yZHN5eW14Z2twbWhiZGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTE0MTMsImV4cCI6MjA5MTQyNzQxM30.r2E3yDUCqdmmoESr-P8ifGmRw6TXZAWzYGlVDCD-CHk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
