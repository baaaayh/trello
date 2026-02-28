import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useListsWithCards = (boardId, session) => {
  const numericBoardId = Number(boardId);

  return useQuery({
    queryKey: ["listsWithCards", numericBoardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select(
          `
          *,
          cards (*) 
        `,
        )
        .eq("board_id", numericBoardId)
        .is("deleted_at", null)
        .order("position", { ascending: true })
        .order("position", { foreignTable: "cards", ascending: true });

      if (error) throw error;

      return data.map((list) => ({
        ...list,
        cards: (list.cards || []).filter(
          (card) => card.is_inbox === false || card.is_inbox === null,
        ),
      }));
    },
    enabled: !!boardId && !!session,
  });
};
