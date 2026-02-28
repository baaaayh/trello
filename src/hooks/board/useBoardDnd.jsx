import { useState, useEffect, useRef, useMemo } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { calcPosition } from "@/src/utils/calcPosition";

const INBOX_ID = "inbox";

const normalize = (listsData, inboxCards) => {
  const containers = { [INBOX_ID]: [] };
  const cardsById = {};
  const containerOrder = [INBOX_ID];
  const listMetaById = {};

  inboxCards?.forEach((card) => {
    cardsById[card.id] = card;
    containers[INBOX_ID].push(card.id);
  });

  listsData?.forEach((list) => {
    const { cards, ...listMeta } = list;
    listMetaById[list.id] = listMeta;
    containerOrder.push(list.id);
    containers[list.id] = [];
    cards.forEach((card) => {
      cardsById[card.id] = card;
      containers[list.id].push(card.id);
    });
  });

  return { containers, cardsById, containerOrder, listMetaById };
};

export function useBoardDnd({
  boardId,
  listsData,
  inboxCards,
  moveListMutation,
  moveCardMutation,
  moveCardInInboxMutation,
  queryClient,
}) {
  const [boardState, setBoardState] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  const isDragging = useRef(false);
  const isMutating = useRef(false);
  const fromListId = useRef(null);
  const originalListId = useRef(null);
  const isMovingToInbox = useRef(false);

  // 서버 데이터 동기화
  useEffect(() => {
    if (!listsData || !inboxCards) return;
    if (isDragging.current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoardState(normalize(listsData, inboxCards));
  }, [listsData, inboxCards]);

  /* --- 파생 데이터 계산 --- */
  const lists = useMemo(() => {
    if (!boardState) return [];
    return boardState.containerOrder
      .filter((id) => id !== INBOX_ID)
      .map((listId) => ({
        ...boardState.listMetaById[listId],
        cards:
          boardState.containers[listId]
            ?.map((cardId) => boardState.cardsById[cardId])
            .filter(Boolean) ?? [],
      }));
  }, [boardState]);

  const inboxList = useMemo(() => {
    if (!boardState) return [];
    return (
      boardState.containers[INBOX_ID]?.map(
        (cardId) => boardState.cardsById[cardId],
      ).filter(Boolean) ?? []
    );
  }, [boardState]);

  /* --- 핸들러 로직 --- */
  const handleDragStart = ({ active }) => {
    isDragging.current = true;
    const data = active.data.current;
    if (!data) return;

    if (data.type === "CARD") {
      const startId = data.listId === "inbox" ? INBOX_ID : data.listId;
      fromListId.current = startId;
      originalListId.current = startId;
      setActiveItem({ type: "CARD", data: data.card ?? data });
    }

    if (data.type === "LIST") {
      setActiveItem({ type: "LIST", data: data.list ?? data });
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over || !boardState) return;

    const activeId = active.id;
    const activeData = active.data.current;
    if (!activeData || activeData.type !== "CARD") return;

    const overId = over.id;
    const overData = over.data.current;

    const activeContainer = fromListId.current;

    // over 위치가 인박스인지 재판단 (더 명확하게)
    const overIsInboxZone =
      overData?.type === "INBOX" ||
      overId === INBOX_ID ||
      (overData?.type === "CARD" && overData?.listId === "inbox");

    // ── INBOX 내부 순서 변경 ──
    if (overIsInboxZone && activeContainer === INBOX_ID) {
      if (overData?.type !== "CARD") return;

      setBoardState((prev) => {
        const inboxCards = prev.containers[INBOX_ID];
        const oldIndex = inboxCards.indexOf(activeId);
        const newIndex = inboxCards.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev;

        return {
          ...prev,
          containers: {
            ...prev.containers,
            [INBOX_ID]: arrayMove(inboxCards, oldIndex, newIndex),
          },
        };
      });
      return;
    }

    // ── 1️⃣ 보드 → INBOX ──
    if (overIsInboxZone && activeContainer !== INBOX_ID) {
      if (isMovingToInbox.current) return;
      isMovingToInbox.current = true;
      fromListId.current = INBOX_ID;

      setBoardState((prev) => {
        const next = structuredClone(prev);

        // 기존 컨테이너에서 제거
        for (const [key, ids] of Object.entries(next.containers)) {
          if (key !== INBOX_ID) {
            const idx = ids.indexOf(activeId);
            if (idx !== -1) {
              next.containers[key] = ids.filter((id) => id !== activeId);
              break;
            }
          }
        }

        // 인박스에 추가 (없을 때만)
        if (!next.containers[INBOX_ID].includes(activeId)) {
          const inboxContainer = next.containers[INBOX_ID];
          const overIndex = inboxContainer.indexOf(overId);
          const insertIndex =
            overIndex >= 0 ? overIndex : inboxContainer.length;
          next.containers[INBOX_ID].splice(insertIndex, 0, activeId);

          if (next.cardsById[activeId]) {
            next.cardsById[activeId] = {
              ...next.cardsById[activeId],
              is_inbox: true,
            };
          }
        }

        return next;
      });
      return;
    }

    // ── 보드 리스트로 드래그 ──
    const toListId = overData?.type === "CARD" ? overData.listId : overId;

    if (!toListId || toListId === INBOX_ID) return;

    // ── 2️⃣ INBOX → 보드 ──
    if (activeContainer === INBOX_ID) {
      isMovingToInbox.current = false;

      setBoardState((prev) => {
        const next = structuredClone(prev);
        const toContainer = next.containers[toListId];

        if (!toContainer) return prev;
        if (toContainer.includes(activeId)) return prev;

        // 인박스에서 제거
        next.containers[INBOX_ID] = next.containers[INBOX_ID].filter(
          (id) => id !== activeId,
        );

        // 보드 리스트에 삽입
        const overIndex = toContainer.indexOf(overId);
        const insertIndex = overIndex >= 0 ? overIndex : toContainer.length;
        next.containers[toListId].splice(insertIndex, 0, activeId);

        if (next.cardsById[activeId]) {
          next.cardsById[activeId] = {
            ...next.cardsById[activeId],
            list_id: toListId,
            is_inbox: false,
          };
        }

        return next;
      });

      fromListId.current = toListId;
      return;
    }

    // ── 3️⃣ 리스트 내에서 순서 이동 ──
    if (activeContainer === toListId) {
      if (overData?.type !== "CARD") return;

      setBoardState((prev) => {
        const ids = prev.containers[toListId];
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev;

        return {
          ...prev,
          containers: {
            ...prev.containers,
            [toListId]: arrayMove(ids, oldIndex, newIndex),
          },
        };
      });
      return;
    }

    // ── 4️⃣ 리스트 → 리스트  ──
    setBoardState((prev) => {
      const next = structuredClone(prev);
      const toContainer = next.containers[toListId];

      if (!toContainer) return prev;
      if (toContainer.includes(activeId)) return prev;

      // 기존 컨테이너에서 제거
      for (const [key, ids] of Object.entries(next.containers)) {
        const idx = ids.indexOf(activeId);
        if (idx !== -1 && key !== toListId) {
          next.containers[key] = ids.filter((id) => id !== activeId);
          break;
        }
      }

      // 새 컨테이너에 삽입
      const overIndex = toContainer.indexOf(overId);
      const insertIndex = overIndex >= 0 ? overIndex : toContainer.length;
      next.containers[toListId].splice(insertIndex, 0, activeId);

      if (next.cardsById[activeId]) {
        next.cardsById[activeId] = {
          ...next.cardsById[activeId],
          list_id: toListId,
        };
      }

      return next;
    });

    fromListId.current = toListId;
  };

  const handleDragEnd = ({ active, over }) => {
    const activeData = active.data.current ?? activeItem;
    setActiveItem(null);

    const resetRefs = () => {
      fromListId.current = null;
      originalListId.current = null;
      isMovingToInbox.current = false;
    };

    if (!over || !boardState) {
      // 드롭 실패 시 서버 데이터로 복구
      setBoardState(normalize(listsData ?? [], inboxCards ?? []));
      resetRefs();
      return;
    }

    const activeId = active.id;

    // ── 리스트 이동 ──
    if (activeData?.type === "LIST") {
      if (activeId === over.id) {
        resetRefs();
        return;
      }

      const oldIndex = boardState.containerOrder.indexOf(activeId);
      const newIndex = boardState.containerOrder.indexOf(over.id);
      if (oldIndex === newIndex) {
        resetRefs();
        return;
      }

      const newOrder = arrayMove(boardState.containerOrder, oldIndex, newIndex);
      setBoardState((prev) => ({ ...prev, containerOrder: newOrder }));

      // ✅ containerOrder가 아닌 listMetaById 기준 객체 배열로 변환
      const newOrderLists = newOrder
        .filter((id) => id !== INBOX_ID)
        .map((id) => boardState.listMetaById[id])
        .filter(Boolean);

      // ✅ 자신 제외한 배열로 position 계산
      const newOrderListsWithoutSelf = newOrderLists.filter(
        (list) => list.id !== activeId,
      );

      const adjustedIndex = newOrderLists.findIndex(
        (list) => list.id === activeId,
      );
      isMutating.current = true;
      moveListMutation.mutate(
        {
          boardId,
          listId: activeId,
          newPosition: calcPosition(newOrderListsWithoutSelf, adjustedIndex),
        },
        {
          onSuccess: () => (isMutating.current = false),
          onError: () => (isMutating.current = false),
          onSettled: () => {
            queryClient.invalidateQueries({
              queryKey: ["listsWithCards", Number(boardId)],
            });
            isDragging.current = false;
          },
        },
      );
      resetRefs();
      return;
    }

    // ── 카드 이동 ──
    if (activeData?.type === "CARD") {
      const currentFrom = fromListId.current;
      const originalFrom = originalListId.current;

      // ── 최종 목적지가 INBOX ──
      if (currentFrom === INBOX_ID) {
        const type =
          originalFrom === INBOX_ID ? "MOVE_WITHIN_INBOX" : "ENTER_INBOX";

        const inboxIds = boardState.containers[INBOX_ID];
        const cardIndex = inboxIds.indexOf(activeId);

        const latestInboxCards =
          queryClient.getQueryData(["inboxCards", Number(boardId)]) ?? [];

        const latestInboxList = latestInboxCards.filter(
          (card) => card.id !== activeId,
        );

        const finalIndex =
          cardIndex < 0 ? 0 : Math.min(cardIndex, latestInboxList.length);

        moveCardInInboxMutation.mutate(
          {
            cardId: activeId,
            newPosition: calcPosition(
              latestInboxList,
              finalIndex,
              "inbox_position",
            ),
            type,
          },
          {
            onSuccess: () => (isMutating.current = false),
            onError: () => (isMutating.current = false),
            onSettled: async () => {
              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: ["inboxCards", Number(boardId)],
                }),
                queryClient.invalidateQueries({
                  queryKey: ["listsWithCards", Number(boardId)],
                }),
              ]);
              isDragging.current = false;
            },
          },
        );
        resetRefs();
        return;
      }

      const toListId = currentFrom;
      if (!toListId) {
        setBoardState(normalize(listsData ?? [], inboxCards ?? []));
        resetRefs();
        return;
      }

      const toContainer = boardState.containers[toListId];
      if (!toContainer) {
        resetRefs();
        return;
      }

      const cardIndex = toContainer.indexOf(activeId);

      // ── INBOX → 보드 ──
      if (originalFrom === INBOX_ID) {
        // ✅ 자신 제외한 카드 목록
        const toListCardsWithoutSelf = toContainer
          .filter((id) => id !== activeId)
          .map((id) => boardState.cardsById[id])
          .filter(Boolean);

        const finalCardIndex =
          cardIndex < 0
            ? toListCardsWithoutSelf.length
            : toContainer.slice(0, cardIndex).filter((id) => id !== activeId)
                .length;

        moveCardInInboxMutation.mutate(
          {
            cardId: activeId,
            destinationListId: toListId,
            newPosition: calcPosition(toListCardsWithoutSelf, finalCardIndex),
            inboxPosition: null,
            type: "EXIT_INBOX",
          },
          {
            onSuccess: () => (isMutating.current = false),
            onError: () => (isMutating.current = false),
            onSettled: async () => {
              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: ["inboxCards", Number(boardId)],
                }),
                queryClient.invalidateQueries({
                  queryKey: ["listsWithCards", Number(boardId)],
                }),
              ]);
              isDragging.current = false;
            },
          },
        );
        resetRefs();
        return;
      }

      const toListCardsWithoutSelf = toContainer
        .filter((id) => id !== activeId)
        .map((id) => boardState.cardsById[id])
        .filter(Boolean);

      let finalCardIndex = cardIndex < 0 ? 0 : cardIndex;
      if (over.data.current?.type !== "CARD") {
        finalCardIndex = toListCardsWithoutSelf.length;
      }

      moveCardMutation.mutate(
        {
          cardId: activeId,
          destinationListId: toListId,
          newPosition: calcPosition(toListCardsWithoutSelf, finalCardIndex),
        },
        {
          onSuccess: () => (isMutating.current = false),
          onError: () => (isMutating.current = false),
          onSettled: async () => {
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["inboxCards", Number(boardId)],
              }),
              queryClient.invalidateQueries({
                queryKey: ["listsWithCards", Number(boardId)],
              }),
            ]);
            isDragging.current = false;
          },
        },
      );

      resetRefs();
    }
  };

  return {
    boardState,
    activeItem,
    lists,
    inboxList,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
