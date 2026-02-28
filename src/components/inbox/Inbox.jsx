import { useState, useRef } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import useDivideStatusStore from "@/src/store/useDivideStatusStore";
import { useLocation, matchPath } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";
import InboxIcon from "@/src/components/common/floatNavIcons/InboxIcon";
import NoCard from "@/src/components/inbox/NoCard";
import Card from "@/src/components/card/Card";
// 작성한 훅 임포트
import { useAddCardInInbox } from "@/src/hooks/inbox/useAddCardInInbox";

const Inbox = ({ data }) => {
  const { inboxList } = data;
  const location = useLocation();

  // ── 상태 관리 ──────────────────────────────────────────────────────────
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);

  const {
    divide,
    divideStatus: { inbox },
  } = useDivideStatusStore();

  // URL 파라미터 추출
  const match =
    matchPath("/board/:boardId/:boardSlug", location.pathname) ||
    matchPath("/card/:boardId/:listId/:cardId", location.pathname);

  const boardId = match?.params?.boardId;
  const boardSlug = match?.params?.boardSlug;

  // ── Mutation 훅 사용 ──────────────────────────────────────────────────
  const addCardMutation = useAddCardInInbox(boardId);

  const { setNodeRef } = useDroppable({
    id: "inbox",
    data: { type: "INBOX", cards: data },
  });

  // ── 핸들러: 카드 생성 ──────────────────────────────────────────────────
  const handleAddCard = () => {
    if (!title.trim()) return;

    addCardMutation.mutate(
      { title: title.trim() },
      {
        onSuccess: () => {
          setTitle(""); // 입력창 초기화
          setIsAdding(false); // 폼 닫기
        },
      },
    );
  };

  // 엔터 키 지원
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddCard();
    }
  };

  return (
    <div className="inbox-container w-full h-full overflow-hidden">
      <div className="inbox-container__gutter h-full">
        <div
          ref={setNodeRef}
          className={`inbox h-full bg-[#e9f2fee6]  ${divide && inbox ? "border border-black/24 rounded-[20px] overflow-hidden" : ""}`}
        >
          <div className="inbox__wrapper flex flex-col h-full p-4">
            <div className="inbox__header">
              <h2 className="flex justify-start items-center gap-x-2 py-2 font-semibold text-[#172b4d]">
                <span className="inline-flex justify-center items-center w-4 h-4">
                  <InboxIcon />
                </span>
                Inbox
              </h2>
            </div>
            <div className="inbox__body flex flex-col flex-1 items-center">
              <div className="inbox__guide flex flex-col flex-1 w-full max-w-[800px]">
                {!isAdding ? (
                  <div className="add-card pt-4 pb-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(true)}
                      className="flex w-full bg-white rounded-lg overflow-hidden shadow-[0_1px_1px_#1E1F2140,0_0_1px_#1E1F214F] hover:bg-black/10 cursor-pointer hover:shadow-none text-[#172B4D] group"
                    >
                      <span className="block p-2 text-[#626f86] group-hover:text-black font-medium">
                        Add a card
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="add-card pt-4 pb-2">
                    <div className="rounded-lg overflow-hidden shadow-[0_4px_8px_-2px_#091E4240,0_0_1px_#091E424F] bg-white">
                      <div className="add-card__input">
                        <input
                          ref={inputRef}
                          autoFocus
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full p-2 bg-white outline-none text-sm"
                          placeholder="Enter a title for this card..."
                        />
                      </div>
                      <div className="add-card__buttons bg-[#f7f8f9]">
                        <ul className="flex justify-start gap-x-1.5 p-1.5">
                          <li>
                            <button
                              type="button"
                              onClick={handleAddCard}
                              disabled={
                                addCardMutation.isPending || !title.trim()
                              }
                              className="inline-flex justify-center items-center disabled:opacity-50"
                            >
                              <span className="inline-flex justify-center items-center px-3 py-1.5 bg-[#0c66e4] hover:bg-[#0055CC] text-white font-semibold rounded-md text-sm transition-colors cursor-pointer">
                                {addCardMutation.isPending
                                  ? "Adding..."
                                  : "Add card"}
                              </span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAdding(false);
                                setTitle("");
                              }}
                              className="inline-flex justify-center items-center hover:bg-black/5 rounded-md transition-colors cursor-pointer"
                            >
                              <span className="inline-flex justify-center items-center px-3 py-1.5 font-semibold text-sm text-[#44546f] hover:text-[#172b4d]">
                                Cancel
                              </span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                <div className="card-list flex-1 mt-2">
                  <SortableContext
                    items={
                      inboxList
                        ?.filter((card) => !card.is_archived)
                        .map((card) => card.id) ?? []
                    }
                    strategy={verticalListSortingStrategy}
                  >
                    <ul>
                      {inboxList &&
                      inboxList.filter((card) => !card.is_archived).length >
                        0 ? (
                        inboxList
                          .filter((card) => !card.is_archived)
                          .map((card) => (
                            <li key={card.id} className="mb-2">
                              <Card
                                data={card}
                                boardSlug={boardSlug}
                                isInbox={true}
                              />
                            </li>
                          ))
                      ) : (
                        <NoCard />
                      )}
                    </ul>
                  </SortableContext>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
