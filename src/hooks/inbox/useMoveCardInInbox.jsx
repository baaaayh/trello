import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useMoveCardInInbox = (boardId) => {
  const queryClient = useQueryClient();
  const numericBoardId = Number(boardId);

  return useMutation({
    mutationFn: async ({
      cardId,
      destinationListId,
      newPosition,
      inboxPosition,
      type,
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 로그용 카드 정보 미리 조회
      const { data: cardInfo } = await supabase
        .from("cards")
        .select("title, list_id, board_id")
        .eq("id", cardId)
        .single();

      if (type === "ENTER_INBOX") {
        await supabase
          .from("cards")
          .update({ is_inbox: true, inbox_position: newPosition })
          .eq("id", cardId);

        const result = await supabase
          .from("inbox")
          .insert({ card_id: cardId, position: newPosition });

        // ✅ 로그
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          board_id: numericBoardId,
          list_id: cardInfo?.list_id,
          card_id: cardId,
          action: "card.inbox.transferred.in",
          metadata: { title: cardInfo?.title },
        });

        return result;
      }

      if (type === "MOVE_WITHIN_INBOX") {
        const result = await supabase
          .from("inbox")
          .update({ position: newPosition })
          .eq("card_id", cardId);

        // ✅ 로그
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          board_id: numericBoardId,
          card_id: cardId,
          action: "card.inbox.transferred.inner",
          metadata: { title: cardInfo?.title, new_position: newPosition },
        });

        return result;
      }

      if (type === "EXIT_INBOX") {
        await supabase.from("inbox").delete().eq("card_id", cardId);

        const result = await supabase
          .from("cards")
          .update({
            list_id: destinationListId,
            position: newPosition,
            inbox_position: inboxPosition,
            is_inbox: false,
          })
          .eq("id", cardId);

        // 목적지 list 이름 조회
        const { data: listInfo } = await supabase
          .from("lists")
          .select("title")
          .eq("id", destinationListId)
          .single();

        // ✅ 로그
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          board_id: numericBoardId,
          list_id: destinationListId,
          card_id: cardId,
          action: "card.inbox.transferred.out",
          metadata: {
            title: cardInfo?.title,
            to_list_id: destinationListId,
            to_list_title: listInfo?.title ?? null,
          },
        });
        return result;
      }
    },
    onMutate: async ({ cardId, destinationListId, newPosition, type }) => {
      const listsKey = ["listsWithCards", numericBoardId];
      const inboxKey = ["inboxCards", numericBoardId];

      await queryClient.cancelQueries({ queryKey: listsKey });
      await queryClient.cancelQueries({ queryKey: inboxKey });

      const previousLists = queryClient.getQueryData(listsKey);
      const previousInbox = queryClient.getQueryData(inboxKey);

      // ✅ setQueryData 호출 전에 미리 카드 데이터 찾기
      let cardData = null;
      for (const list of previousLists ?? []) {
        cardData = list.cards?.find((c) => c.id === cardId);
        if (cardData) break;
      }
      // EXIT_INBOX의 경우 previousInbox에서 찾기
      if (!cardData) {
        cardData = (previousInbox ?? []).find((c) => c.id === cardId);
      }

      if (type === "ENTER_INBOX") {
        queryClient.setQueryData(listsKey, (oldLists) => {
          if (!oldLists) return [];
          return oldLists.map((list) => ({
            ...list,
            cards: list.cards.filter((c) => c.id !== cardId),
          }));
        });

        queryClient.setQueryData(inboxKey, (oldInbox) => {
          const prev = oldInbox ?? [];
          const newCard = {
            ...cardData, // ✅ 미리 찾아둔 cardData 사용
            is_inbox: true,
            inbox_position: newPosition,
          };
          return [...prev.filter((c) => c.id !== cardId), newCard].sort(
            (a, b) => a.inbox_position - b.inbox_position,
          );
        });
      }

      if (type === "EXIT_INBOX") {
        queryClient.setQueryData(inboxKey, (oldInbox) =>
          (oldInbox ?? []).filter((c) => c.id !== cardId),
        );

        queryClient.setQueryData(listsKey, (oldLists) => {
          if (!oldLists) return [];
          const newCard = {
            ...cardData, // ✅ 미리 찾아둔 cardData 사용
            is_inbox: false,
            list_id: destinationListId,
            position: newPosition,
          };
          return oldLists.map((list) => {
            if (list.id !== destinationListId) return list;
            return {
              ...list,
              cards: [
                ...list.cards.filter((c) => c.id !== cardId),
                newCard,
              ].sort((a, b) => a.position - b.position),
            };
          });
        });
      }

      if (type === "MOVE_WITHIN_INBOX") {
        queryClient.setQueryData(inboxKey, (oldInbox) => {
          if (!oldInbox) return [];
          return oldInbox
            .map((c) =>
              c.id === cardId ? { ...c, inbox_position: newPosition } : c,
            )
            .sort((a, b) => a.inbox_position - b.inbox_position);
        });
      }

      return { previousLists, previousInbox };
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(
          ["listsWithCards", numericBoardId],
          context.previousLists,
        );
      }
      if (context?.previousInbox) {
        queryClient.setQueryData(
          ["inboxCards", numericBoardId],
          context.previousInbox,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["listsWithCards", numericBoardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inboxCards", numericBoardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activityLogs", "card", Number(variables.cardId)],
      });
    },
  });
};
