import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useArchivedLists = (boardId) => {
  return useQuery({
    // boardId를 키에 추가하여 보드별로 캐시를 분리합니다.
    queryKey: ["archivedLists", Number(boardId)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("board_id", boardId) // 해당 보드의 데이터만
        .eq("is_archived", true) // 아카이브된 상태이고
        .is("deleted_at", null); // 소프트 딜리트 되지 않은 것만!

      if (error) throw error;
      return data;
    },
    // boardId가 없을 때는 쿼리를 실행하지 않도록 설정
    enabled: !!boardId,
  });
};
