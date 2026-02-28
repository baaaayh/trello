import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useMoveCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      destinationBoardId,
      destinationListId,
      newPosition,
      isInbox,
      inboxPosition,
    }) => {
      const { data, error } = await supabase
        .from("cards")
        .update({
          board_id: destinationBoardId,
          list_id: destinationListId,
          position: newPosition,
          is_inbox: isInbox,
          inbox_position: inboxPosition,
        })
        .eq("id", cardId)
        .select();
      if (error) throw error;
      return data;
    },

    onMutate: async (variables) => {
      const {
        cardId,
        destinationBoardId,
        destinationListId,
        newPosition,
        isInbox,
      } = variables;

      // 1. 보드 리스트와 인박스 쿼리 키 설정
      const boardQueryKey = ["listsWithCards", Number(destinationBoardId)];
      const inboxQueryKey = ["inboxCards", Number(destinationBoardId)];

      // 2. 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: boardQueryKey });
      await queryClient.cancelQueries({ queryKey: inboxQueryKey });

      // 3. 이전 데이터 스냅샷 저장
      const previousLists = queryClient.getQueryData(boardQueryKey);
      const previousInbox = queryClient.getQueryData(inboxQueryKey);

      // --- [낙관적 업데이트: Board Lists] ---
      queryClient.setQueryData(boardQueryKey, (oldLists) => {
        if (!oldLists) return [];

        // 카드 원본 데이터 찾기 (깜빡임 방지용)
        let movedCardOriginal = null;
        for (const list of oldLists) {
          const found = list.cards.find((c) => c.id === cardId);
          if (found) {
            movedCardOriginal = found;
            break;
          }
        }

        return oldLists.map((list) => {
          // 일단 모든 리스트에서 해당 카드를 제거
          let updatedCards = list.cards.filter((c) => c.id !== cardId);

          // 이동 목적지 리스트이고, 인박스로 가는 것이 아닐 때만 카드 추가
          if (list.id === destinationListId && !isInbox) {
            updatedCards.push({
              ...movedCardOriginal,
              id: cardId,
              list_id: destinationListId,
              position: newPosition,
              is_inbox: false,
            });
            updatedCards.sort((a, b) => a.position - b.position);
          }

          return { ...list, cards: updatedCards };
        });
      });

      return { previousLists, previousInbox, destinationBoardId };
    },

    onError: (err, variables, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousLists) {
        queryClient.setQueryData(
          ["listsWithCards", Number(context.destinationBoardId)],
          context.previousLists,
        );
      }
      if (context?.previousInbox) {
        queryClient.setQueryData(
          ["inboxCards", Number(context.destinationBoardId)],
          context.previousInbox,
        );
      }
    },

    onSettled: (data, error, variables) => {
      // 성공/실패 여부와 상관없이 서버와 동기화
      queryClient.invalidateQueries([
        "listsWithCards",
        Number(variables.destinationBoardId),
      ]);
      queryClient.invalidateQueries([
        "inboxCards",
        Number(variables.destinationBoardId),
      ]);
    },
  });
};
