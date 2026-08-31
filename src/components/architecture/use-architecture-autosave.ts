"use client";

import { useEffect, useRef, useState } from "react";

import { saveArchitectureAction } from "@/app/actions";
import {
  createArchitectureAutosaveCoordinator,
  type ArchitectureAutosaveCoordinator,
  type ArchitectureSaveStatus,
} from "@/lib/architecture/autosave-coordinator";
import type { ArchitectureSnapshot } from "@/types/architecture";

const AUTOSAVE_DELAY = 1_500;

export function useArchitectureAutosave(
  projectId: string,
  initialSnapshot: ArchitectureSnapshot,
  currentSnapshot: ArchitectureSnapshot,
) {
  const [status, setStatus] = useState<ArchitectureSaveStatus>("saved");
  const coordinatorRef = useRef<ArchitectureAutosaveCoordinator | null>(null);

  useEffect(() => {
    const coordinator = createArchitectureAutosaveCoordinator({
      initialSnapshot,
      delay: AUTOSAVE_DELAY,
      save: async (snapshot) => {
        const result = await saveArchitectureAction(projectId, snapshot);
        return result.ok;
      },
      onStatusChange: setStatus,
    });

    coordinatorRef.current = coordinator;

    return () => {
      if (coordinatorRef.current === coordinator) {
        coordinatorRef.current = null;
      }

      coordinator.dispose();
    };
  }, [initialSnapshot, projectId]);

  useEffect(() => {
    coordinatorRef.current?.observe(currentSnapshot);
  }, [currentSnapshot]);

  return {
    status,
    saveNow: (snapshot: ArchitectureSnapshot) =>
      coordinatorRef.current?.saveNow(snapshot) ?? Promise.resolve(false),
    pause: () => coordinatorRef.current?.pause() ?? Promise.resolve(),
    reset: (snapshot: ArchitectureSnapshot) =>
      coordinatorRef.current?.reset(snapshot),
    resume: () => coordinatorRef.current?.resume(),
  };
}
