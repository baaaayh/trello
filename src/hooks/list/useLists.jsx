import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useLists = (boardId) => {
  const numericBoardId = Number(boardId);
  return useQuery({
    queryKey: ["lists", numericBoardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("board_id", numericBoardId)
        .is("deleted_at", null)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!numericBoardId,
  });
};
