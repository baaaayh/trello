import { useState } from "react";
import ModalActivityText from "@/src/components/common/modal/ModalActivityText";
import ModalActivityCard from "@/src/components/common/modal/ModalActivityCard";

const ModalActivityItem = ({ item, boardId, listId, cardId }) => {
  const [isShow, setIsShow] = useState(false);
  return (
    <div className="item py-1.5">
      <div className="item__wrapper flex justify-between gap-x-2">
        <div className="item__image inline-flex items-start">
          <span className="user-button__icon inline-flex w-7 h-7 bg-[url('@/src/assets/icon/icon_user.png')] bg-contain bg-center text-[0px]">
            User
          </span>
        </div>
        <div className="item__content flex-1">
          {item.action !== "comment" ? (
            <ModalActivityText item={item} />
          ) : (
            <ModalActivityCard
              isShow={isShow}
              setIsShow={setIsShow}
              item={item}
              boardId={boardId}
              listId={listId}
              cardId={cardId}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default ModalActivityItem;
