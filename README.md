# zustand-injectors

[![CI](https://img.shields.io/github/actions/workflow/status/zustandjs/zustand-injectors/ci.yml?branch=main)](https://github.com/zustandjs/zustand-injectors/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/zustand-injectors)](https://www.npmjs.com/package/zustand-injectors)
[![size](https://img.shields.io/bundlephobia/minzip/zustand-injectors)](https://bundlephobia.com/result?p=zustand-injectors)
[![discord](https://img.shields.io/discord/627656437971288081)](https://discord.gg/MrQdmzd)

A sweet way to lazy load slices

## Install

```bash
npm i zustand zustand-injectors
```

## Usage

**Auto lazy load slices**

```tsx
// src/create-decrement-slice.ts
import type { StateCreator } from "zustand";

import type { CounterStore } from "./counter-store";

export const createDecrementSlice: StateCreator<
  CounterStore,
  [],
  [],
  { decrementCount: () => void }
> = (set) => ({
  decrementCount: () => {
    console.log("decrement count");

    set((currentState) => ({ count: currentState.count - 1 }));
  },
});
```

```tsx
// src/counter-store.ts
import { createStore } from "zustand";
import { injectors } from "zustand-injectors";

export type CounterState = { count: number };

export type CounterActions = {
  incrementCount: () => void;
  decrementCount: () => void;
};

export type CounterStore = CounterState & CounterActions;

export const counterStore = createStore<CounterStore>()(
  injectors(
    (set) => ({
      count: 0,
      incrementCount: () => {
        set((currentState) => ({ count: currentState.count + 1 }));
      },
      decrementCount: () => {},
    }),
    {
      "decrement-slice": () =>
        import("./create-decrement-slice").then(
          (mod) => mod.createDecrementSlice
        ),
    }
  )
);
```

```tsx
// main.tsx
import { useLayoutEffect } from "react";
import { useStore } from "zustand";

const Component = () => {
  const { count, incrementCount, decrementCount } = useStore(counterStore);

  return null;
};
```

**Manual lazy load slices**

```tsx
// src/create-decrement-slice.ts
import type { StateCreator } from "zustand";

import type { CounterStore } from "./counter-store";

export const createDecrementSlice: StateCreator<
  CounterStore,
  [],
  [],
  { decrementCount: () => void }
> = (set) => ({
  decrementCount: () => {
    console.log("decrement count");

    set((currentState) => ({ count: currentState.count - 1 }));
  },
});
```

```tsx
// src/counter-store.ts
import { useLayoutEffect } from "react";
import { createStore } from "zustand";
import { injectors } from "zustand-injectors";

export type CounterState = { count: number };

export type CounterActions = {
  incrementCount: () => void;
  decrementCount: () => void;
};

export type CounterStore = CounterState & CounterActions;

export const counterStore = createStore<CounterStore>()(
  injectors((set) => ({
    count: 0,
    incrementCount: () => {
      set((currentState) => ({ count: currentState.count + 1 }));
    },
    decrementCount: () => {},
  }))
);
```

```tsx
// src/main.tsx
import { useLayoutEffect } from "react";
import { useStore } from "zustand";

const Component = () => {
  const { count, incrementCount, decrementCount } = useStore(counterStore);

  useLayoutEffect(() => {
    counterStore.injectAsyncSliceInitializer("decrement-slice", () =>
      import("./create-decrement-slice").then((mod) => mod.createDecrementSlice)
    );
  }, []);

  return null;
};
```
