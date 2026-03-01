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
      // 이동 전 카드 정보 (from 정보 로그용)
      const { data: oldCard } = await supabase
        .from("cards")
        .select("list_id, board_id, position, title")
        .eq("id", cardId)
        .single();

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

      // ✅ 로그
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isInbox) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          board_id: destinationBoardId,
          list_id: destinationListId,
          card_id: cardId,
          action: "card.inbox.in",
          metadata: { title: oldCard.title },
        });
      } else {
        // list 이름도 같이 남기면 UI 표시에 유용
        const { data: lists } = await supabase
          .from("lists")
          .select("id, title")
          .in(
            "id",
            [oldCard.list_id, Number(destinationListId)].filter(Boolean),
          );

        const fromList = lists?.find((l) => l.id === oldCard.list_id);
        const toList = lists?.find((l) => l.id === destinationListId);

        await supabase.from("activity_logs").insert({
          user_id: user.id,
          board_id: Number(destinationBoardId), // ✅ Number로 변환
          list_id: Number(destinationListId), // ✅ Number로 변환
          card_id: Number(cardId), // ✅ Number로 변환
          action:
            oldCard.list_id === destinationListId
              ? "card.reordered"
              : "card.moved",
          metadata: {
            title: oldCard.title,
            from_list_id: oldCard.list_id,
            from_list_title: fromList?.title ?? null,
            to_list_id: destinationListId,
            to_list_title: toList?.title ?? null,
          },
        });
      }

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
      queryClient.invalidateQueries({
        queryKey: ["listsWithCards", Number(variables.destinationBoardId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["inboxCards", Number(variables.destinationBoardId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["activityLogs", "card", Number(variables.cardId)],
      });
    },
  });
};
