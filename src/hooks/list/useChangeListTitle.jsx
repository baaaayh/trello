import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useChangeListTitle = (boardId) => {
  const queryClient = useQueryClient();

  const numericBoardId = Number(boardId);

  return useMutation({
    mutationFn: async ({ listId, newTitle }) => {
      const numericListId = Number(listId);

      const { data, error } = await supabase
        .from("lists")
        .update({ title: newTitle })
        .eq("id", numericListId)
        .eq("board_id", numericBoardId)
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ listId, newTitle }) => {
      const queryKey = ["lists", numericBoardId];
      const numericListId = Number(listId);

      await queryClient.cancelQueries({ queryKey });
      const previousLists = queryClient.getQueryData(queryKey);

      if (previousLists) {
        queryClient.setQueryData(queryKey, (old) => {
          return old.map((list) =>
            Number(list.id) === numericListId
              ? { ...list, title: newTitle }
              : list,
          );
        });
      }

      return { previousLists, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(context.queryKey, context.previousLists);
      }
      console.error("리스트 수정 실패 : ", error.message);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
    },
  });
};
