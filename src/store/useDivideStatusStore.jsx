import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useDevideStatusStore = create(
  persist(
    (set, get) => ({
      divideStatus: {
        inbox: false,
        board: true,
      },
      divide: false,
      leftWidth: 0,
      lastValidWidth: 320,

      setLeftWidth: (width) =>
        set({
          leftWidth: width,
          lastValidWidth:
            typeof width === "number" && width > 0
              ? width
              : get().lastValidWidth,
        }),

      setDivideStatus: (key, value) =>
        set((state) => {
          const newStatus = { ...state.divideStatus, [key]: value };

          const activeCount = Object.values(newStatus).filter(Boolean).length;
          if (activeCount < 1) return state;

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

      toggleDivide: () => set((state) => ({ divide: !state.divide })),
    }),
    {
      name: "devide-layout-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useDevideStatusStore;
