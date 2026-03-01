import { useState } from "react";
import Select from "react-select";
import useAuthStore from "@/src/store/useAuthStore";
import { useBoards } from "@/src/hooks/board/useBoards";
import { useCards } from "@/src/hooks/card/useCards";
import { useLists } from "@/src/hooks/list/useLists";
import { useMoveCard } from "@/src/hooks/card/useMoveCard";
import { useMoveCardInInbox } from "@/src/hooks/inbox/useMoveCardInInbox";
import { useInboxCards } from "@/src/hooks/inbox/useInboxCards";
import { calcPosition } from "@/src/utils/calcPosition";

const TAB_STYLE =
  "flex-1 py-2 text-sm font-medium transition-colors border-b-2";
const ACTIVE_TAB_STYLE = "border-blue-600 text-blue-600";
const INACTIVE_TAB_STYLE =
  "border-transparent text-gray-500 hover:text-gray-700";

const MoveMenu = ({ cardData, onClose }) => {
  const {
    board_id: boardId,
    list_id: listId,
    id: cardId,
    is_inbox: initialIsInbox,
  } = cardData;

  const user = useAuthStore((state) => state.user);
  const moveCardMutation = useMoveCard();
  const moveCardInInboxMutation = useMoveCardInInbox(boardId);

  const [activeTab, setActiveTab] = useState(
    initialIsInbox ? "inbox" : "board",
  );
  const [selectedBoardId, setSelectedBoardId] = useState(boardId);
  const [selectedListId, setSelectedListId] = useState(listId);
  const [selectedBoardPosIndex, setSelectedBoardPosIndex] = useState(null);
  const [selectedInboxPosIndex, setSelectedInboxPosIndex] = useState(null);

  // 데이터 fetch
  const { data: boards } = useBoards(user?.id);
  const { data: lists } = useLists(selectedBoardId);
  const { data: cardsInTargetList } = useCards(selectedBoardId, selectedListId);
  const { data: cardsInInbox } = useInboxCards(boardId);

  // ── [분석 핵심] 1. 아카이브된 카드를 완벽히 제거한 "순수 활성 목록" 생성 ──
  // 이 배열들이 UI와 1:1로 매칭되는 기준점이 됩니다.
  const activeCards = (cardsInTargetList || [])
    .filter((card) => !card.is_archived && !card.is_inbox)
    .sort((a, b) => a.position - b.position);

  const inboxActiveCards = (cardsInInbox || [])
    .filter((card) => !card.is_archived)
    .sort(
      (a, b) =>
        (a.inbox_position ?? a.position) - (b.inbox_position ?? b.position),
    );

  // ── 2. 현재 위치(Index) 계산 ──
  // DB의 position 값이 아닌, 필터링된 배열에서의 "순서(index)"를 찾습니다.
  const currentIndex = activeCards.findIndex((c) => c.id === cardId);
  const currentInboxIndex = inboxActiveCards.findIndex((c) => c.id === cardId);

  // ── 3. 포지션 옵션 개수 계산 ──
  const isSameList = selectedListId === listId && !initialIsInbox;

  // 목적지 리스트에 현재 카드가 없다면 새로운 자리(+1)가 필요합니다.
  const positionCount = isSameList
    ? activeCards.length
    : activeCards.length + 1;
  const inboxPositionCount = initialIsInbox
    ? inboxActiveCards.length
    : inboxActiveCards.length + 1;

  const positionOptions = Array.from(
    { length: Math.max(1, positionCount) },
    (_, i) => ({
      value: i,
      label: String(i + 1),
    }),
  );

  const inboxPositionOptions = Array.from(
    { length: Math.max(1, inboxPositionCount) },
    (_, i) => ({
      value: i,
      label: String(i + 1),
    }),
  );

  // ── 4. 표시할 인덱스(Display Index) 결정 ──
  const displayBoardPosIndex =
    selectedBoardPosIndex !== null
      ? selectedBoardPosIndex
      : currentIndex !== -1
        ? currentIndex
        : activeCards.length;

  const displayInboxPosIndex =
    selectedInboxPosIndex !== null
      ? selectedInboxPosIndex
      : currentInboxIndex !== -1
        ? currentInboxIndex
        : inboxActiveCards.length;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedBoardPosIndex(null);
    setSelectedInboxPosIndex(null);
    setSelectedBoardId(boardId);
    setSelectedListId(listId);
  };

  const handleMove = () => {
    if (activeTab === "inbox") {
      // 자기 자신을 제외한 "보이는" 카드들만 calcPosition에 전달
      const otherCards = inboxActiveCards.filter((c) => c.id !== cardId);
      const newPos = calcPosition(otherCards, displayInboxPosIndex);

      moveCardInInboxMutation.mutate(
        {
          cardId,
          newPosition: newPos,
          type: initialIsInbox ? "MOVE_WITHIN_INBOX" : "ENTER_INBOX",
        },
        { onSuccess: () => onClose?.() },
      );
    } else {
      const otherCards = activeCards.filter((c) => c.id !== cardId);
      const newPos = calcPosition(otherCards, displayBoardPosIndex);

      if (initialIsInbox) {
        moveCardInInboxMutation.mutate(
          {
            cardId,
            destinationListId: selectedListId,
            newPosition: newPos,
            type: "EXIT_INBOX",
          },
          { onSuccess: () => onClose?.() },
        );
      } else {
        moveCardMutation.mutate(
          {
            cardId,
            destinationBoardId: selectedBoardId,
            destinationListId: selectedListId,
            newPosition: newPos,
          },
          { onSuccess: () => onClose?.() },
        );
      }
    }
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      width: "100%",
      fontSize: "14px",
      minHeight: "36px",
      borderRadius: "4px",
      borderColor: "#e5e7eb",
      boxShadow: "none",
      "&:hover": { borderColor: "#3b82f6" },
      cursor: "pointer",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, { isSelected, isFocused }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#cfe1fd"
        : isFocused
          ? "#f3f4f6"
          : "transparent",
      color: "#333",
      fontSize: "14px",
      cursor: "pointer",
      borderLeft:
        isSelected || isFocused ? "3px solid #0c66e4" : "3px solid transparent",
    }),
  };

  return (
    <div className="move-menu w-full min-w-[260px]">
      <div className="move-menu__wrapper p-3">
        <div className="move-menu__tab mb-4 border-b border-b-black/10">
          <ul className="flex gap-x-2">
            {["inbox", "board"].map((tab) => (
              <li key={tab} className="flex-1">
                <button
                  type="button"
                  className={`${TAB_STYLE} w-full ${activeTab === tab ? ACTIVE_TAB_STYLE : INACTIVE_TAB_STYLE} capitalize`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="move-menu__content px-1">
          {activeTab === "inbox" ? (
            <div className="content">
              <div className="content__row flex justify-between items-center gap-x-2">
                <span className="text-sm font-bold text-gray-600 shrink-0">
                  Position
                </span>
                <div className="basis-1/3 shrink-0">
                  <Select
                    options={inboxPositionOptions}
                    value={
                      inboxPositionOptions.find(
                        (o) => o.value === displayInboxPosIndex,
                      ) || inboxPositionOptions[0]
                    }
                    onChange={(opt) => setSelectedInboxPosIndex(opt.value)}
                    styles={customStyles}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="content flex flex-col gap-4">
              <div className="content__row flex flex-col gap-1.5">
                <strong className="text-sm text-gray-600">Board</strong>
                <Select
                  options={boards?.map((b) => ({
                    value: b.id,
                    label: b.title,
                  }))}
                  value={{
                    value: selectedBoardId,
                    label:
                      boards?.find((b) => b.id === selectedBoardId)?.title ||
                      "Select Board",
                  }}
                  onChange={(opt) => {
                    setSelectedBoardId(opt.value);
                    if (boardId === opt.value) setSelectedListId(listId);
                    else setSelectedListId(null);
                    setSelectedBoardPosIndex(null);
                  }}
                  styles={customStyles}
                  menuPortalTarget={document.body}
                />
              </div>
              <div className="content__row flex flex-col gap-1.5">
                <div className="flex justify-between items-center gap-x-1.5">
                  <div className="list-area w-full flex-3/5 min-w-0">
                    <strong className="text-sm text-gray-600">List</strong>
                    <Select
                      options={lists?.map((l) => ({
                        value: l.id,
                        label: l.title,
                      }))}
                      value={
                        lists?.find((l) => l.id === selectedListId)
                          ? {
                              value: selectedListId,
                              label: lists.find((l) => l.id === selectedListId)
                                .title,
                            }
                          : null
                      }
                      onChange={(opt) => {
                        setSelectedListId(opt.value);
                        setSelectedBoardPosIndex(null);
                      }}
                      placeholder="Select List"
                      styles={customStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  <div className="position-area w-full flex-2/5 min-w-0">
                    <strong className="text-sm text-gray-600">Position</strong>
                    <Select
                      options={positionOptions}
                      value={
                        positionOptions.find(
                          (o) => o.value === displayBoardPosIndex,
                        ) || positionOptions[0]
                      }
                      onChange={(opt) => setSelectedBoardPosIndex(opt.value)}
                      styles={customStyles}
                      isSearchable={false}
                      menuPortalTarget={document.body}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleMove}
            className="w-full py-2 font-bold text-white bg-[#0c66e4] hover:bg-[#1558BC] rounded-md transition-all disabled:opacity-50"
            disabled={
              moveCardMutation.isPending || moveCardInInboxMutation.isPending
            }
          >
            {moveCardMutation.isPending || moveCardInInboxMutation.isPending
              ? "Moving..."
              : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveMenu;
