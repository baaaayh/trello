import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabaseClient";

export const useRealtime = (boardId, userId) => {
  const queryClient = useQueryClient();
  const numericBoardId = Number(boardId);

  useEffect(() => {
    if (!numericBoardId) return;

    // 💡 채널 이름에 랜덤 값을 더해 중복 충돌 방지
    const channelName = `combined-realtime-${numericBoardId}-${Math.random().toString(36).substring(7)}`;
    const mainChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true }, // 내 변경사항도 내가 받을지 선택
        presence: { key: userId },
      },
    });

    mainChannel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boards" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["boards", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["listsWithCards", numericBoardId],
            refetchType: "all",
          });
          queryClient.invalidateQueries({
            queryKey: ["lists", numericBoardId],
            refetchType: "all",
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards" },
        (p) => {
          queryClient.invalidateQueries({
            queryKey: ["inboxCards", numericBoardId],
            refetchType: "active",
          });
          queryClient.invalidateQueries({
            queryKey: ["listsWithCards", numericBoardId],
            refetchType: "active",
          });
          // 상세 카드는 ID가 일치할 때만 갱신
          if (p.new?.id) {
            queryClient.invalidateQueries({
              queryKey: ["card", Number(p.new.id)],
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inbox" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["inboxCards", numericBoardId],
          });
        },
      )
      .subscribe((status) => {
        console.log(`🚀 [${channelName}] 상태 :::`, status);
      });

    return () => {
      console.log("🧹 채널 해제 중...");
      supabase.removeChannel(mainChannel);
    };
  }, [numericBoardId, userId]); // eslint-disable-line
};
