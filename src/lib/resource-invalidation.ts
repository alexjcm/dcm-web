export const RESOURCE_KEYS = {
  summary: "summary",
  contributors: "contributors",
  settings: "settings",
  contributions: "contributions"
} as const;

export type ResourceKey = (typeof RESOURCE_KEYS)[keyof typeof RESOURCE_KEYS];

type Snapshot = Record<ResourceKey, number>;
type Listener = () => void;

const snapshot: Snapshot = {
  [RESOURCE_KEYS.summary]: 0,
  [RESOURCE_KEYS.contributors]: 0,
  [RESOURCE_KEYS.settings]: 0,
  [RESOURCE_KEYS.contributions]: 0
};

const listeners = new Set<Listener>();

export const subscribeInvalidation = (listener: Listener): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getInvalidationSnapshot = (): Snapshot => snapshot;

export const invalidateResources = (...keys: ReadonlyArray<ResourceKey>): void => {
  if (keys.length === 0) {
    return;
  }

  for (const key of keys) {
    snapshot[key] += 1;
  }

  for (const listener of listeners) {
    listener();
  }
};
