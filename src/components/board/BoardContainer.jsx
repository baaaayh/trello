import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useDivideStatusStore from "@/src/store/useDivideStatusStore";
import { useBoards } from "@/src/hooks/board/useBoards";
import BoardHeader from "@/src/components/board/BoardHeader";
import Board from "@/src/components/board/Board";

const BoardContainer = ({ user, data }) => {
  const { data: boards, isLoading } = useBoards(user?.id);

  const currentBoard = boards?.find((board) => board.is_active);
  const currentBoardId = currentBoard?.id;
  const currentBoardSlug = currentBoard?.slug;
  const currentBoardTitle = currentBoard?.title;
  const currentBoardBg = currentBoard?.bg_value;

  const scrollRef = useRef(null);
  const [thumbWidth, setThumbWidth] = useState(40);
  const [thumbLeft, setThumbLeft] = useState(0);

  const {
    divide,
    divideStatus: { board },
  } = useDivideStatusStore();

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startLeft = useRef(0);

  // 스크롤 동기화
  const updateThumb = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    const ratio = clientWidth / scrollWidth;
    const width = Math.max(clientWidth * ratio, 40);
    const left = (scrollLeft / scrollWidth) * clientWidth;

    setThumbWidth(width);
    setThumbLeft(left);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateThumb();

    // 1. 스크롤 이벤트
    el.addEventListener("scroll", updateThumb);

    // 2. ResizeObserver: 세로선 드래그로 인해 너비가 변하는 것을 감지
    const resizeObserver = new ResizeObserver(() => {
      updateThumb();
    });
    resizeObserver.observe(el);

    // 3. MutationObserver: 리스트/카드 추가 감지
    const mutationObserver = new MutationObserver(updateThumb);
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", updateThumb);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [isLoading, boards]); // 의존성 유지

  // 드래그
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startLeft.current = thumbLeft;
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const delta = e.clientX - startX.current;
    const newLeft = startLeft.current + delta;

    const maxLeft = el.clientWidth - thumbWidth;
    const clamped = Math.max(0, Math.min(newLeft, maxLeft));

    const scrollRatio = clamped / el.clientWidth;
    el.scrollLeft = scrollRatio * el.scrollWidth;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.userSelect = "auto";
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  return (
    <div
      className={`content-area relative flex flex-col h-full ${divide && board ? "rounded-[20px] overflow-hidden" : ""}`}
    >
      {isLoading ? (
        <span className="text-white font-bold">Loading...</span>
      ) : (
        <>
          <BoardHeader
            userId={user?.id}
            boardId={currentBoardId}
            boardTitle={currentBoardTitle}
          />
          <div className="flex-1 relative">
            <div
              ref={scrollRef}
              className="board-scroll h-full overflow-x-scroll overflow-y-hidden"
              style={{ scrollbarWidth: "none" }}
            >
              <style>{`
                .board-scroll::-webkit-scrollbar { display: none; }
              `}</style>

              <div
                style={{
                  backgroundImage: currentBoardBg
                    ? `url('/images/${currentBoardBg}.svg')`
                    : `url('/images/rainbow.svg')`,
                }}
                className="min-w-max h-full pt-2 px-1 pb-18 bg-cover bg-center"
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      currentBoardSlug && (
                        <Navigate
                          to={`/board/${currentBoardId}/${currentBoardSlug}`}
                          replace
                        />
                      )
                    }
                  />
                  <Route
                    path="/board/:boardId/:boardSlug"
                    element={<Board data={data} />}
                  />
                  <Route
                    path="/card/:boardId/:listId/:cardId"
                    element={<Board data={data} />}
                  />
                </Routes>
              </div>
            </div>
            <div className="absolute bottom-3 left-6 right-6 h-2 bg-white/10 rounded-full">
              <div
                onMouseDown={handleMouseDown}
                className="h-full bg-white/50 hover:bg-white/80 rounded-full cursor-pointer transition-colors"
                style={{
                  width: thumbWidth - 48,
                  transform: `translateX(${thumbLeft}px)`,
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BoardContainer;
