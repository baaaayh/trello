import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { useChangeCardDetail } from "@/src/hooks/card/useChangeCardDetail";
import PopOver from "@/src/components/common/PopOver";
import MoveMenu from "@/src/components/common/modal/MoveMenu";
import OpenCardIcon from "@/src/components/common/icons/OpenCardIcon";
import RightArrowIcon from "../common/icons/RightArrowIcon";
import ArchiveIcon from "../common/icons/ArchiveIcon";

const FLEX_ALIGN_STYLE = "inline-flex justify-center items-center";
const EDIT_MENU_BUTTON_STYLE =
  "edit-button bg-white/90 hover:bg-white px-2 py-1.5 rounded-md shadow-sm transition-colors flex items-center gap-x-1.5 cursor-pointer";

const CardEdit = ({ data, title, position, onClose, onSave, boardSlug }) => {
  const queryClient = useQueryClient();
  const { board_id: boardId, list_id: listId, id: cardId } = data;
  const navigate = useNavigate();
  const location = useLocation();
  const [cardTitleVal, setCardTitleVal] = useState(title);
  const [anchorEl, setAnchorEl] = useState(null);
  const textAreaRef = useRef(null);

  const { mutate } = useChangeCardDetail(boardId, listId, cardId);

  const adjustHeight = () => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [cardTitleVal]);

  function handleOpenCard() {
    navigate(`/card/${boardId}/${listId}/${cardId}`, {
      state: {
        backgroundLocation: location.state?.backgroundLocation || location,
        boardSlug,
      },
    });
    onClose();
  }

  function handleOpenMenu(e) {
    setAnchorEl(e.currentTarget);
  }

  function handleArchive() {
    mutate(
      {
        isArchived: true,
      },
      {
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: ["archivedCards"] });
          queryClient.invalidateQueries({
            queryKey: ["listsWithCards", Number(boardId)],
          });
          onClose();
        },
      },
    );
  }

  const editMenu = [
    {
      icon: <OpenCardIcon />,
      text: "Open card",
      onClick: handleOpenCard,
    },
    {
      icon: <RightArrowIcon />,
      text: "Move",
      onClick: handleOpenMenu,
    },
    {
      icon: <ArchiveIcon />,
      text: "Archive",
      onClick: handleArchive,
    },
  ];

  return (
    <>
      <div className="modal-layout fixed top-0 right-0 bottom-0 left-0 z-3">
        <div className="dim w-full h-full bg-black/30" onClick={onClose}>
          <div
            className="card-edit absolute inline-flex gap-x-4"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="edit-area flex flex-col gap-y-2"
              style={{ width: `${position.width}px` }}
            >
              <textarea
                ref={textAreaRef}
                name="cardEdit"
                id="cardEdit"
                className="w-full p-2 rounded-md bg-white shadow-lg overflow-hidden min-h-[80px] focus:outline-none resize-none"
                value={cardTitleVal}
                onChange={(e) => setCardTitleVal(e.target.value)}
                autoFocus
              />

              <div className="button-area">
                <button
                  type="button"
                  className="rounded-md overflow-hidden transition-all active:scale-95"
                  onClick={() => {
                    if (title !== cardTitleVal) onSave(cardTitleVal);
                    else onClose();
                  }}
                >
                  <div
                    className={`${FLEX_ALIGN_STYLE} px-4 py-1.5 font-bold text-white bg-[#0c66e4] hover:bg-[#1558BC] cursor-pointer`}
                  >
                    <span>Save</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="edit-menu">
              <ul className="flex flex-col gap-y-2">
                {editMenu.map((button) => {
                  const isThisButtonActive = anchorEl && button.text === "Move";
                  return (
                    <li key={button.text}>
                      <button
                        type="button"
                        className={`${EDIT_MENU_BUTTON_STYLE} ${
                          isThisButtonActive ? "!bg-[#292A2E] text-white" : ""
                        }`}
                        onClick={button.onClick}
                      >
                        <span className="edit-button__icon">{button.icon}</span>
                        <span className="edit-button__text text-sm font-medium">
                          {button.text}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {anchorEl && (
        <PopOver
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          title={"Move card"}
        >
          <MoveMenu cardData={data} onClose={onClose} />
        </PopOver>
      )}
    </>
  );
};

export default CardEdit;
