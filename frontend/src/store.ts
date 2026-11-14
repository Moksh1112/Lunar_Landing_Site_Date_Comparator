import { create } from "zustand";

// Minimal store for S0 (expert flag only). The full store from PLAN.md §3.3 arrives in S1.1.
type UiState = {
  expert: boolean;
  setExpert: (expert: boolean) => void;
};

export const useStore = create<UiState>((set) => ({
  expert: false,
  setExpert: (expert) => set({ expert }),
}));
