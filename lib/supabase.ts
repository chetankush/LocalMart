import { createClient } from "./supabase/server";

export const createSupabaseClient = async () => {
  return await createClient();
};
