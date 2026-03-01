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

      // 변경 전 값 가져오기 (old 값 로그용)
      const { data: oldCard } = await supabase
        .from("cards")
        .select("title, desc, is_complete, is_archived")
        .eq("id", numericCardId)
        .single();

      const { data, error } = await supabase
        .from("cards")
        .update(updatedData)
        .eq("id", numericCardId)
        .select()
        .single();

      if (error) throw error;

      // ✅ 어떤 필드가 바뀌었는지에 따라 action 분기
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const logs = [];

      if (titleVal !== undefined)
        logs.push({
          action: "card.updated.title",
          metadata: { old: oldCard.title, new: titleVal },
        });
      if (descVal !== undefined)
        logs.push({
          action: "card.updated.desc",
          metadata: { old: oldCard.desc, new: descVal },
        });
      if (isComplete !== undefined)
        logs.push({
          action: isComplete ? "card.completed" : "card.uncompleted",
          metadata: {},
        });
      if (isArchived !== undefined)
        logs.push({
          action: isArchived ? "card.archived" : "card.unarchived",
          metadata: {},
        });

      if (logs.length > 0) {
        await supabase.from("activity_logs").insert(
          logs.map((log) => ({
            user_id: user.id,
            board_id: numericBoardId,
            card_id: numericCardId,
            ...log,
          })),
        );
      }

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
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["listsWithCards", numericBoardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inboxCards", numericBoardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["card", numericCardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["archivedCards"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activityLogs", "card", numericCardId],
      });
    },
  });
};
