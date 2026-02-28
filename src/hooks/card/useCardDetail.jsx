import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useCardDetail = (boardId, listId, cardId) => {
  const numericBoardId = Number(boardId);
  const numericListId = Number(listId);
  const numericCardId = Number(cardId);

  return useQuery({
    queryKey: ["card", numericCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("board_id", numericBoardId)
        .eq("list_id", numericListId)
        .eq("id", numericCardId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!numericBoardId && !!numericListId && !!numericCardId,
  });
};
