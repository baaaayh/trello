import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useInboxCards = (boardId, session) => {
  return useQuery({
    queryKey: ["inboxCards", Number(boardId)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox")
        .select(
          `
          id,
          position,
          created_at,
          card_id,
          cards (
            id,
            title,
            desc,
            position,
            board_id,
            list_id,
            is_archived
          )
        `,
        )
        .order("position", { ascending: true });

      if (error) {
        console.error("인박스 카드 로드 에러:", error);
        throw error;
      }

      // 데이터 가공: UI에서 card.title로 바로 접근할 수 있게 평탄화
      return data.map((item) => ({
        // cards가 존재하지 않을 경우를 대비해 옵셔널 체이닝이나 빈 객체 처리를 합니다.
        ...(item.cards || {}),
        id: item.card_id, // 실제 카드의 ID를 유지
        inbox_id: item.id, // 인박스 테이블의 고유 ID
        inbox_position: item.position, // 인박스 내에서의 순서 (기존 position과 구분)
        created_at: item.created_at,
        is_inbox: true, // 인박스 소속임을 명시하는 플래그
      }));
    },
    enabled: !!boardId && !!session,
  });
};
