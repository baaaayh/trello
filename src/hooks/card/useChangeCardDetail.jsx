import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useChangeCardDetail = (boardId, listId, cardId) => {
  const queryClient = useQueryClient();
  const numericBoardId = Number(boardId);
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
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newValues) => {
      const listQueryKey = ["listsWithCards", numericBoardId];
      const cardQueryKey = ["card", numericCardId];
      const inboxQueryKey = ["inboxCards", numericBoardId];

      await Promise.all([
        queryClient.cancelQueries({ queryKey: listQueryKey }),
        queryClient.cancelQueries({ queryKey: cardQueryKey }),
        queryClient.cancelQueries({ queryKey: inboxQueryKey }),
      ]);

      const previousLists = queryClient.getQueryData(listQueryKey);
      const previousInbox = queryClient.getQueryData(inboxQueryKey);
      const previousCard = queryClient.getQueryData(cardQueryKey);

      const updateCardNode = (card) => ({
        ...card,
        ...(newValues.titleVal !== undefined && { title: newValues.titleVal }),
        ...(newValues.descVal !== undefined && { desc: newValues.descVal }),
        ...(newValues.isComplete !== undefined && {
          is_complete: newValues.isComplete,
        }),
        ...(newValues.isArchived !== undefined && {
          is_archived: newValues.isArchived,
        }),
      });

      // 낙관적 업데이트 로직 (동일)
      if (previousLists) {
        queryClient.setQueryData(listQueryKey, (old) =>
          old.map((list) => ({
            ...list,
            cards: list.cards?.map((card) =>
              Number(card.id) === numericCardId ? updateCardNode(card) : card,
            ),
          })),
        );
      }

      if (previousInbox) {
        queryClient.setQueryData(inboxQueryKey, (old) =>
          old.map((card) =>
            Number(card.id) === numericCardId ? updateCardNode(card) : card,
          ),
        );
      }

      if (previousCard) {
        queryClient.setQueryData(cardQueryKey, (old) => updateCardNode(old));
      }

      return { previousLists, previousInbox, previousCard };
    },
    onError: (err, newValues, context) => {
      if (context?.previousLists)
        queryClient.setQueryData(
          ["listsWithCards", numericBoardId],
          context.previousLists,
        );
      if (context?.previousInbox)
        queryClient.setQueryData(
          ["inboxCards", numericBoardId],
          context.previousInbox,
        );
      if (context?.previousCard)
        queryClient.setQueryData(["card", numericCardId], context.previousCard);
    },
    onSuccess: (updatedCard) => {
      // ✅ 서버에서 받아온 실제 데이터로 캐시를 최종 업데이트 (서버 응답 구조에 맞게)
      queryClient.setQueryData(["inboxCards", numericBoardId], (old) => {
        return old?.map((card) =>
          card.id === updatedCard.id ? updatedCard : card,
        );
      });

      queryClient.setQueryData(["listsWithCards", numericBoardId], (old) => {
        return old?.map((list) => ({
          ...list,
          cards: list.cards?.map((card) =>
            card.id === updatedCard.id ? updatedCard : card,
          ),
        }));
      });
    },
  });
};
