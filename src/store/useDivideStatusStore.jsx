import { create } from "zustand";

// 1. 초기 상태 정의
const INITIAL_STATUS = {
  inbox: true,
  board: true,
};

// 2. 초기 상태에 따른 초기 너비 계산 함수
const getInitialWidth = (status) => {
  if (!status.inbox) return 0;
  if (!status.board) return "100%";
  return 320;
};

const useDevideStatusStore = create((set) => ({
  divide: INITIAL_STATUS.inbox && INITIAL_STATUS.board,
  divideStatus: INITIAL_STATUS,
  leftWidth: getInitialWidth(INITIAL_STATUS),
  lastValidWidth: 320,

  setLeftWidth: (width) =>
    set({
      leftWidth: width,
      lastValidWidth: typeof width === "number" && width > 0 ? width : 320,
    }),

  setDivideStatus: (key, value) =>
    set((state) => {
      const activeCount = Object.values(state.divideStatus).filter(
        Boolean,
      ).length;

      // 최소 하나는 켜져 있어야 함
      if (!value && activeCount <= 1) return state;

      const newStatus = { ...state.divideStatus, [key]: value };
      const shouldDivide = newStatus.inbox && newStatus.board;

      let nextWidth;
      if (!newStatus.inbox) {
        nextWidth = 0;
      } else if (!newStatus.board) {
        nextWidth = "100%";
      } else {
        nextWidth = state.lastValidWidth;
      }

      return {
        divideStatus: newStatus,
        divide: shouldDivide,
        leftWidth: nextWidth,
      };
    }),

  toggleDivide: () =>
    set((state) => ({
      divide: !state.divide,
    })),
}));

export default useDevideStatusStore;
