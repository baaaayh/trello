import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useMoveList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, newPosition }) => {
      // throw new Error("업데이트 실패 테스트");
      const { data, error } = await supabase
        .from("lists")
        .update({ position: newPosition })
        .eq("id", listId)
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ boardId, listId, newPosition }) => {
      const numericBoardId = Number(boardId);
      const queryKey = ["listsWithCards", numericBoardId];

      await queryClient.cancelQueries({ queryKey });
      const previousLists = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return [];

        return old
          .map((list) =>
            list.id === listId ? { ...list, position: newPosition } : list,
          )
          .sort((a, b) => a.position - b.position);
      });

      return { previousLists };
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(
          ["listsWithCards", Number(variables.boardId)],
          context.previousLists,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["listsWithCards", Number(variables.boardId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["lists", Number(variables.boardId)],
      });
    },
  });
};
