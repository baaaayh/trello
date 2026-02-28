import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useRestoreArchivedItem = (boardId) => {
  const queryClient = useQueryClient();

  const numericBoardId = Number(boardId);

  return useMutation({
    mutationFn: async ({ id, itemType }) => {
      const table = itemType === "lists" ? "lists" : "cards";

      // .delete()가 아니라 .update()를 사용해야 합니다.
      const { data, error } = await supabase
        .from(table)
        .update({ is_archived: false }) // 아카이브 상태 해제
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { id, itemType, data };
    },
    onSuccess: async () => {
      // 1. 아카이브 목록 쿼리 무효화 (목록에서 사라짐)
      queryClient.invalidateQueries({
        queryKey: ["archivedLists"],
      });
      queryClient.invalidateQueries({
        queryKey: ["archivedCards"],
      });

      // 2. 보드 데이터 쿼리 무효화 (보드에 다시 나타남)
      await queryClient.refetchQueries({
        queryKey: ["listsWithCards", numericBoardId],
      });
    },
    onError: (error) => {
      alert("복구에 실패했습니다: " + error.message);
    },
  });
};
