import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useAddCardComment = (boardId, listId, cardId) => {
  const queryClient = useQueryClient();
  const numericBoardId = Number(boardId);
  const numericCardId = Number(cardId);

  return useMutation({
    mutationFn: async ({ content }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("comments")
        .insert({
          card_id: numericCardId,
          board_id: numericBoardId,
          user_id: user.id,
          content,
          action: "comment",
        })
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
    onMutate: async ({ content }) => {
      const queryKey = ["comments", "card", numericCardId];
      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData(queryKey);

      const optimisticComment = {
        id: `optimistic-${Date.now()}`,
        card_id: numericCardId,
        board_id: numericBoardId,
        content,
        action: "comment",
        is_edited: false,
        created_at: new Date().toISOString(),
        user_name: "나",
      };

      queryClient.setQueryData(queryKey, (old = []) => [
        optimisticComment,
        ...old,
      ]);

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
