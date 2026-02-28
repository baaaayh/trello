import { useEffect, useRef, useCallback } from "react";

function SplitLayout({ left, right, divide, leftWidth, setLeftWidth }) {
  const isDragging = useRef(false);
  const leftRef = useRef(null);
  const containerRef = useRef(null);

  const containerLeft = useRef(0);
  const containerWidth = useRef(0);
  const latestX = useRef(0);
  const frame = useRef(null);

  // 현재 드래그 중인 너비를 실시간으로 저장하는 Ref
  const currentTempWidth = useRef(leftWidth);

  const handleMouseDown = () => {
    if (!containerRef.current || !divide) return;

    const rect = containerRef.current.getBoundingClientRect();
    containerLeft.current = rect.left;
    containerWidth.current = rect.width;

    isDragging.current = true;

    // 드래그 시작 시 transition 즉시 제거 (버벅임 및 튕김 방지)
    if (leftRef.current) {
      leftRef.current.style.transition = "none";
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const updateWidth = useCallback(() => {
    if (!isDragging.current) return;

    const paddingOffset = divide ? 12 : 0;
    let newWidth = latestX.current - containerLeft.current - paddingOffset;

    const min = 240;
    const max = containerWidth.current - paddingOffset * 2 - 240;

    if (newWidth < min) newWidth = min;
    if (newWidth > max) newWidth = max;

    // 1. Ref 업데이트 (가장 중요: MouseUp 시 이 값을 사용함)
    currentTempWidth.current = newWidth;

    // 2. DOM 직접 수정 (즉각적인 시각적 반응)
    if (leftRef.current) {
      leftRef.current.style.width = `${newWidth}px`;
    }

    // 3. 실시간 상태 업데이트 (선택 사항: Contents의 스크롤바 동기화용)
    setLeftWidth(newWidth);

    frame.current = null;
  }, [divide, setLeftWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      latestX.current = e.clientX;

      if (!frame.current) {
        frame.current = requestAnimationFrame(updateWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        // 드래그 종료 시 최종적으로 결정된 너비를 상태에 고정
        if (currentTempWidth.current) setLeftWidth(currentTempWidth.current);
      }

      isDragging.current = false;

      // transition 복구 (상태 업데이트 후 렌더링이 완료될 때까지 약간의 지연을 줌)
      setTimeout(() => {
        if (leftRef.current) {
          leftRef.current.style.transition = "";
        }
      }, 0);

      document.body.style.userSelect = "auto";
      document.body.style.cursor = "default";

      if (frame.current) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [divide, setLeftWidth, updateWidth]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 transition-[padding] duration-300 overflow-hidden ${divide ? "px-3 py-2" : "p-0"}`}
    >
      <div
        ref={leftRef}
        style={{ width: leftWidth }}
        className="shrink-0 transition-all duration-300"
      >
        {left}
      </div>

      {divide && (
        <div
          onMouseDown={handleMouseDown}
          className="relative w-2 mx-1 cursor-col-resize group shrink-0 z-2"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gray-300 group-hover:bg-blue-500 transition-colors" />
        </div>
      )}

      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${
          divide ? "rounded-[20px]" : ""
        }`}
      >
        {right}
      </div>
    </div>
  );
}

export default SplitLayout;
