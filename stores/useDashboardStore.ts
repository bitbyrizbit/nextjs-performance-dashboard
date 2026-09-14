import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DashboardState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  filters: {
    status: string;
    search: string;
  };
  setFilter: (key: keyof DashboardState["filters"], value: string) => void;
  items: any[];
  setItems: (items: any[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      filters: {
        status: "all",
        search: "",
      },
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      items: [],
      setItems: (items) => set({ items }),
    }),
    {
      name: "dashboard-storage",
      partialize: (state) => ({ filters: state.filters }), // Only persist filters
    }
  )
);
