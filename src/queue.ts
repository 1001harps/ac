import { EventListener } from "@9h/lib";
import async from "async";

type QueueProcessor<T, R> = (task: T) => Promise<R>;

type QueueEvent<T, R> =
  | {
      type: "complete";
      task: T;
      result: R;
    }
  | {
      type: "error";
      task: T;
      error: Error;
    };

export class Queue<T, R> extends EventListener<QueueEvent<T, R>> {
  queue: async.QueueObject<T>;

  constructor(processor: NonNullable<QueueProcessor<T, R>>, concurrency = 1) {
    super();

    this.queue = async.queue<T>((task, callback) => {
      processor(task)
        .then((result) => {
          this.notify({ type: "complete", task, result });
          callback();
        })
        .catch(callback);
    }, concurrency);
  }

  push(input: T | T[]) {
    const tasks = Array.isArray(input) ? input : [input];

    tasks.forEach((task) => {
      this.queue.push(task, (error) => {
        if (error) this.notify({ type: "error", task, error });
      });
    });
  }
}
