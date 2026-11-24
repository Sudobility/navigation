import { createStore, type StoreApi } from "zustand/vanilla";
import type { NavBarSpec, ScreenEntry, ScreenInput } from "./types";

/**
 * The last stack operation, so a view can choose how to animate it: `push`/`pop` slide, while
 * `replace`/`reset` are programmatic swaps that should not. `init` is the state at construction.
 * (`popToRoot`/`popTo` report as `pop` — they remove from the top like a pop.)
 */
export type NavOp = "init" | "push" | "pop" | "replace" | "reset" | "setNav";

export interface NavState {
  /** Bottom-to-top. The last element is the visible screen. Never empty after construction. */
  stack: ScreenEntry[];
  /** How `stack` last changed. A view reads this to decide whether/how to animate the change. */
  lastOp: NavOp;
  /** Push a new screen onto the stack (it becomes the visible screen). */
  push(entry: ScreenInput): void;
  /** Pop the top screen. No-op at the root — a stack of one is never emptied. */
  pop(): void;
  /** Pop every screen above the root. */
  popToRoot(): void;
  /**
   * Pop back to the nearest screen matching `keyOrId` (by `id` first, then by `key`). No-op when
   * nothing matches or the match is already on top.
   */
  popTo(keyOrId: string): void;
  /** Replace the top screen in place (no new level is added). */
  replace(entry: ScreenInput): void;
  /** Replace the whole stack. Must be non-empty. */
  reset(entries: ScreenInput[]): void;
  /** Merge a partial nav-bar spec into one screen (by id) — e.g. a dynamic title or action set. */
  setNav(id: string, nav: Partial<NavBarSpec>): void;
  /** True when there is a screen to go back to. */
  canGoBack(): boolean;
  /** The visible (top) screen, or `null` only if the stack were ever empty. */
  current(): ScreenEntry | null;
}

export type NavStore = StoreApi<NavState>;

let seq = 0;
/** Monotonic instance id, prefixed so it never collides with a caller-supplied id by accident. */
const nextId = (): string => `nav_${Date.now().toString(36)}_${(seq++).toString(36)}`;

const materialize = (e: ScreenInput): ScreenEntry => ({ ...e, id: e.id ?? nextId() });

/**
 * Create a navigation stack store. Framework-agnostic (zustand vanilla): bind it into React with
 * zustand's `useStore(store, selector)` — identically on web and React Native. `initial` seeds the
 * stack and must be non-empty, because the root screen is always present.
 */
export function createNavStore(initial: ScreenInput[]): NavStore {
  if (initial.length === 0) {
    throw new Error("createNavStore: the initial stack must be non-empty");
  }
  return createStore<NavState>((set, get) => ({
    stack: initial.map(materialize),
    lastOp: "init",
    push(entry) {
      set({ stack: [...get().stack, materialize(entry)], lastOp: "push" });
    },
    pop() {
      const s = get().stack;
      if (s.length <= 1) return;
      set({ stack: s.slice(0, -1), lastOp: "pop" });
    },
    popToRoot() {
      const s = get().stack;
      if (s.length <= 1) return;
      set({ stack: [s[0]], lastOp: "pop" });
    },
    popTo(keyOrId) {
      const s = get().stack;
      let i = s.findIndex((e) => e.id === keyOrId);
      if (i === -1) i = s.findIndex((e) => e.key === keyOrId);
      if (i === -1 || i === s.length - 1) return;
      set({ stack: s.slice(0, i + 1), lastOp: "pop" });
    },
    replace(entry) {
      const s = get().stack;
      set({ stack: [...s.slice(0, -1), materialize(entry)], lastOp: "replace" });
    },
    reset(entries) {
      if (entries.length === 0) {
        throw new Error("NavStore.reset: the stack must be non-empty");
      }
      set({ stack: entries.map(materialize), lastOp: "reset" });
    },
    setNav(id, nav) {
      set({
        stack: get().stack.map((e) =>
          e.id === id ? { ...e, nav: { ...e.nav, ...nav } } : e
        ),
        lastOp: "setNav",
      });
    },
    canGoBack() {
      return get().stack.length > 1;
    },
    current() {
      const s = get().stack;
      return s.length ? s[s.length - 1] : null;
    },
  }));
}
