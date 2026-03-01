import { useState } from "react";
import CommentIcon from "@/src/components/common/icons/CommentIcon";
import ModalActivityItem from "@/src/components/common/modal/ModalActivityItem";
import ModalActivityInput from "./ModalActivityInput";

const ModalActivity = ({ timeline, boardId, listId, cardId }) => {
  const [isShow, setIsShow] = useState(false);
  return (
    <div className="activity h-full p-4">
      <div className="activity__header mb-3">
        <div className="activity__title inline-flex justify-between items-center gap-x-2">
          <span className="inline-flex justify-center items-center w-4 h-4">
            <CommentIcon />
          </span>
          <strong>Comments and activity</strong>
        </div>
        <div className="activity__button"></div>
      </div>
      <div className="activity__comment mb-3">
        <div className="comment">
          <div className={`comment__button ${isShow ? "hidden" : ""}`}>
            <button
              type="button"
              className="flex w-full rounded-xl overflow-hidden cursor-pointer shadow-[0px_1px_1px_#1E1F2140,0px_0px_1px_#1E1F214F] group"
              onClick={() => setIsShow(true)}
            >
              <span className="inline-flex w-full px-3 py-2 text-[#626f86] text-sm bg-white group-hover:text-[#292a2e] group-hover:bg-[#f7f8f9]">
                Write a comment...
              </span>
            </button>
          </div>
          <ModalActivityInput
            isShow={isShow}
            setIsShow={setIsShow}
            boardId={boardId}
            listId={listId}
            cardId={cardId}
            type="insert"
          />
        </div>
      </div>
      <div className="activity__body">
        <ul>
          {timeline?.map((item) => (
            <li key={`${item.action}-${item.id}`}>
              <ModalActivityItem
                item={item}
                boardId={boardId}
                listId={listId}
                cardId={cardId}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ModalActivity;
