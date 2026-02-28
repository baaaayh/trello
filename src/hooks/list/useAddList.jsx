import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useAddList = (boardId) => {
  const queryClient = useQueryClient();
  const numericBoardId = Number(boardId);
  const GAP = 65536;
  const queryKey = ["listsWithCards", numericBoardId];

  return useMutation({
    mutationFn: async ({ listTitle }) => {
      const { data: lastList, error: fetchError } = await supabase
        .from("lists")
        .select("position")
        .eq("board_id", numericBoardId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const nextPosition = lastList
        ? Number(lastList.position + GAP)
        : Number(GAP);

      const { data, error } = await supabase
        .from("lists")
        .insert([
          {
            title: listTitle,
            board_id: numericBoardId,
            position: nextPosition,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ listTitle }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousLists = queryClient.getQueryData(queryKey) || [];

      const lastCachedList = previousLists[previousLists.length - 1];
      const optimisticPosition = lastCachedList
        ? Number(lastCachedList.position + GAP)
        : Number(GAP);

      const newList = {
        board_id: numericBoardId,
        title: listTitle,
        position: optimisticPosition,
        cards: [],
        is_temp: true,
      };

      queryClient.setQueryData(queryKey, (old) => [...(old || []), newList]);

      return { previousLists, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(context.queryKey, context.previousLists);
      }
      console.error("리스트 추가 실패 : ", error.message);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
