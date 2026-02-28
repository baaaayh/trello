import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useAddCardInInbox = (boardId) => {
  const queryClient = useQueryClient();
  const GAP = 65536;
  const numericBoardId = Number(boardId);

  return useMutation({
    mutationFn: async ({ title }) => {
      // 1. inbox 테이블에서 마지막 position 가져오기
      const { data: lastInboxItem, error: fetchError } = await supabase
        .from("inbox")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const nextInboxPosition = lastInboxItem
        ? Number(lastInboxItem.position + GAP)
        : GAP;

      // 2. cards 테이블에 카드 생성
      // DB의 position 컬럼이 NOT NULL이므로, 인박스 상태일 때는 임시값 0을 부여합니다.
      const { data: newCard, error: cardError } = await supabase
        .from("cards")
        .insert([
          {
            title,
            board_id: numericBoardId,
            list_id: null, // 인박스 카드는 소속된 리스트가 없음
            is_inbox: true,
            inbox_position: nextInboxPosition,
            position: 0, // ★ NOT NULL 제약 조건을 피하기 위한 임시 값
            is_archived: false,
          },
        ])
        .select()
        .single();

      if (cardError) throw cardError;

      // 3. inbox 테이블에 관계 및 순서 저장 (card_id 참조)
      const { error: inboxError } = await supabase.from("inbox").insert([
        {
          card_id: newCard.id,
          position: nextInboxPosition,
        },
      ]);

      if (inboxError) throw inboxError;

      return newCard;
    },

    onMutate: async ({ title }) => {
      const queryKey = ["inboxCards", numericBoardId];
      await queryClient.cancelQueries({ queryKey });

      const previousCards = queryClient.getQueryData(queryKey);

      const lastCachedCard = previousCards?.[previousCards.length - 1];
      const optimisticPosition = lastCachedCard?.inbox_position
        ? lastCachedCard.inbox_position + GAP
        : GAP;

      const newCardOptimistic = {
        id: Date.now(), // 임시 클라이언트 사이드 ID
        title,
        board_id: numericBoardId,
        is_inbox: true,
        inbox_position: optimisticPosition,
        position: 0,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, (old = []) => [
        ...old,
        newCardOptimistic,
      ]);

      return { previousCards, queryKey };
    },

    onError: (error, variables, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(context.queryKey, context.previousCards);
      }
      console.error("인박스 카드 추가 실패:", error.message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["inboxCards", numericBoardId],
      });
    },
  });
};
