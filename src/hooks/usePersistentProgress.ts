import { useCallback, useEffect, useState } from "react";
import {
  emptyProgress,
  readProgress,
  writeProgress,
  type FoundDiscovery,
  type Progress,
} from "../progress/storage";
import type { Facing } from "../model/types";

export function usePersistentProgress() {
  const [progress, setProgress] = useState<Progress>(() => readProgress());

  useEffect(() => {
    writeProgress(progress);
  }, [progress]);

  const unlock = useCallback((id: string, pigX: number, facing: Facing) => {
    setProgress((current) => ({
      ...current,
      seenEnding: true,
      pigX,
      facing,
      unlockedIds: current.unlockedIds.includes(id) ? current.unlockedIds : [...current.unlockedIds, id],
    }));
  }, []);

  const rememberFind = useCallback((found: FoundDiscovery) => {
    setProgress((current) => {
      if (current.found.some((item) => item.id === found.id)) return current;
      return { ...current, found: [...current.found, found] };
    });
  }, []);

  const reset = useCallback(() => {
    setProgress(emptyProgress());
  }, []);

  return { progress, unlock, rememberFind, reset };
}
