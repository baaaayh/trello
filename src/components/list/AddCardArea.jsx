import { useState } from "react";
import { useAddCard } from "@/src/hooks/card/useAddCard";
import CloseIcon from "@/src/components/common/icons/CloseIcon";

const FLEX_ALIGN_STYLE = "inline-flex justify-center items-center";

const AddCardArea = ({
  addCardRef,
  boardId,
  listId,
  addCardTextAreaRef,
  showAddCardArea,
  closeAddCardArea,
}) => {
  const { mutate: addCard } = useAddCard(boardId, listId);
  const [cardTitleVal, setCardTitleVal] = useState("");

  const handleAddCard = () => {
    if (!cardTitleVal.trim()) return;

    addCard(
      { title: cardTitleVal.trim() },
      {
        onSuccess: () => {
          setCardTitleVal("");
          addCardTextAreaRef.current?.focus();
        },
      },
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddCard();
    }
    if (e.key === "Escape") {
      closeAddCardArea();
      setCardTitleVal("");
    }
  };

  return (
    <div
      ref={addCardRef}
      className={`add-card ${showAddCardArea ? "" : "hidden"}`}
    >
      <textarea
        ref={addCardTextAreaRef}
        name="addCard"
        id="addCard"
        className="w-full p-2 bg-white rounded-md overflow-hidden"
        value={cardTitleVal}
        onChange={(e) => setCardTitleVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title or paste a link"
      ></textarea>
      <div className="add-card__buttons flex justify-start items-center gap-x-2">
        <button
          type="button"
          className="rounded-md overflow-hidden"
          onClick={handleAddCard}
        >
          <div
            className={`${FLEX_ALIGN_STYLE} p-1.5 font-bold text-white bg-[#0c66e4] hover:bg-[#1558BC] cursor-pointer`}
          >
            <span>Add card</span>
          </div>
        </button>
        <button
          type="button"
          className="rounded-md overflow-hidden"
          onClick={closeAddCardArea}
        >
          <span
            className={`${FLEX_ALIGN_STYLE} p-1.5 font-bold hover:bg-black/5 cursor-pointer`}
          >
            <CloseIcon />
          </span>
        </button>
      </div>
    </div>
  );
};

export default AddCardArea;
