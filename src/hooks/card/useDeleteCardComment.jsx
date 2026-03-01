import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useDeleteCardComment = (cardId) => {
  const queryClient = useQueryClient();
  const numericCardId = Number(cardId);

  return useMutation({
    mutationFn: async ({ commentId }) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onMutate: async ({ commentId }) => {
      const queryKey = ["comments", "card", numericCardId];
      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData(queryKey);

      // ✅ 낙관적으로 바로 제거
      queryClient.setQueryData(queryKey, (old = []) =>
        old.filter((comment) => comment.id !== commentId),
      );

      return { previousComments, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(context.queryKey, context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", "card", numericCardId],
      });
    },
  });
};
