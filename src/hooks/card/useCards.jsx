import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useCards = (boardId, listId) => {
  const numericBoardId = Number(boardId);
  const numericListId = Number(listId);

  return useQuery({
    queryKey: ["cards", numericListId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("board_id", numericBoardId)
        .eq("list_id", numericListId)
        .is("deleted_at", null)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!numericListId,
  });
};
