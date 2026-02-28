import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useUserProfile = (userId) => {
  return useQuery({
    queryKey: ["profiles", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      return data;
    },
  });
};
