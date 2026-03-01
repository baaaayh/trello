import { useDeleteCardComment } from "@/src/hooks/card/useDeleteCardComment";
import { formatTime } from "@/src/utils/formatTime";
import ModalActivityInput from "./ModalActivityInput";

const ModalActivityCard = ({
  isShow,
  setIsShow,
  item,
  boardId,
  listId,
  cardId,
}) => {
  const { mutate: deleteComment } = useDeleteCardComment(cardId);

  function handleDelete() {
    deleteComment({ commentId: item.id });
  }

  return (
    <div className="activity-card">
      <ModalActivityInput
        isShow={isShow}
        setIsShow={setIsShow}
        boardId={boardId}
        listId={listId}
        cardId={cardId}
        commentId={item.id}
        content={item.content}
        type="update"
      />
      <div className={`${isShow ? "hidden" : ""}`}>
        <div className="activity-card__top flex justify-start items-center gap-x-2">
          <b className="text-[15px]">김주형</b>
          <p className="text-xs text-[#0c66e4]">
            {formatTime(item.created_at)}{" "}
            {item.updated_at && item.updated_at !== item.created_at && (
              <span
                className="text-[#626f86] cursor-help"
                title={formatTime(item.updated_at)}
              >
                (edited)
              </span>
            )}
          </p>
        </div>
        <div className="activity-card__bottom mt-1">
          <div className="activity-card__card">
            <div className="card bg-white rounded-xl shadow-[0px_1px_1px_#1E1F2140,0px_0px_1px_#1E1F214F] px-3 py-2 text-sm">
              {item.content}
            </div>
          </div>
          <div className="activify-card__buttons pl-1">
            <ul className="flex justify-start items-center gap-x-1.5">
              <li>
                <button
                  type="button"
                  className="inline-flex jusitfy-center items-center cursor-pointer"
                  onClick={() => setIsShow(true)}
                >
                  <span className="inline-flex jusitfy-center items-center text-xs text-[#505258] font-regular underline">
                    Edit
                  </span>
                </button>
              </li>
              <li>•</li>
              <li>
                <button
                  type="button"
                  className="inline-flex jusitfy-center items-center cursor-pointer"
                  onClick={handleDelete}
                >
                  <span className="inline-flex jusitfy-center items-center text-xs text-[#505258] font-regular underline">
                    Delete
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalActivityCard;
