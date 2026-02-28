import { useQueryClient } from "@tanstack/react-query";
import { useChangeListDetail } from "@/src/hooks/list/useChangeListDetail";
import CheckIcon from "@/src/components/common/icons/CheckIcon";

const ListActionsMenu = ({
  colors,
  currentColor,
  changeListColor,
  callAddCard,
  boardId,
  listId,
}) => {
  const queryClient = useQueryClient();
  const { mutate } = useChangeListDetail(boardId, listId);

  function archiveThisList() {
    mutate(
      {
        id: listId,
        is_archived: true,
      },
      {
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: ["archivedLists", Number(boardId)],
          });
          queryClient.invalidateQueries({
            queryKey: ["listsWithCards", Number(boardId)],
          });
        },
      },
    );
  }

  return (
    <div className="menu">
      <div className="menu__wrapper px-2 pb-2">
        <div className="menu__rows border-b border-b-[#dcdddd] my-1.5">
          <ul className="-mx-2">
            <li>
              <button
                type="button"
                className="flex w-full py-1.5 px-3 hover:bg-gray-200 cursor-pointer"
                onClick={callAddCard}
              >
                Add card
              </button>
            </li>
          </ul>
        </div>
        <div className="menu__rows border-b border-b-[#dcdddd] my-1.5">
          <strong>Change list color</strong>
          <div className="palette mt-2 mb-3">
            <ul className="grid grid-cols-5 gap-1.5">
              {colors.map((c) => (
                <li key={c.name} className="w-full">
                  <button
                    type="button"
                    className="relative w-full h-9 block cursor-pointer"
                    onClick={() => changeListColor(c.name)}
                  >
                    <div
                      style={{
                        backgroundColor: c.cover,
                      }}
                      className="w-full h-full rounded-sm"
                    ></div>
                    {c.name === currentColor && (
                      <span className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
                        <CheckIcon color={"#fff"} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="menu__rows border-b border-b-[#dcdddd] my-1.5">
          <ul className="-mx-2">
            <li>
              <button
                type="button"
                className="flex w-full py-1.5 px-3 hover:bg-gray-200 cursor-pointer"
                onClick={archiveThisList}
              >
                Archive this list
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default ListActionsMenu;
