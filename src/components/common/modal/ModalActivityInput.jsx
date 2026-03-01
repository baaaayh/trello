import { useState } from "react";
import { useAddCardComment } from "@/src/hooks/card/useAddCardComment";
import { useUpdateCardComment } from "@/src/hooks/card/useUpdateCardComment";

const ModalActivityInput = ({
  isShow,
  setIsShow,
  boardId,
  listId,
  cardId,
  commentId,
  content,
  type,
}) => {
  const [textVal, setTextVal] = useState(content ? content : "");

  const { mutate: addComment } = useAddCardComment(boardId, listId, cardId);
  const { mutate: updateComment } = useUpdateCardComment(cardId);

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setIsShow(false);
    }
  }

  function onChangeTextarea(e) {
    setTextVal(e.target.value);
  }

  function handleSave() {
    if (!textVal.trim()) return;
    if (type === "insert") {
      addComment(
        { content: textVal },
        {
          onSuccess: () => {
            setTextVal("");
            setIsShow(false);
          },
        },
      );
    } else if (type === "update") {
      updateComment(
        { commentId, content: textVal },
        {
          onSuccess: () => setIsShow(false),
        },
      );
    }
  }
  return (
    <>
      <div className={`comment__input ${isShow ? "" : "hidden"}`}>
        <div className="textarea border border-[#8C8F97]">
          <textarea
            name="commentTextarea"
            id="commentTextarea"
            placeholder="Write a comment..."
            value={textVal}
            className="flex w-full h-full p-4 bg-white resize-none"
            onChange={onChangeTextarea}
            onKeyDown={handleKeyDown}
          ></textarea>
        </div>
        <div className="button mt-1">
          <button
            type="button"
            disabled={!textVal.trim()}
            className={`inline-flex justify-center items-center rounded-lg ${textVal.trim() ? "bg-[#0c66e4]" : "bg-[#091e4208]"} cursor-pointer`}
            onClick={handleSave}
          >
            <span
              className={`inline-flex justify-center items-center px-2 py-1.5 ${textVal.trim() ? "text-white" : "text-[#091e424f]"}`}
            >
              Save
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalActivityInput;
