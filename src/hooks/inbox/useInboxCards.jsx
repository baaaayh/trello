import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useInboxCards = (boardId, session) => {
  return useQuery({
    queryKey: ["inboxCards", Number(boardId)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox")
        .select(
          `
          id,
          position,
          created_at,
          card_id,
          cards!inner(
            title,
            desc,
            is_complete,
            is_archived,
            board_id,
            list_id
          )
        `,
        )
        .order("position", { ascending: true });

      if (error) throw error;

      return data.map((item) => ({
        inbox_item_id: item.id,
        inbox_position: item.position,
        created_at: item.created_at,
        card_id: item.card_id,
        id: item.card_id,
        title: item.cards.title,
        desc: item.cards.desc,
        is_complete: item.cards.is_complete,
        is_archived: item.cards.is_archived,
        board_id: item.cards.board_id,
        list_id: item.cards.list_id,
        is_inbox: true,
      }));
    },
    enabled: !!boardId && !!session,
  });
};
