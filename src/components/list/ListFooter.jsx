import AddCardArea from "@/src/components/list/AddCardArea";
import PlusIcon from "@/src/components/common/icons/PlusIcon";
import TemplateIcon from "@/src/components/common/icons/TemplateIcon";

const FLEX_ALIGN_STYLE = "inline-flex justify-center items-center";

const ListFooter = ({
  addCardRef,
  addCardTextAreaRef,
  boardId,
  listId,
  openAddCardArea,
  showAddCardArea,
  closeAddCardArea,
  activeAddCardArea,
}) => {
  return (
    <div className="board-list__footer">
      <AddCardArea
        addCardRef={addCardRef}
        boardId={boardId}
        listId={listId}
        showAddCardArea={showAddCardArea}
        addCardTextAreaRef={addCardTextAreaRef}
        closeAddCardArea={closeAddCardArea}
      />
      {activeAddCardArea !== "top" && (
        <div
          className={`board-list__buttons flex justify-between items-center mt-2 ${showAddCardArea ? "hidden" : ""}`}
        >
          <button
            type="button"
            className={`${FLEX_ALIGN_STYLE} w-full justify-start p-2 hover:bg-black/5 rounded-md text-[#44546F] cursor-pointer`}
            onClick={openAddCardArea}
          >
            <PlusIcon color={"#44546F"} />
            <span className="ml-2 text-sm font-semibold">Add a card</span>
          </button>
          {/* <button
                type="button"
                className={`${FLEX_ALIGN_STYLE} p-2 hover:bg-black/5 rounded-md cursor-pointer`}
              >
                <TemplateIcon />
              </button> */}
        </div>
      )}
    </div>
  );
};

export default ListFooter;
