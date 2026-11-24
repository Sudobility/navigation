# @sudobility/navigation

Framework-agnostic navigation **model** shared by the `@sudobility` web and React Native view
layers. It owns a screen **stack** and the per-screen **nav-bar spec** — a title (plain text here,
or a composed component supplied by the view), a back affordance, and optional action items — with
no React or React Native dependency.

- **Web / extensions** render the stack with `SlidingPanel` + `NavBar` from
  `@sudobility/building_blocks`.
- **React Native** keeps React Navigation as the stack owner and maps a `NavBarSpec` onto the
  native header via `useNavBar` from `@sudobility/building_blocks_rn`. On RN this package is for
  in-screen sub-stacks, not the primary navigator.

## Usage

```ts
import { createNavStore } from "@sudobility/navigation";
import { useStore } from "zustand"; // bind into React (web or RN)

const nav = createNavStore([{ key: "home", nav: { title: "Home" } }]);

nav.getState().push({ key: "settings", nav: { title: "Settings" } });
nav.getState().pop();

// In a component:
const stack = useStore(nav, (s) => s.stack);
```

### Model

- `createNavStore(initial)` → a zustand vanilla `StoreApi<NavState>`. `initial` must be non-empty.
- Actions: `push`, `pop`, `popToRoot`, `popTo(keyOrId)`, `replace`, `reset`, `setNav(id, partial)`,
  plus `canGoBack()` and `current()`.
- Types: `NavBarSpec`, `NavAction`, `NavBack`, `ScreenEntry`, `ScreenInput`.

Why the model holds no components: a title/action that must be a composed element is rendered by
the view layer (keyed on the screen's `key`), so the same stack drives both platforms.

## Scripts

- `bun run typecheck` · `bun run test:unit` · `bun run build` · `bun run clean`

`zustand` is a peer dependency, provided by the consuming app.
