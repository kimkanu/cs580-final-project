export interface FinalizableThing {
  finalize(): void;
}

export abstract class App implements FinalizableThing {
  finalized = false;
  thingsToFinalize: FinalizableThing[] = [];
  isPaused = false;
  lastElapsed = -1;

  abstract initialize(): Promise<void>;

  finalize() {
    this.finalized = true;

    for (const thingToFinalize of this.thingsToFinalize) {
      thingToFinalize.finalize();
    }
  }

  abstract update(elapsed: number, dt: number): void;

  async run() {
    await this.initialize();

    let start = -1;
    let prev = -1;
    const updateCallback = (timestamp_: number) => {
      if (this.finalized) return;

      const timestamp = timestamp_ / 1000;

      if (start === -1) {
        start = timestamp;
      }
      if (prev === -1) {
        prev = timestamp;
      }

      if (this.isPaused) {
        start += timestamp - prev;
        prev = timestamp;

        this.update(this.lastElapsed, 0);
      } else {
        const elapsed = timestamp - start;
        this.lastElapsed = elapsed;
        const dt = timestamp - prev;
        prev = timestamp;

        this.update(elapsed, dt);
      }

      window.requestAnimationFrame(updateCallback);
    };
    window.requestAnimationFrame(updateCallback);
  }
}

export enum Types {
  NONE = 0,
  MAIN = 1,
}
