import { useState, useRef, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCardDetail } from "@/src/hooks/card/useCardDetail";
import { useChangeCardDetail } from "@/src/hooks/card/useChangeCardDetail";
import { useCardLogs } from "@/src/hooks/card/useCardLogs";
import { useCardComments } from "@/src/hooks/card/useCardComments";
import ModalActivity from "@/src/components/common/modal/ModalActivity";
import GalleryIcon from "@/src/components/common/icons/GalleryIcon";
import CloseIcon from "@/src/components/common/icons/CloseIcon";
import TextIcon from "@/src/components/common/icons/TextIcon";
import CheckOn from "@/src/components/common/icons/CheckOn";
import CheckOff from "@/src/components/common/icons/CheckOff";

const FLEX_ALIGN_CENTER = "inline-flex justify-center items-center";

const Modal = () => {
  const modalRef = useRef(null);
  const location = useLocation();
  const boardSlug = location.state?.boardSlug;
  const navigate = useNavigate();
  const { boardId, listId, cardId } = useParams();
  const [titleTextAreaVal, setTitleTextAreaVal] = useState();
  const [textAreaVal, setTextAreaVal] = useState();
  const [showTextArea, setShowTextArea] = useState(false);

  const { data } = useCardDetail(boardId, listId, cardId);
  const { title, is_complete: isComplete, desc } = data || {};

  const { mutate } = useChangeCardDetail(
    Number(boardId),
    Number(listId),
    Number(cardId),
  );

  const { data: logs, isLoading: cardActivityLoading } = useCardLogs(cardId);
  const { data: comments, isLoading: commentsLoading } =
    useCardComments(cardId);

  const timeline = useMemo(() => {
    return [...(logs ?? []), ...(comments ?? [])].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [logs, comments]);

  const handleClose = () => {
    navigate(`/board/${boardId}/${boardSlug}`);
  };

  function onBlurTitle() {
    if (!titleTextAreaVal || titleTextAreaVal === title) return;

    mutate(
      { titleVal: titleTextAreaVal },
      {
        onError: () => {
          setTitleTextAreaVal(title);
        },
      },
    );
  }

  function saveTextAreaVal() {
    mutate(
      { descVal: textAreaVal },
      {
        onSuccess: () => setShowTextArea(false),
        onError: () => setTextAreaVal(desc),
      },
    );
  }

  const closeModal = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) handleClose();
  };

  return (
    <div className="modal-layout fixed top-0 right-0 bottom-0 left-0 z-3">
      <div className="dim w-full h-full bg-black/30" onClick={closeModal}>
        <div className="dim__gutter flex justify-center py-20 w-full px-2">
          <div
            ref={modalRef}
            className="modal inline-block max-w-[1080px] w-full rounded-xl bg-white"
          >
            <div className="modal__header flex justify-between items-center border-b border-b-[#0B120E24] p-4">
              <div className="header__left">
                <button type="button">
                  <span>Today</span>
                </button>
              </div>
              <div className="header__right inline-flex items-center">
                <ul className={`${FLEX_ALIGN_CENTER} gap-x-3`}>
                  <li className={`${FLEX_ALIGN_CENTER}`}>
                    <button
                      type="button"
                      className="header-button header-button--close cursor-pointer"
                    >
                      <span className="header-button__content">
                        <GalleryIcon />
                      </span>
                    </button>
                  </li>
                  <li className={`${FLEX_ALIGN_CENTER}`}>
                    <button
                      type="button"
                      className="header-button header-button--close cursor-pointer"
                      onClick={handleClose}
                    >
                      <span className="header-button__content">
                        <CloseIcon />
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <div className="modal__body flex justify-between">
              <div className="desc-area flex-50 p-5">
                <div className="desc-area__top flex justify-center items-start gap-x-1 mb-8">
                  <div
                    className={`${FLEX_ALIGN_CENTER} desc-area__check px-2 h-16`}
                  >
                    <span className="title-check inline-flex w-4 h-4">
                      {isComplete ? <CheckOn /> : <CheckOff />}
                    </span>
                  </div>
                  <textarea
                    key={cardId + (title || "")}
                    name="titleTextArea"
                    id="titleTextArea"
                    className="desc-area__title flex-100 px-1 py-2 text-[28px] font-bold resize-none"
                    defaultValue={title}
                    onChange={(e) => {
                      setTitleTextAreaVal(e.target.value);
                    }}
                    onBlur={onBlurTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  ></textarea>
                </div>
                <div className="desc-area__bottom">
                  <div className="desc-area__title flex justify-between items-center w-full mb-3">
                    <div className="desc-title__left flex justify-between items-center gap-x-2">
                      <span
                        className={`${FLEX_ALIGN_CENTER} desc-area__icon w-4 h-4`}
                      >
                        <TextIcon />
                      </span>
                      <strong className="w-full">Description</strong>
                    </div>
                    <div className="desc-title__right">
                      <button
                        type="button"
                        className="rounded-md overflow-hidden"
                        onClick={() => {
                          if (!showTextArea) {
                            setShowTextArea(true);
                            setTextAreaVal(desc);
                          }
                        }}
                      >
                        <span
                          className={`${FLEX_ALIGN_CENTER} py-1 px-2 bg-black/5 hover:bg-black/10 font-semibold cursor-pointer`}
                        >
                          Edit
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="desc">
                    <div
                      className={`desc-button ${showTextArea ? "hidden" : ""}`}
                    >
                      {desc ? (
                        <button
                          type="button"
                          className="w-full text-left cursor-pointer"
                          onClick={() => {
                            setShowTextArea(true);
                            setTextAreaVal(desc);
                          }}
                        >
                          <div className="desc-button pt-2 px-3 pb-8">
                            <p>{desc}</p>
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="w-full text-left border rounded-md border-[#8C8F97] cursor-pointer hover:bg-black/5"
                          onClick={() => setShowTextArea(true)}
                        >
                          <div className="desc-button pt-2 px-3 pb-8">
                            <p>Add a more detailed description....</p>
                          </div>
                        </button>
                      )}
                    </div>
                    {showTextArea && (
                      <div className="text-area">
                        <textarea
                          name="cardDesc"
                          id="cardDesc"
                          value={textAreaVal}
                          onChange={(e) => setTextAreaVal(e.target.value)}
                          placeholder="Need formatting help? Type /help."
                          className="w-full h-22 p-3 border border-[#8C8F97] resize-none"
                        ></textarea>
                        <div className="textarea-buttons">
                          <ul className="flex justify-left items-center gap-x-2">
                            <li className={`${FLEX_ALIGN_CENTER}`}>
                              <button
                                type="button"
                                className="rounded-md overflow-hidden"
                                onClick={saveTextAreaVal}
                              >
                                <span
                                  className={`${FLEX_ALIGN_CENTER} p-1.5 font-bold text-white bg-[#0c66e4] hover:bg-[#1558BC] cursor-pointer`}
                                >
                                  Save
                                </span>
                              </button>
                            </li>
                            <li className="inline-flex justify-center items-center">
                              <button
                                type="button"
                                className="rounded-md overflow-hidden"
                                onClick={() => setShowTextArea(false)}
                              >
                                <span
                                  className={`${FLEX_ALIGN_CENTER} p-1.5 font-bold bg-black/5 hover:bg-black/10 cursor-pointer`}
                                >
                                  Cancel
                                </span>
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="comment-area flex-50 bg-[#f8f8f8] border-l border-l-[#0B120E24] max-h-[600px] overflow-y-auto">
                {cardActivityLoading || commentsLoading ? (
                  <p>Loading...</p>
                ) : (
                  <ModalActivity
                    timeline={timeline}
                    boardId={boardId}
                    listId={listId}
                    cardId={cardId}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Modal;
