import { create } from "zustand";

const useAuthStore = create((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  logout: () => set({ session: null, user: null }),
}));

export default useAuthStore;
