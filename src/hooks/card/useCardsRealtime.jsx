import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useCardsRealtime = (boardId) => {
  const queryClient = useQueryClient();
  const numericBoardId = Number(boardId);

  useEffect(() => {
    if (!numericBoardId) return;

    const channel = supabase
      .channel(`realtime-board-${numericBoardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boards" },
        (payload) => {
          console.log("boards 변경:", payload);
          queryClient.invalidateQueries({ queryKey: ["boards"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inbox" },
        (payload) => {
          console.log("inbox 변경:", payload);
          queryClient.invalidateQueries({
            queryKey: ["listsWithCards", numericBoardId],
          });
          queryClient.invalidateQueries({
            queryKey: ["inboxCards", numericBoardId],
          });
          if (payload.new?.id) {
            queryClient.invalidateQueries({
              queryKey: ["card", Number(payload.new.id)],
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        (payload) => {
          console.log("lists 변경:", payload);
          queryClient.invalidateQueries({
            queryKey: ["listsWithCards", numericBoardId],
          });
          queryClient.invalidateQueries({
            queryKey: ["inboxCards", numericBoardId],
          });
          if (payload.new?.id) {
            queryClient.invalidateQueries({
              queryKey: ["card", Number(payload.new.id)],
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards" },
        (payload) => {
          console.log("cards 변경:", payload);
          queryClient.invalidateQueries({
            queryKey: ["listsWithCards", numericBoardId],
          });
          queryClient.invalidateQueries({
            queryKey: ["inboxCards", numericBoardId],
          });
          queryClient.invalidateQueries({ queryKey: ["archivedCards"] });
          queryClient.invalidateQueries({ queryKey: ["cards"] });
          if (payload.new?.id) {
            queryClient.invalidateQueries({
              queryKey: ["card", Number(payload.new.id)],
            });
          }
        },
      )
      .subscribe((status) => {
        console.log("구독 상태 ::: ", status);
      });

    // 3. 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, [numericBoardId, queryClient]);
};
