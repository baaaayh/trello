import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useBoards = (userId) => {
  return useQuery({
    queryKey: ["boards", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
