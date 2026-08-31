import type { ArchitectureSnapshot } from "@/types/architecture";

export type ArchitectureSaveStatus =
  | "saved"
  | "unsaved"
  | "saving"
  | "error";

type SaveRequest = {
  snapshot: ArchitectureSnapshot;
  fingerprint: string;
  generation: number;
  waiters: Array<(saved: boolean) => void>;
};

type AutosaveScheduler = {
  set: (callback: () => void, delay: number) => unknown;
  clear: (handle: unknown) => void;
};

type ArchitectureAutosaveOptions = {
  initialSnapshot: ArchitectureSnapshot;
  delay: number;
  save: (snapshot: ArchitectureSnapshot) => Promise<boolean>;
  onStatusChange: (status: ArchitectureSaveStatus) => void;
  scheduler?: AutosaveScheduler;
};

export type ArchitectureAutosaveCoordinator = {
  observe: (snapshot: ArchitectureSnapshot) => void;
  saveNow: (snapshot: ArchitectureSnapshot) => Promise<boolean>;
  pause: () => Promise<void>;
  reset: (snapshot: ArchitectureSnapshot) => void;
  resume: () => void;
  dispose: () => void;
  getStatus: () => ArchitectureSaveStatus;
  isDirty: () => boolean;
};

const defaultScheduler: AutosaveScheduler = {
  set: (callback, delay) => setTimeout(callback, delay),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function getArchitectureSnapshotFingerprint(
  snapshot: ArchitectureSnapshot,
): string {
  return JSON.stringify(snapshot);
}

export function createArchitectureAutosaveCoordinator({
  initialSnapshot,
  delay,
  save,
  onStatusChange,
  scheduler = defaultScheduler,
}: ArchitectureAutosaveOptions): ArchitectureAutosaveCoordinator {
  let generation = 0;
  let disposed = false;
  let paused = false;
  let status: ArchitectureSaveStatus = "saved";
  let savedFingerprint = getArchitectureSnapshotFingerprint(initialSnapshot);
  let latestSnapshot = initialSnapshot;
  let latestFingerprint = savedFingerprint;
  let timer: unknown = null;
  let activeRequest: SaveRequest | null = null;
  let activeSave: Promise<void> | null = null;
  let queuedRequest: SaveRequest | null = null;

  function isDirty() {
    return latestFingerprint !== savedFingerprint;
  }

  function setStatus(nextStatus: ArchitectureSaveStatus) {
    if (disposed || status === nextStatus) {
      return;
    }

    status = nextStatus;
    onStatusChange(nextStatus);
  }

  function clearTimer() {
    if (timer === null) {
      return;
    }

    scheduler.clear(timer);
    timer = null;
  }

  function cancelQueuedRequest() {
    if (!queuedRequest) {
      return;
    }

    queuedRequest.waiters.forEach((resolve) => resolve(false));
    queuedRequest = null;
  }

  function scheduleAutosave() {
    clearTimer();

    if (disposed || paused || !isDirty()) {
      return;
    }

    timer = scheduler.set(() => {
      timer = null;
      void requestSave(latestSnapshot, latestFingerprint);
    }, delay);
  }

  function finishWithoutNext(saved: boolean) {
    if (disposed) {
      return;
    }

    if (!saved) {
      setStatus("error");
      return;
    }

    setStatus(isDirty() ? "unsaved" : "saved");
  }

  function startSave(request: SaveRequest) {
    activeRequest = request;
    setStatus("saving");

    const task = (async () => {
      let saved = false;

      try {
        saved = await save(request.snapshot);
      } catch {
        saved = false;
      }

      if (
        !disposed &&
        request.generation === generation &&
        saved
      ) {
        savedFingerprint = request.fingerprint;
      }

      request.waiters.forEach((resolve) => resolve(saved));

      activeRequest = null;
      activeSave = null;

      if (disposed || request.generation !== generation) {
        return;
      }

      if (paused) {
        cancelQueuedRequest();
        finishWithoutNext(saved);
        return;
      }

      const nextRequest = queuedRequest;
      queuedRequest = null;

      if (nextRequest) {
        startSave(nextRequest);
        return;
      }

      finishWithoutNext(saved);
    })();

    activeSave = task;
  }

  function requestSave(
    snapshot: ArchitectureSnapshot,
    fingerprint: string,
  ): Promise<boolean> {
    clearTimer();

    return new Promise((resolve) => {
      if (disposed || paused) {
        resolve(false);
        return;
      }

      if (
        activeRequest?.generation === generation &&
        activeRequest.fingerprint === fingerprint
      ) {
        activeRequest.waiters.push(resolve);
        return;
      }

      if (activeRequest) {
        if (queuedRequest?.fingerprint === fingerprint) {
          queuedRequest.waiters.push(resolve);
          return;
        }

        queuedRequest = {
          snapshot,
          fingerprint,
          generation,
          waiters: [...(queuedRequest?.waiters ?? []), resolve],
        };
        return;
      }

      startSave({
        snapshot,
        fingerprint,
        generation,
        waiters: [resolve],
      });
    });
  }

  return {
    observe(snapshot) {
      if (disposed) {
        return;
      }

      const fingerprint = getArchitectureSnapshotFingerprint(snapshot);

      if (fingerprint === latestFingerprint) {
        return;
      }

      latestSnapshot = snapshot;
      latestFingerprint = fingerprint;

      if (!isDirty()) {
        clearTimer();
        setStatus("saved");
        return;
      }

      if (!activeRequest) {
        setStatus("unsaved");
      }
      scheduleAutosave();
    },
    saveNow(snapshot) {
      latestSnapshot = snapshot;
      latestFingerprint = getArchitectureSnapshotFingerprint(snapshot);
      return requestSave(snapshot, latestFingerprint);
    },
    async pause() {
      paused = true;
      clearTimer();
      cancelQueuedRequest();

      if (activeSave) {
        await activeSave;
      }
    },
    reset(snapshot) {
      generation += 1;
      paused = false;
      clearTimer();
      cancelQueuedRequest();
      latestSnapshot = snapshot;
      latestFingerprint = getArchitectureSnapshotFingerprint(snapshot);
      savedFingerprint = latestFingerprint;
      setStatus("saved");
    },
    resume() {
      if (disposed) {
        return;
      }

      paused = false;
      setStatus(isDirty() ? "unsaved" : "saved");
      scheduleAutosave();
    },
    dispose() {
      disposed = true;
      generation += 1;
      clearTimer();
      cancelQueuedRequest();
    },
    getStatus() {
      return status;
    },
    isDirty,
  };
}
