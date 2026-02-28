import { useCallback } from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";
import Portal from "@/src/components/common/Portal";
import CloseIcon from "@/src/components/common/icons/CloseIcon";

const PopOver = ({ anchorEl, onClose, title, children, width }) => {
  const { refs, floatingStyles, context } = useFloating({
    width: width ? width + "px" : "304px",
    open: Boolean(anchorEl),
    onOpenChange: (open) => {
      if (!open && typeof onClose === "function") {
        onClose();
      }
    },
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
    middleware: [offset(8), flip(), shift({ padding: 10 })],
    elements: {
      reference: anchorEl,
    },
  });

  const dismiss = useDismiss(context, {
    outsidePress: true,
    outsidePressEvent: "mousedown",
  });

  const { getFloatingProps } = useInteractions([dismiss]);

  const setFloatingRef = useCallback(
    (node) => {
      refs.setFloating(node);
    },
    [refs],
  );

  if (!anchorEl) return null;

  return (
    <Portal>
      <div
        ref={setFloatingRef}
        style={{
          ...floatingStyles, // 1. floating-ui가 계산한 x, y 좌표
          width: width ? `${width}px` : "304px", // 2. 여기서 직접 width를 지정
          zIndex: 100,
        }}
        {...getFloatingProps()}
        className="z-[999] rounded-md overflow-hidden bg-white shadow-[0_8px_12px_#1E1F2126,0_0_1px_#1E1F214F] outline-none"
      >
        <div className="popover__wrapper">
          <div className="popover__header relative">
            <h2 className="flex justify-center items-center h-10 px-10 font-semibold text-sm text-[#44546F]">
              {title}
            </h2>
            <button
              type="button"
              className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded cursor-pointer"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="popover__body">{children}</div>
        </div>
      </div>
    </Portal>
  );
};

export default PopOver;
