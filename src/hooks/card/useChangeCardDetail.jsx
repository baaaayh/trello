import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useChangeCardDetail = (boardId, listId, cardId) => {
  const queryClient = useQueryClient();

  const numericBoardId = Number(boardId);
  const numericListId = Number(listId);
  const numericCardId = Number(cardId);

  return useMutation({
    mutationFn: async ({ descVal, titleVal, isComplete, isArchived }) => {
      const updatedData = {};
      if (titleVal !== undefined) updatedData.title = titleVal;
      if (descVal !== undefined) updatedData.desc = descVal;
      if (isComplete !== undefined) updatedData.is_complete = isComplete;
      if (isArchived !== undefined) updatedData.is_archived = isArchived;

      const { data, error } = await supabase
        .from("cards")
        .update(updatedData)
        .eq("id", numericCardId)
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async (newValues) => {
      const listQueryKey = ["cards", numericListId];
      const cardQueryKey = ["card", numericCardId];

      await queryClient.cancelQueries({ queryKey: listQueryKey });
      await queryClient.cancelQueries({ queryKey: cardQueryKey });

      const previousCards = queryClient.getQueryData(listQueryKey);

      if (previousCards) {
        queryClient.setQueryData(listQueryKey, (old) => {
          return old.map((card) =>
            Number(card.id) === numericCardId
              ? {
                  ...card,
                  ...(newValues.titleVal !== undefined && {
                    title: newValues.titleVal,
                  }),
                  ...(newValues.descVal !== undefined && {
                    desc: newValues.descVal,
                  }),
                  ...(newValues.isComplete !== undefined && {
                    is_complete: newValues.isComplete,
                  }),
                  ...(newValues.isArchived !== undefined && {
                    is_archived: newValues.isArchived,
                  }),
                }
              : card,
          );
        });
      }

      queryClient.setQueryData(cardQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          ...(newValues.titleVal !== undefined && {
            title: newValues.titleVal,
          }),
          ...(newValues.descVal !== undefined && { desc: newValues.descVal }),
          ...(newValues.isComplete !== undefined && {
            is_complete: newValues.isComplete,
          }),
          ...(newValues.isArchived !== undefined && {
            is_archived: newValues.isArchived,
          }),
        };
      });

      return { previousCards, listQueryKey };
    },
    onError: (err, newValues, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(context.listQueryKey, context.previousCards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["listsWithCards", numericBoardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inboxCards", numericBoardId],
      });
    },
  });
};
