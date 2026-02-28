import { useState } from "react";
import { useAddList } from "@/src/hooks/list/useAddList";
import PlusIcon from "@/src/components/common/icons/PlusIcon";
import CloseIcon from "@/src/components/common/icons/CloseIcon";

const AddListButton = ({ isShow, setIsShow, boardId, lastPosition }) => {
  const [textAreaVal, setTextAreaVal] = useState("");

  const { mutate } = useAddList(boardId);

  function addList() {
    const prevTitle = textAreaVal;
    mutate(
      {
        listTitle: textAreaVal,
        lastPosition,
      },
      {
        onError: () => setTextAreaVal(prevTitle),
      },
    );
    setIsShow(false);
    setTextAreaVal("");
  }

  return (
    <li className="px-2 w-[272px]">
      <div
        className={`add-list w-full rounded-lg overflow-hidden ${isShow ? "" : "hidden"}`}
      >
        <div className="add-list__wrapper p-2 bg-[#f1f2f4]">
          <div className="add-list__text">
            <textarea
              name="add-list-textarea"
              id="add-list-text"
              className="bg-white w-full"
              value={textAreaVal}
              onChange={(e) => setTextAreaVal(e.target.value)}
            ></textarea>
          </div>
          <div className="add-list__button">
            <ul className="flex justify-start items-center gap-x-1.5">
              <li className="inline-flex">
                <button
                  type="button"
                  className="rounded-md overflow-hidden cursor-pointer"
                  onClick={addList}
                >
                  <span className="inline-flex justify-center items-center px-3 py-2 font-bold text-white text-sm bg-[#0055cc]">
                    Add list
                  </span>
                </button>
              </li>
              <li className="inline-flex">
                <button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => setIsShow(false)}
                >
                  <span>
                    <CloseIcon />
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <button
        type="button"
        className={`add-button w-full rounded-xl overflow-hidden ${isShow ? "hidden" : ""}`}
        onClick={() => setIsShow(true)}
      >
        <div className="add-button__wrapper inline-flex justify-start items-center gap-x-1.5 w-full p-3 bg-white/30 hover:bg-white/25 text-white font-semibold cursor-pointer">
          <span className="add-button__icon">
            <PlusIcon color={"white"} />
          </span>
          <span className="add-button__text">Add another list</span>
        </div>
      </button>
    </li>
  );
};
export default AddListButton;
