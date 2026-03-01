import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";
export const useCardLogs = (cardId) => {
  const numericCardId = Number(cardId);

  return useQuery({
    queryKey: ["activityLogs", "card", numericCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          `
          id,
          action,
          metadata,
          created_at,
          user_id,
          profiles (
            user_name
          )
        `,
        )
        .eq("card_id", numericCardId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((log) => ({
        ...log,
        user_name: log.profiles?.user_name ?? "알 수 없음",
      }));
    },
    enabled: !!numericCardId,
  });
};
