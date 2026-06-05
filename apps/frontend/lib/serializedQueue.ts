export interface SerializedQueue {
  enqueue: <T>(operation: () => Promise<T>) => Promise<T>;
}

export function createSerializedQueue(): SerializedQueue {
  let tail: Promise<unknown> = Promise.resolve();

  return {
    enqueue<T>(operation: () => Promise<T>): Promise<T> {
      const task = tail.then(operation, operation);
      tail = task.then(
        () => undefined,
        () => undefined,
      );
      return task;
    },
  };
}
