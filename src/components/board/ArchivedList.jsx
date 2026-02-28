import { useDeleteArchivedItem } from "@/src/hooks/archive/useDeleteArchivedItem";
import { useRestoreArchivedItem } from "@/src/hooks/archive/useRestoreArchivedItem";
import RestoreIcon from "@/src/components/common/icons/RestoreIcon";
import DeleteIcon from "@/src/components/common/icons/DeleteIcon";

const ArchivedList = ({ data, itemType, boardId }) => {
  const { mutate: deleteMutate } = useDeleteArchivedItem(boardId);
  const { mutate: restoreMutate } = useRestoreArchivedItem(boardId);

  function restoreItem() {
    restoreMutate({
      id: data.id,
      itemType,
    });
  }

  function deleteItem() {
    deleteMutate({
      id: data.id,
      itemType,
    });
  }

  return (
    <div className="item mb-3">
      <div className="item__card">
        <div className="card__wrapper flex w-full justify-between items-center px-3 py-2">
          <div className="card__content text-sm">{data.title}</div>
          <div className="card__buttons">
            <ul className="flex w-full justify-start items-cetner gap-x-2">
              <li>
                <button
                  type="button"
                  className="inlin-flex cursor-pointer group rounded-md overflow-hidden"
                  onClick={restoreItem}
                >
                  <div className="inline-flex justify-center items-center gap-x-1.5 px-2 py-2 bg-black/10 group-hover:bg-black/20 font-semibold">
                    <span className="inline-flex justify-center items-center w-4 h-4">
                      <RestoreIcon />
                    </span>
                    <span className="inline-flex text-xs">Restore</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="inlin-flex cursor-pointer group rounded-md overflow-hidden group"
                  onClick={deleteItem}
                >
                  <div className="inline-flex justify-center items-center gap-x-1.5 px-2 py-2 bg-black/10 group-hover:bg-black/20 font-semibold">
                    <span className="inline-flex justify-center items-center w-4 h-4">
                      <DeleteIcon />
                    </span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ArchivedList;
