import { useEffect, useMemo } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
  closestCenter,
} from "@dnd-kit/core";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useBoardDnd } from "@/src/hooks/board/useBoardDnd";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useMoveList } from "@/src/hooks/list/useMoveList";
import { useMoveCard } from "@/src/hooks/card/useMoveCard";
import { useListsWithCards } from "@/src/hooks/list/useListsWithCards";
import { useInboxCards } from "@/src/hooks/inbox/useInboxCards";
import { useMoveCardInInbox } from "@/src/hooks/inbox/useMoveCardInInbox";
import useDivideStatusStore from "@/src/store/useDivideStatusStore";
import useAuthStore from "@/src/store/useAuthStore";
import Header from "@/src/components/layout/Header";
import BoardContainer from "@/src/components/board/BoardContainer";
import Modal from "@/src/components/common/modal/Modal";
import SplitLayout from "@/src/components/layout/SplitLayout";
import Inbox from "@/src/components/inbox/Inbox";
import List from "@/src/components/list/List";
import PopOver from "@/src/components/common/PopOver";
import FloatNav from "@/src/components/common/nav/FloatNav";
import InboxIcon from "@/src/components/common/floatNavIcons/InboxIcon";
import BoardIcon from "@/src/components/common/floatNavIcons/BoardIcon";

const menuData = [
  [
    { icon: <InboxIcon />, text: "Inbox" },
    { icon: <BoardIcon />, text: "Board" },
  ],
];

function App() {
  const location = useLocation();
  const match =
    matchPath("/board/:boardId/:boardSlug", location.pathname) ||
    matchPath("/card/:boardId/:listId/:cardId", location.pathname);
  const background = location.state?.backgroundLocation;

  const params = match?.params;
  const boardId = params?.boardId;
  const boardSlug = params?.boardSlug;

  const queryClient = useQueryClient();
  const moveListMutation = useMoveList();
  const moveCardMutation = useMoveCard();
  const moveCardInInboxMutation = useMoveCardInInbox(boardId);

  const { session, setSession, setUser } = useAuthStore();
  const { divide, leftWidth, setLeftWidth } = useDivideStatusStore();
  const { data: user, isLoading: isProfileLoading } = useUserProfile(
    session?.user?.id,
  );
  const { data: listsData, isLoading } = useListsWithCards(boardId, session);
  const { data: inboxCards } = useInboxCards(boardId, session);

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.signInWithPassword({
        email: "test@test.com",
        password: "12345678",
      });
      setSession(data.session);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const {
    boardState,
    activeItem,
    lists,
    inboxList,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useBoardDnd({
    boardId,
    listsData,
    inboxCards,
    moveListMutation,
    moveCardMutation,
    moveCardInInboxMutation,
    queryClient,
  });

  // BoardContainer에 필요한 파생값
  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);
  const lastPosition =
    lists.length > 0 ? Math.max(...lists.map((l) => l.position)) : 0;

  const customCollisionDetection = (args) => {
    const { active } = args;

    if (active.data.current?.type === "LIST") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.data.current?.type === "LIST",
        ),
      });
    }

    if (active.data.current?.type === "CARD") {
      const isFromInbox = active.data.current?.listId === "inbox";

      if (isFromInbox) {
        const inboxZoneCollision = rectIntersection({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (c) => c.data.current?.type === "INBOX",
          ),
        });

        if (inboxZoneCollision.length > 0) {
          const inboxCardCollision = closestCorners({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (c) =>
                c.data.current?.type === "CARD" &&
                c.data.current?.listId === "inbox",
            ),
          });
          if (inboxCardCollision.length > 0) return inboxCardCollision;
          return inboxZoneCollision;
        }

        return closestCorners(args);
      }

      const inboxCollision = rectIntersection({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.data.current?.type === "INBOX",
        ),
      });
      if (inboxCollision.length > 0) return inboxCollision;

      return closestCorners(args);
    }

    return closestCorners(args);
  };

  // console.log("inboxList ::: ", inboxList);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="view h-[100vh]">
          <div className="view__wrapper flex flex-col w-full h-full">
            <Header divide={divide} />
            <SplitLayout
              left={<Inbox data={{ inboxList }} isInbox={true} />}
              right={
                <Routes location={background || location}>
                  <Route
                    path="/*"
                    element={
                      isProfileLoading ? (
                        <p>Loading...</p>
                      ) : (
                        <BoardContainer
                          user={user}
                          data={{
                            isLoading,
                            listIds,
                            lists,
                            boardId,
                            boardSlug,
                            lastPosition,
                          }}
                        />
                      )
                    }
                  />
                </Routes>
              }
              divide={divide}
              leftWidth={leftWidth}
              setLeftWidth={setLeftWidth}
            />
          </div>
          <div className="nav-container absolute right-1/2 -transform-x-1/2 bottom-4 w-0 flex justify-center z-2">
            <FloatNav menuData={menuData} />
          </div>
        </div>
        {background && (
          <Routes>
            <Route path="/card/:boardId/:listId/:cardId" element={<Modal />} />
          </Routes>
        )}
        <PopOver />
        <DragOverlay>
          {activeItem?.type === "CARD" && (
            <div className="card rounded-lg overflow-hidden shadow-[0_1px_1px_#1E1F2140,0_0_1px_#1E1F214F] rotate-2 scale-105">
              <div className="block p-2 bg-white">
                <div className="card__inner relative flex justify-between items-start gap-x-1.5">
                  <div className="card__title flex-1 text-sm leading-snug">
                    {activeItem.data.title}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeItem?.type === "LIST" && (
            <List
              data={activeItem.data}
              boardId={boardId}
              boardSlug={boardSlug}
              cards={
                boardState?.containers[activeItem.data.id]
                  ?.map((cardId) => boardState.cardsById[cardId])
                  .filter(Boolean) ?? []
              }
            />
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}

export default App;
