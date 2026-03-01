import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useUpdateCardComment = (cardId) => {
  const queryClient = useQueryClient();
  const numericCardId = Number(cardId);

  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      const { data, error } = await supabase
        .from("comments")
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .select(
          `
          id,
          content,
          is_edited,
          created_at,
          updated_at,
          user_id,
          action,
          profiles (
            user_name
          )
        `,
        )
        .single();

      if (error) throw error;

      return {
        ...data,
        user_name: data.profiles?.user_name ?? "알 수 없음",
      };
    },
    onMutate: async ({ commentId, content }) => {
      const queryKey = ["comments", "card", numericCardId];
      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old = []) =>
        old.map((comment) =>
          comment.id === commentId
            ? { ...comment, content, is_edited: true }
            : comment,
        ),
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
