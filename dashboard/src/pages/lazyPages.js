import { lazy } from "react";

export const ComparePage = lazy(() => import("./ComparePage"));
export const ConfigPage = lazy(() => import("./ConfigPage"));
export const ChatPage = lazy(() => import("./ChatPage"));
export const ModelsPage = lazy(() => import("./ModelsPage"));
export const StatsPage = lazy(() => import("./StatsPage"));
export const StatusPage = lazy(() => import("./StatusPage"));

const PAGE_PRELOADERS = {
  compare: () => import("./ComparePage"),
  config: () => import("./ConfigPage"),
  chat: () => import("./ChatPage"),
  models: () => import("./ModelsPage"),
  stats: () => import("./StatsPage"),
  status: () => import("./StatusPage"),
};

const PRELOADED_PAGES = new Set();

export function preloadPage(pageId) {
  const load = PAGE_PRELOADERS[pageId];
  if (!load || PRELOADED_PAGES.has(pageId)) return;
  PRELOADED_PAGES.add(pageId);
  load().catch(() => {
    PRELOADED_PAGES.delete(pageId);
  });
}
