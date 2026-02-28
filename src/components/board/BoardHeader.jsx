import { useState, useEffect, useRef } from "react";
import { useChangeBoardTitle } from "@/src/hooks/board/useChangeBoardTitle";
import PopOver from "@/src/components/common/PopOver";
import BoardMenu from "@/src/components/board/BoardMenu";
import ArchivedItemsMenu from "@/src/components/board/ArchivedItemsMenu";
import BoardIcon from "@/src/components/common/icons/BoardIcon";
import ArrowIcon from "@/src/components/common/icons/ArrowIcon";
import DotDotDotIcon from "@/src/components/common/icons/DotDotDotIcon";
const FLEX_ALIGN_STYLE = "inline-flex justify-between items-center";

const BroardHeader = ({ userId, boardId, boardTitle }) => {
  const [boardTitleVal, setBoardTitleVal] = useState(boardTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [inputWidth, setInputWidth] = useState(0);
  const titleButtonTextRef = useRef();
  const titleInputRef = useRef();
  const ghostRef = useRef();

  const [anchorEl, setAnchorEl] = useState(null);
  const [buttonAnchorEl, setButtonAnchorEl] = useState(null);

  const { mutate } = useChangeBoardTitle(userId);

  function showTextArea() {
    setBoardTitleVal(boardTitle);
    setIsEditing(true);
    setTimeout(() => {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }, 0);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      mutate(
        {
          boardId,
          newTitle: boardTitleVal,
        },
        {
          onError: () => setBoardTitleVal(boardTitle),
          onSuccess: () => setBoardTitleVal(boardTitleVal),
        },
      );
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      setBoardTitleVal(boardTitle);
      setIsEditing(false);
    }
  }

  useEffect(() => {
    if (ghostRef.current) {
      setInputWidth(ghostRef.current.offsetWidth);
    }
  }, [boardTitleVal]);

  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);

  const handleOpenArchivedItems = () => {
    setButtonAnchorEl(anchorEl);
    setAnchorEl(null);
  };

  return (
    <div className="title-area bg-board-header-background-color">
      <div className="title-area__wrapper flex justify-between items-center p-3 bg-dynamic-bg">
        <div className={`title-area__left ${FLEX_ALIGN_STYLE} gap-x-3`}>
          <div className="title">
            <h2 className="font-bold text-white">
              <button
                type="button"
                onClick={showTextArea}
                className={`board-title ${isEditing ? "hidden" : ""} w-full text-left cursor-pointer`}
              >
                <span
                  ref={titleButtonTextRef}
                  className="title-button__wrapper"
                >
                  {boardTitle}
                </span>
              </button>
            </h2>
            <input
              ref={titleInputRef}
              className={`text-white text-4 ${isEditing ? "" : "hidden"}`}
              style={{ width: `${inputWidth}px` }}
              name="board-title"
              id="board-title"
              onKeyDown={handleKeyDown}
              value={boardTitleVal}
              onChange={(e) => setBoardTitleVal(e.target.value)}
            />
            <span
              ref={ghostRef}
              className="absolute top-0 left-0 invisible h-0 whitespace-pre text-4 text-white"
            >
              {boardTitleVal}
            </span>
          </div>

          <div className="view p-1.5 inline-flex">
            <div className="view__current inline-flex">
              <button
                type="button"
                className="view-button inline-flex cursor-pointer"
              >
                <div
                  className={`view-button__wrapper gap-x-1 ${FLEX_ALIGN_STYLE}`}
                >
                  <span className={`view-button__icon ${FLEX_ALIGN_STYLE}`}>
                    <BoardIcon />
                  </span>
                  <span className={`view-button__arrow ${FLEX_ALIGN_STYLE}`}>
                    <ArrowIcon />
                  </span>
                </div>
              </button>
            </div>
            <div className="view__list hidden">
              <strong>Views</strong>
              <ul></ul>
            </div>
          </div>
        </div>
        <div className="user-menu">
          <ul>
            <li>
              <button
                type="button"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenMenu(e);
                }}
              >
                <span className="inline-flex justify-center items-cneter w-5 h-5">
                  <DotDotDotIcon color={"white"} />
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
      {anchorEl && (
        <PopOver
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          title={"Menu"}
        >
          <BoardMenu handleOpenArchivedItems={handleOpenArchivedItems} />
        </PopOver>
      )}
      {buttonAnchorEl && (
        <PopOver
          anchorEl={buttonAnchorEl}
          onClose={() => setButtonAnchorEl(null)}
          title={"Archived items"}
        >
          <ArchivedItemsMenu
            boardId={boardId}
            setButtonAnchorEl={setButtonAnchorEl}
          />
        </PopOver>
      )}
    </div>
  );
};
export default BroardHeader;
