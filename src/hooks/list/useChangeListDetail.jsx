import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useChangeListDetail = (boardId, listId) => {
  const queryClient = useQueryClient();

  const numericBoardId = Number(boardId);
  const numericListId = Number(listId);

  return useMutation({
    mutationFn: async (query) => {
      const { data, error } = await supabase
        .from("lists")
        .update(query)
        .eq("id", numericListId)
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async (query) => {
      const queryKey = ["lists", boardId];

      await queryClient.cancelQueries({ queryKey });
      const previousLists = queryClient.getQueryData(queryKey);

      if (previousLists) {
        queryClient.setQueryData(queryKey, (old) => {
          return old.map((list) =>
            Number(list.id) === numericListId ? { ...list, ...query } : list,
          );
        });
      }
      return { previousLists, queryKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lists", numericBoardId],
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(context.queryKey, context.previousBoards);
      }
      console.error("보드 제목 수정 실패: ", error.message);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
      queryClient.invalidateQueries({ queryKey: ["lists", numericBoardId] });
    },
  });
};
