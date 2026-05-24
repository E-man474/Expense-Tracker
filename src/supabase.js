import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://kkjxnlkfkwvjdtzozfws.supabase.co";

const supabaseAnonKey =
  "sb_publishable_u-J5D-ZZ4UGnAJUNLM8RCw_azOOOv_k";

export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey
  );