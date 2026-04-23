import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Pick<
  Tables<"profiles">,
  | "id"
  | "slug"
  | "plan"
  | "sites_created_this_month"
  | "searches_used_this_month"
  | "pix_key"
  | "pix_key_type"
  | "affiliate_active"
  | "affiliate_code"
>;

const PROFILE_COLUMNS =
  "id,slug,plan,sites_created_this_month,searches_used_this_month,pix_key,pix_key_type,affiliate_active,affiliate_code";

export function useProfile() {
  const { user } = useAuth();
  return useQuery<Profile | null>({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", user!.id)
        .single<Profile>();
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
