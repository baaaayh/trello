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
      // type: 'ENTER_INBOX' | 'MOVE_WITHIN_INBOX' | 'EXIT_INBOX'
      if (type === "ENTER_INBOX") {
        // 1. cards 테이블의 list_id 제거 및 is_inbox를 true로 설정
        await supabase
          .from("cards")
          .update({
            // list_id: null,
            is_inbox: true, // ✅ 보드에서 인박스로 들어갈 때 true
            inbox_position: newPosition,
          })
          .eq("id", cardId);

        // 2. inbox 테이블에 레코드 추가
        return await supabase
          .from("inbox")
          .insert({ card_id: cardId, position: newPosition });
      }

      if (type === "MOVE_WITHIN_INBOX") {
        // inbox 테이블 내 순서(position)만 변경 (is_inbox는 이미 true이므로 수정 불필요)
        const result = await supabase
          .from("inbox")
          .update({ position: newPosition })
          .eq("card_id", cardId);
        return result;
      }

      if (type === "EXIT_INBOX") {
        // 1. inbox 테이블에서 레코드 제거
        await supabase.from("inbox").delete().eq("card_id", cardId);

        // 2. cards 테이블에 list_id 부여 및 is_inbox를 false로 설정
        return await supabase
          .from("cards")
          .update({
            list_id: destinationListId,
            position: newPosition,
            inbox_position: inboxPosition,
            is_inbox: false, // ✅ 인박스에서 나갈 때 false
          })
          .eq("id", cardId);
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

    onSettled: () => {
      queryClient.invalidateQueries(["listsWithCards", numericBoardId]);
      queryClient.invalidateQueries(["inboxCards", numericBoardId]);
    },
  });
};
