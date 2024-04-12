import { createStore } from "zustand/vanilla";
import { describe, expect, test, vi } from "vitest";
import { injectors } from "../src";

describe("injectors", () => {
  test("should auto inject slices", async () => {
    const incrementBears = () => {};
    const store = createStore<{ bears: number; incrementBears: () => void }>()(
      injectors(
        () => ({
          bears: 0,
          incrementBears,
        }),
        {
          "increment-bears": async () =>
            new Promise((resolve) => {
              setTimeout(
                () =>
                  resolve((set) => ({
                    incrementBears: () => {
                      set((currentState) => ({
                        bears: currentState.bears + 1,
                      }));
                    },
                  })),
                300,
              );
            }),
        },
      ),
    );

    expect(store.getState().incrementBears).toBe(incrementBears);

    await vi.waitFor(() => {
      expect(store.getState().incrementBears).not.toBe(incrementBears);
    });
  });

  test("should manual inject slices", async () => {
    const incrementBears = () => {};
    const store = createStore<{ bears: number; incrementBears: () => void }>()(
      injectors(() => ({
        bears: 0,
        incrementBears,
      })),
    );

    expect(store.getState().incrementBears).toBe(incrementBears);

    store.injectAsyncSliceInitializer(
      "increment-bears",
      async () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve((set) => ({
                incrementBears: () => {
                  set((currentState) => ({
                    bears: currentState.bears + 1,
                  }));
                },
              })),
            300,
          );
        }),
    );

    await vi.waitFor(() => {
      expect(store.getState().incrementBears).not.toBe(incrementBears);
    });
  });

  test("should actions works from injected slices", async () => {
    const store = createStore<{ bears: number; incrementBears: () => void }>()(
      injectors(() => ({
        bears: 0,
        incrementBears: () => {},
      })),
    );

    expect(store.getState().bears).toBe(0);

    store.getState().incrementBears();

    expect(store.getState().bears).toBe(0);

    store.injectAsyncSliceInitializer(
      "increment-bears",
      async () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve((set) => ({
                incrementBears: () => {
                  set((currentState) => ({
                    bears: currentState.bears + 1,
                  }));
                },
              })),
            300,
          );
        }),
    );

    await vi.waitFor(() => {
      store.getState().incrementBears();

      expect(store.getState().bears).toBe(1);
    });
  });
});
