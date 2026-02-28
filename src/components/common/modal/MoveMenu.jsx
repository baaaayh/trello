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

  const [activeTab, setActiveTab] = useState("board");
  const [selectedBoardId, setSelectedBoardId] = useState(boardId);
  const [selectedListId, setSelectedListId] = useState(listId);

  // 사용자가 명시적으로 선택한 포지션을 저장 (초기값 null)
  const [selectedBoardPosIndex, setSelectedBoardPosIndex] = useState(null);
  const [selectedInboxPosIndex, setSelectedInboxPosIndex] = useState(null);

  // 선택된 보드와 리스트에 따라 데이터를 실시간으로 가져옴
  const { data: boards } = useBoards(user?.id);
  const { data: lists } = useLists(selectedBoardId);
  const { data: cardsInTargetList } = useCards(selectedBoardId, selectedListId);
  const { data: cardsInInbox } = useInboxCards(boardId);
  const moveCardInInboxMutation = useMoveCardInInbox(boardId);

  // 1. 타겟 리스트의 카드들을 정렬 (아카이브 제외)
  const activeCards = (cardsInTargetList || [])
    .filter((card) => !card.is_archived && !card.is_inbox)
    .sort((a, b) => a.position - b.position);

  const inboxActiveCards = (cardsInInbox || [])
    .filter((card) => !card.is_archived)
    .sort((a, b) => a.position - b.position);

  // 2. 현재 이동하려는 카드가 타겟 리스트에 이미 있는지 확인
  const currentIndex = activeCards.findIndex((c) => c.id === cardId);
  const currentInboxIndex = inboxActiveCards.findIndex((c) => c.id === cardId);

  // 3. 포지션 옵션 개수 계산
  // - 현재 리스트와 목적지 리스트가 같다면: 카드 개수 유지
  // - 목적지 리스트가 다르다면: 새로운 자리가 필요하므로 +1
  const isSameList = selectedListId === listId && !initialIsInbox;
  const positionCount = isSameList
    ? activeCards.length
    : activeCards.length + 1;

  // console.log(positionCount);

  const inboxPositionCount = inboxActiveCards.length + 1;

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

  // 4. 표시할 인덱스 결정 (선택값이 없으면 현재 위치 혹은 마지막 위치 자동 계산)
  const displayBoardPosIndex =
    selectedBoardPosIndex !== null
      ? selectedBoardPosIndex
      : currentIndex !== -1
        ? currentIndex
        : activeCards.length;

  // displayPosIndex (inbox 탭용)
  const displayInboxPosIndex =
    selectedInboxPosIndex !== null
      ? selectedInboxPosIndex
      : currentInboxIndex !== -1
        ? currentInboxIndex
        : inboxActiveCards.length;

  // 탭 변경 시 호출
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedBoardPosIndex(null);
    setSelectedInboxPosIndex(null);
    setSelectedBoardId(boardId);
    setSelectedListId(listId);
  };

  const handleMove = () => {
    // ── 케이스 1: 인박스로 이동 (진입 또는 내부 이동) ──
    if (activeTab === "inbox") {
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
    }
    // ── 케이스 2: 보드 리스트로 이동 (복귀 또는 내부 이동) ──
    else {
      const otherCards = activeCards.filter((c) => c.id !== cardId);
      const newPos = calcPosition(otherCards, displayBoardPosIndex);

      if (initialIsInbox) {
        // 인박스 탈출 (Exit)
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
        // 일반적인 보드 내 이동 (기존 훅 사용)
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

  // Select 컴포넌트 공통 스타일
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
                        setSelectedBoardPosIndex(null); // ✅ 리스트가 바뀌면 사용자가 선택한 포지션을 초기화하여 목록 갱신을 유도
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
                      // displayPosIndex를 통해 실시간으로 계산된 값을 보여줌
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
            className="w-full py-2 font-bold text-white bg-[#0c66e4] hover:bg-[#1558BC] rounded-md transition-all"
            disabled={moveCardMutation.isPending}
          >
            {moveCardMutation.isPending ? "Moving..." : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveMenu;
