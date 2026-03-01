import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useCardDetail = (boardId, listId, cardId) => {
  const numericBoardId = Number(boardId);
  const numericCardId = Number(cardId);
  const isInbox = listId === "INBOX";
  const numericListId = isInbox ? null : Number(listId);

  return useQuery({
    queryKey: ["card", numericCardId],
    queryFn: async () => {
      let query = supabase
        .from("cards")
        .select("*")
        .eq("board_id", numericBoardId)
        .eq("id", numericCardId);

      if (!isInbox) {
        query = query.eq("list_id", numericListId);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled:
      !!numericBoardId && !!numericCardId && (isInbox || !!numericListId),
  });
};
