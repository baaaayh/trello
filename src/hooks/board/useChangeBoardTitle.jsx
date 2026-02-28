import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useChangeBoardTitle = (userId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, newTitle }) => {
      const numericBoardId = Number(boardId);

      const { data, error } = await supabase
        .from("boards")
        .update({ title: newTitle })
        .eq("id", numericBoardId)
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ boardId, newTitle }) => {
      const queryKey = ["boards", userId];
      const numericBoardId = Number(boardId);

      await queryClient.cancelQueries({ queryKey });
      const previousBoards = queryClient.getQueryData(queryKey);

      if (previousBoards) {
        queryClient.setQueryData(queryKey, (old) => {
          return old.map((board) =>
            Number(board.id) === numericBoardId
              ? { ...board, title: newTitle }
              : board,
          );
        });
      }
      return { previousBoards, queryKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["board", userId],
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(context.queryKey, context.previousBoards);
      }
      console.error("보드 제목 수정 실패: ", error.message);
    },
    onSettled: (data, error, { boardId }, context) => {
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
      queryClient.invalidateQueries({ queryKey: ["board", Number(boardId)] });
    },
  });
};
