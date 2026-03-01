import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useChangeCardDetail } from "../../hooks/card/useChangeCardDetail";
import CardEdit from "@/src/components/card/CardEdit";
import CheckOn from "@/src/components/common/icons/CheckOn";
import CheckOff from "@/src/components/common/icons/CheckOff";
import EditIcon from "@/src/components/common/icons/EditIcon";

const Card = ({ data, boardSlug, isInbox }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPosition, setEditPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const location = useLocation();

  const {
    attributes,
    listeners,
    setNodeRef: setCardRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: data.id,
    data: {
      type: "CARD",
      listId: isInbox ? "inbox" : data.list_id,
      card: data,
    },
  });

  const style = useMemo(
    () => ({
      transform: transform ? CSS.Translate.toString(transform) : undefined,
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : "auto",
      pointerEvents: isDragging ? "none" : "auto", // 리스트 드래그와 구분 위해 // 없으면 새로고침 됨.
    }),
    [transform, transition, isDragging],
  );

  const {
    board_id: boardId,
    list_id: listId,
    id: cardId,
    title,
    is_complete: isComplete,
  } = data;

  const { mutate } = useChangeCardDetail(
    Number(boardId),
    Number(listId),
    Number(cardId),
  );

  function chgangeCardStatus(e) {
    e.preventDefault();
    e.stopPropagation();
    mutate({ isComplete: !isComplete });
  }

  function handleContextMenu(e, b) {
    e.preventDefault();
    let card;
    if (b === "edit-button")
      card = e.currentTarget.closest(".card").getBoundingClientRect();
    else card = e.currentTarget.getBoundingClientRect();
    setEditPosition({
      top: card.top,
      left: card.left,
      width: card.width,
    });
    setIsEditing(true);
  }

  return (
    <>
      <div
        data-id={data.id}
        ref={setCardRef}
        style={style}
        {...attributes}
        {...listeners}
        className="card rounded-lg overflow-hidden shadow-[0_1px_1px_#1E1F2140,0_0_1px_#1E1F214F]"
        onContextMenu={handleContextMenu}
      >
        <Link
          to={`/card/${boardId}/${isInbox ? "INBOX" : listId}/${cardId}`}
          state={{ backgroundLocation: location, boardSlug }}
          className="block p-2 bg-white group"
        >
          <div className="card__inner relative flex justify-between items-start gap-x-1.5">
            <div className="card__check inline-flex pt-0.5">
              <span
                className={`inline-flex w-4 h-4 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 ${isComplete ? "opacity-100" : ""}`}
                onClick={chgangeCardStatus}
              >
                {isComplete ? <CheckOn /> : <CheckOff />}
              </span>
            </div>
            <div
              className={`card__title flex-1 text-sm leading-snug -translate-x-5 transition-transform duration-300 ease-in-out group-hover:translate-x-0 ${isComplete ? "translate-x-0" : ""}`}
            >
              {title}
            </div>
            <span
              className="edit-button absolute top-1/2 right-0.5 -translate-y-1/2 inline-flex justify-center items-center w-5.5 h-5.5 p-1 rounded-full overflow-hidden bg-white hover:bg-gray-200 box-border z-2"
              onClick={(e) => handleContextMenu(e, "edit-button")}
            >
              <EditIcon />
            </span>
          </div>
        </Link>
      </div>
      {isEditing && (
        <CardEdit
          data={data}
          title={title}
          position={editPosition}
          onClose={() => setIsEditing(false)}
          onSave={(newTitle) => {
            mutate({ titleVal: newTitle });
            setIsEditing(false);
          }}
          boardSlug={boardSlug}
        />
      )}
    </>
  );
};

export default Card;
