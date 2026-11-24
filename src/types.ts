/**
 * Framework-agnostic navigation vocabulary. These types describe DATA only — never React or
 * React Native elements — so the same screen stack can drive a web `SlidingPanel` and a React
 * Navigation header without either platform leaking into the model. A title or action that must
 * be a fully composed component is supplied by the view layer via render overrides keyed on the
 * screen's `key`, not stored here.
 */

/** A tappable item in the nav bar (an icon button) — most often a right-side action. */
export interface NavAction {
  /** Stable id, unique within a screen's action list. */
  id: string;
  /** Accessibility label / tooltip (and the fallback visible text when no icon resolves). */
  label: string;
  /** Icon name resolved by the view's icon map. Omit for a text-only action. */
  iconName?: string;
  /** Invoked on press/click. */
  onPress: () => void;
  /** Greyed out and non-interactive when true. */
  disabled?: boolean;
  /** Hidden when explicitly `false` (absent means shown). */
  show?: boolean;
  /** Which side of the bar the action sits on. Defaults to `'right'`. */
  placement?: "left" | "right";
}

/** The back affordance for a screen. */
export interface NavBack {
  /**
   * Force the back control on or off. When omitted, the view shows it whenever the screen is not
   * the root of the stack (i.e. `canGoBack()` is true).
   */
  visible?: boolean;
  /** Optional label beside the chevron (iOS-style). */
  label?: string;
  /**
   * Custom handler. When omitted, back pops the stack. Supply this to intercept — e.g. to confirm
   * a discard, or to defer a side effect until a pop animation has finished.
   */
  onPress?: () => void;
}

/** Everything the nav bar needs for one screen. All data; the view adds any composed rendering. */
export interface NavBarSpec {
  /** Plain-text title. For a composed title, leave this unset and use the view's `renderTitle`. */
  title?: string;
  /** Optional second line under the title. */
  subtitle?: string;
  /** Back affordance. Omit to accept the default (shown when the screen is not the stack root). */
  back?: NavBack;
  /** Action items (right side unless an item sets `placement: 'left'`). */
  actions?: NavAction[];
  /** Hide the entire bar for this screen. */
  hidden?: boolean;
}

/** One entry on the stack: a screen `key` the view registry knows how to render, plus its state. */
export interface ScreenEntry<P = unknown> {
  /** Screen type, mapped to a renderer by the view (e.g. `'login'`, `'chat'`, `'settings'`). */
  key: string;
  /** Unique instance id. Assigned automatically by the store when omitted on input. */
  id: string;
  /** Arbitrary, serializable params for this instance. */
  params?: P;
  /** The nav-bar spec for this instance. The view may also derive it from `key`/`params`. */
  nav?: NavBarSpec;
}

/** Input to `push`/`replace`/`reset`: `id` is optional and auto-assigned when omitted. */
export type ScreenInput<P = unknown> = Omit<ScreenEntry<P>, "id"> & { id?: string };
