import { describe, it, expect } from "vitest";
import { createNavStore } from "./store";

const keys = (store: ReturnType<typeof createNavStore>) =>
  store.getState().stack.map((e) => e.key);

describe("createNavStore", () => {
  it("throws on an empty initial stack", () => {
    expect(() => createNavStore([])).toThrow(/non-empty/);
  });

  it("auto-assigns a unique id to each entry (and honours a supplied one)", () => {
    const store = createNavStore([{ key: "root" }, { key: "fixed", id: "my-id" }]);
    const [a, b] = store.getState().stack;
    expect(a.id).toMatch(/^nav_/);
    expect(b.id).toBe("my-id");
    expect(a.id).not.toBe(b.id);
  });

  it("push appends and makes the new screen current", () => {
    const store = createNavStore([{ key: "root" }]);
    store.getState().push({ key: "detail", params: { x: 1 } });
    expect(keys(store)).toEqual(["root", "detail"]);
    expect(store.getState().current()?.key).toBe("detail");
    expect(store.getState().current()?.params).toEqual({ x: 1 });
  });

  it("pop removes the top but never empties the stack", () => {
    const store = createNavStore([{ key: "root" }]);
    store.getState().push({ key: "a" });
    store.getState().pop();
    expect(keys(store)).toEqual(["root"]);
    store.getState().pop(); // no-op at root
    expect(keys(store)).toEqual(["root"]);
    expect(store.getState().canGoBack()).toBe(false);
  });

  it("canGoBack reflects stack depth", () => {
    const store = createNavStore([{ key: "root" }]);
    expect(store.getState().canGoBack()).toBe(false);
    store.getState().push({ key: "a" });
    expect(store.getState().canGoBack()).toBe(true);
  });

  it("popToRoot clears everything above the root", () => {
    const store = createNavStore([{ key: "root" }]);
    store.getState().push({ key: "a" });
    store.getState().push({ key: "b" });
    store.getState().popToRoot();
    expect(keys(store)).toEqual(["root"]);
  });

  it("popTo pops back to a matching id, else a matching key; no-op otherwise", () => {
    const store = createNavStore([{ key: "root" }, { key: "list", id: "list-1" }]);
    store.getState().push({ key: "item" });
    store.getState().push({ key: "editor" });
    store.getState().popTo("list-1"); // by id
    expect(keys(store)).toEqual(["root", "list"]);

    store.getState().push({ key: "item" });
    store.getState().popTo("root"); // by key
    expect(keys(store)).toEqual(["root"]);

    store.getState().popTo("nope"); // no match -> no-op
    expect(keys(store)).toEqual(["root"]);
    store.getState().popTo("root"); // already on top -> no-op
    expect(keys(store)).toEqual(["root"]);
  });

  it("replace swaps the top in place without adding a level", () => {
    const store = createNavStore([{ key: "root" }]);
    store.getState().push({ key: "a" });
    store.getState().replace({ key: "b" });
    expect(keys(store)).toEqual(["root", "b"]);
  });

  it("reset replaces the whole stack and rejects an empty one", () => {
    const store = createNavStore([{ key: "root" }]);
    store.getState().push({ key: "a" });
    store.getState().reset([{ key: "home" }]);
    expect(keys(store)).toEqual(["home"]);
    expect(() => store.getState().reset([])).toThrow(/non-empty/);
  });

  it("setNav merges a partial spec into the matching screen only", () => {
    const store = createNavStore([{ key: "root", id: "r", nav: { title: "Root" } }]);
    store.getState().push({ key: "a", id: "a", nav: { title: "A", actions: [] } });
    store.getState().setNav("a", { title: "A!", subtitle: "sub" });
    const a = store.getState().stack.find((e) => e.id === "a");
    expect(a?.nav).toEqual({ title: "A!", subtitle: "sub", actions: [] });
    // Other screens untouched.
    expect(store.getState().stack.find((e) => e.id === "r")?.nav).toEqual({ title: "Root" });
  });

  it("notifies subscribers on change", () => {
    const store = createNavStore([{ key: "root" }]);
    let ticks = 0;
    const off = store.subscribe(() => ticks++);
    store.getState().push({ key: "a" });
    store.getState().pop();
    off();
    store.getState().push({ key: "b" });
    expect(ticks).toBe(2);
  });

  it("records the last operation (so a view can pick an animation)", () => {
    const store = createNavStore([{ key: "root" }]);
    expect(store.getState().lastOp).toBe("init");
    store.getState().push({ key: "a" });
    expect(store.getState().lastOp).toBe("push");
    store.getState().pop();
    expect(store.getState().lastOp).toBe("pop");
    store.getState().push({ key: "b" });
    store.getState().popToRoot();
    expect(store.getState().lastOp).toBe("pop");
    store.getState().replace({ key: "c" });
    expect(store.getState().lastOp).toBe("replace");
    store.getState().reset([{ key: "home" }]);
    expect(store.getState().lastOp).toBe("reset");
    store.getState().setNav(store.getState().stack[0].id, { title: "X" });
    expect(store.getState().lastOp).toBe("setNav");
    // A no-op pop (at root) leaves the last real op untouched.
    store.getState().reset([{ key: "only" }]);
    store.getState().pop();
    expect(store.getState().lastOp).toBe("reset");
  });
});
