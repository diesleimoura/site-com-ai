import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const PROFILE_COLUMNS = [
  "id",
  "slug",
  "plan",
  "sites_created_this_month",
  "searches_used_this_month",
  "pix_key",
  "pix_key_type",
  "affiliate_active",
  "affiliate_code",
].join(",");

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useInvalidateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => qc.invalidateQueries({ queryKey: ["profile", user?.id] });
}
