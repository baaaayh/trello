import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useDeleteArchivedItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, itemType }) => {
      // itemType이 "list"면 lists 테이블, 아니면 cards 테이블에서 삭제
      const table = itemType === "lists" ? "lists" : "cards";

      console.log(table, id);

      const { data, error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select();

      if (error) throw error;
      return { id, itemType, data };
    },
    onSuccess: ({ itemType }) => {
      // 삭제 성공 시 아카이브 리스트 쿼리를 무효화하여 최신화
      if (itemType === "lists") {
        queryClient.invalidateQueries({ queryKey: ["archivedLists"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["archivedCards"] });
      }
    },
    onError: (error) => {
      alert("삭제에 실패했습니다: " + error.message);
    },
  });
};
