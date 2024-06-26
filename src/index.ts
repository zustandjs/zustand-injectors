import type { StateCreator, StoreMutatorIdentifier } from "zustand/vanilla";

type StoreInjectors<S> = {
  asyncSliceInitializers: Record<
    string,
    () => Promise<StateCreator<S, [], [], unknown>>
  >;
  injectAsyncSliceInitializer: (
    key: string,
    asyncSliceInitializer: () => Promise<StateCreator<S, [], [], unknown>>,
  ) => void;
};

type Injectors = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
>(
  initializer: StateCreator<T, [...Mps, ["injectors", never]], Mcs>,
  initialAsyncSliceInitializers?: Record<
    string,
    () => Promise<StateCreator<T, [], [], unknown>>
  >,
) => StateCreator<T, Mps, [["injectors", U], ...Mcs]>;

type Write<T, U> = Omit<T, keyof U> & U;

type WithInjectors<S> = S extends { getState: () => infer T }
  ? Write<S, StoreInjectors<T>>
  : never;

type InjectorsImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  initialSliceInitializers?: Record<
    string,
    () => Promise<StateCreator<T, [], [], unknown>>
  >,
) => StateCreator<T, [], []>;

declare module "zustand/vanilla" {
  interface StoreMutators<S, A> {
    // @ts-ignore
    injectors: WithInjectors<S>;
  }
}

const injectAsyncSliceInitializers = async <T>(
  ...args: Parameters<StateCreator<T, [["injectors", T]], [], unknown>>
): Promise<void> => {
  const [, , store] = args;

  const sliceInitializers = await Promise.all(
    Object.values(store.asyncSliceInitializers).map((asyncSliceInitializer) =>
      asyncSliceInitializer(),
    ),
  );

  store.setState(
    sliceInitializers.reduce((state, sliceInitializer) => {
      return Object.assign({}, state, sliceInitializer(...args));
    }, store.getState()),
    true,
  );
};

const injectorsImpl: InjectorsImpl =
  (initializer, initialAsyncSliceInitializers = {}) =>
  (set, get, _store) => {
    type S = ReturnType<typeof get>;
    type SI = Parameters<StateCreator<S, [["injectors", S]], []>>[2];

    const store = _store as SI;

    store.asyncSliceInitializers = initialAsyncSliceInitializers;
    store.injectAsyncSliceInitializer = async (key, asyncSliceInitializer) => {
      store.asyncSliceInitializers[key] = asyncSliceInitializer;

      injectAsyncSliceInitializers(set, get, store);
    };

    if (Object.keys(store.asyncSliceInitializers).length) {
      injectAsyncSliceInitializers(set, get, store);
    }

    return initializer(set, get, store);
  };

export const injectors = injectorsImpl as unknown as Injectors;
