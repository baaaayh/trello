import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Card from "@/src/components/card/Card";
import AddCardArea from "@/src/components/list/AddCardArea";

const ListBody = ({
  cards,
  boardSlug,
  addCardRef,
  boardId,
  listId,
  showAddCardArea,
  addCardTextAreaRef,
  closeAddCardArea,
}) => {
  return (
    <div className="board-list__body p-1 min-h-[10px]">
      <SortableContext
        items={cards?.map((card) => card.id) || []}
        strategy={verticalListSortingStrategy}
      >
        <ul>
          <li className="mb-2">
            <AddCardArea
              addCardRef={addCardRef}
              boardId={boardId}
              listId={listId}
              showAddCardArea={showAddCardArea}
              addCardTextAreaRef={addCardTextAreaRef}
              closeAddCardArea={closeAddCardArea}
            />
          </li>
          {cards
            ?.filter((card) => !card.is_archived && !card.is_inbox)
            .map((card) => (
              <li key={`card-${card.id}`} className="mb-2">
                <Card data={card} boardSlug={boardSlug} />
              </li>
            ))}
        </ul>
      </SortableContext>
    </div>
  );
};
export default ListBody;
