import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useCardComments = (cardId) => {
  const numericCardId = Number(cardId);

  return useQuery({
    queryKey: ["comments", "card", numericCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          action,
          is_edited,
          created_at,
          updated_at,
          user_id,
          profiles (
            user_name
          )
        `,
        )
        .eq("card_id", numericCardId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((comment) => ({
        ...comment,
        user_name: comment.profiles?.user_name ?? "알 수 없음",
      }));
    },
    enabled: !!numericCardId,
  });
};
