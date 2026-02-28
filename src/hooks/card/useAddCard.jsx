import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useAddCard = (boardId, listId) => {
  const queryClient = useQueryClient();
  const GAP = 65536;

  const numericBoardId = Number(boardId);
  const numericListId = Number(listId);

  return useMutation({
    mutationFn: async ({ title }) => {
      // 마지막 카드 가져오기
      const { data: lastCard, error: fetchError } = await supabase
        .from("cards")
        .select("position")
        .eq("list_id", numericListId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const nextPosition = lastCard
        ? Number(lastCard.position + GAP)
        : Number(GAP);

      // 카드 추가
      const { data, error } = await supabase
        .from("cards")
        .insert([
          {
            title,
            list_id: numericListId,
            board_id: numericBoardId,
            position: nextPosition,
            is_archived: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ title }) => {
      const queryKey = ["listsWithCards", numericBoardId];
      await queryClient.cancelQueries({ queryKey });

      const previousLists = queryClient.getQueryData(queryKey);

      // 현재 리스트의 마지막 카드 position 계산
      const targetList = previousLists?.find((l) => l.id === numericListId);
      const lastCard = targetList?.cards
        ?.slice()
        .sort((a, b) => a.position - b.position)
        .at(-1);
      const optimisticPosition = lastCard
        ? Number(lastCard.position) + GAP
        : GAP;

      const newCard = {
        id: `optimistic-${Date.now()}`, // 임시 id
        title,
        list_id: numericListId,
        board_id: numericBoardId,
        position: optimisticPosition,
        is_archived: false,
        is_inbox: false,
        created_at: new Date().toISOString(),
      };

      // listsWithCards 캐시에 카드 추가
      queryClient.setQueryData(queryKey, (oldLists) => {
        if (!oldLists) return [];
        return oldLists.map((list) => {
          if (list.id !== numericListId) return list;
          return {
            ...list,
            cards: [...list.cards, newCard],
          };
        });
      });

      return { previousLists, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(context.queryKey, context.previousLists);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["listsWithCards", numericBoardId],
      });
    },
  });
};
