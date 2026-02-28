import { Link, useLocation, matchPath } from "react-router-dom";
import { useDeleteArchivedItem } from "@/src/hooks/archive/useDeleteArchivedItem";
import { useRestoreArchivedItem } from "@/src/hooks/archive/useRestoreArchivedItem";
import ArchiveIcon from "@/src/components/common/icons/ArchiveIcon";

const ArchivedCard = ({ data, itemType, boardId, setButtonAnchorEl }) => {
  const location = useLocation();
  const { mutate: deleteMutate } = useDeleteArchivedItem(boardId);
  const { mutate: restoreMutate } = useRestoreArchivedItem(boardId);

  const match =
    matchPath("/board/:boardId/:boardSlug", location.pathname) ||
    matchPath("/card/:boardId/:listId/:cardId", location.pathname);

  const params = match?.params;
  const boardSlug = params?.boardSlug;

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
        <Link
          to={`/card/${boardId}/${data.list_id}/${data.id}`}
          state={{ backgroundLocation: location, boardSlug }}
          type="button"
          className="block w-full text-left card shadow-[0px_1px_1px_#1E1F2140,0px_0px_1px_#1E1F214F] rounded-xl cursor-pointer hover:outline-[2px] hover:outline-[#388bff]"
          onClick={() => setButtonAnchorEl(null)}
        >
          <div className="card__wrapper px-3 py-2">
            <div className="card__content text-sm">{data.title}</div>
            <div className="card__status flex mt-1">
              <span className="inline-flex items-center gap-x-2 text-[#505258]">
                <span className="inline-flex justify-center items-center w-4 h-4">
                  <ArchiveIcon />
                </span>
                <span className="text-sm">Archived</span>
              </span>
            </div>
          </div>
        </Link>
      </div>
      <div className="item__buttons py-1 px-2">
        <ul className="flex w-full justify-start items-cetner">
          <li>
            <button
              type="button"
              className="inlin-flex cursor-pointer group"
              onClick={restoreItem}
            >
              <span className="inline-flex px-1 font-regular text-sm group-hover:text-[#0c66e4] group-hover:underline">
                Restore
              </span>
            </button>
          </li>
          <li>•</li>
          <li>
            <button
              type="button"
              className="inlin-flex cursor-pointer group"
              onClick={deleteItem}
            >
              <span className="inline-flex px-1 font-regular text-sm group-hover:text-[#0c66e4] group-hover:underline">
                Delete
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};
export default ArchivedCard;
