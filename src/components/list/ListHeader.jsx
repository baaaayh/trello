import { useState, useRef } from "react";
import { useChangeListTitle } from "@/src/hooks/list/useChangeListTitle";
import DotDotDotIcon from "@/src/components/common/icons/DotDotDotIcon";
import CollapseIcon from "@/src/components/common/icons/CollapseIcon";

const FLEX_ALIGN_STYLE = "inline-flex justify-center items-center";

const ListHeader = ({
  color,
  attributes,
  listeners,
  data,
  boardId,
  handleOpenMenu,
}) => {
  const [listTitleVal, setListTitleVal] = useState(data.title);
  const titleButtonTextRef = useRef(null);
  const listTitleRef = useRef(null);
  const textAreaRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const { mutate } = useChangeListTitle(boardId);

  function showTextArea() {
    setListTitleVal(data.title);
    setIsEditing(true);
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.select();
    }, 0);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      mutate(
        { listId: data.id, newTitle: listTitleVal },
        {
          onError: () => setListTitleVal(data.title),
        },
      );
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      setListTitleVal(data.title);
      setIsEditing(false);
    }
  }

  return (
    <div
      className="board-list__header flex justify-between align-center"
      {...attributes}
      {...listeners}
    >
      <h3 className="flex-1">
        <button
          ref={listTitleRef}
          type="button"
          className={`list-title ${isEditing ? "hidden" : ""} w-full text-left cursor-pointer font-bold px-2 py-1`}
          onClick={(e) => {
            e.stopPropagation();
            showTextArea();
          }}
        >
          <span
            style={{
              color: `${color.text}`,
            }}
            ref={titleButtonTextRef}
            className="list-title__button"
          >
            {data.title}
          </span>
        </button>
        <textarea
          ref={textAreaRef}
          onKeyDown={handleKeyDown}
          className={`${isEditing ? "" : "hidden"} w-full p-1 border-2 border-blue-500 rounded-sm outline-none`}
          name="list-title-textarea"
          value={listTitleVal}
          onChange={(e) => setListTitleVal(e.target.value)}
          onBlur={() => {
            if (isEditing) {
              mutate({ listId: data.id, newTitle: listTitleVal });
              setIsEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </h3>
      <div className="button-area">
        <ul className="inline-flex justify-between items-center">
          {/* <li className={FLEX_ALIGN_STYLE}>
                      <button
                        type="button"
                        className={`${FLEX_ALIGN_STYLE} cursor-pointer p-2 hover:bg-black/5 rounded`}
                      >
                        <CollapseIcon />
                      </button>
                    </li> */}
          <li className={FLEX_ALIGN_STYLE}>
            <button
              type="button"
              className={`${FLEX_ALIGN_STYLE} cursor-pointer p-2 hover:bg-black/5 rounded`}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenMenu(e);
              }}
            >
              <span className="inline-flex justify-center items-center w-4 h-4">
                <DotDotDotIcon color={color.text} />
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};
export default ListHeader;
