import { useCallback, useEffect, useState } from "react";
import { awardGuideEntry, readProgress, writeProgress, type FoundDiscovery, type Progress } from "../progress/storage";
import type { Facing } from "../model/types";

export function usePersistentProgress() {
  const [progress, setProgress] = useState<Progress>(() => readProgress());

  useEffect(() => {
    writeProgress(progress);
  }, [progress]);

  const unlock = useCallback((id: string, pigX: number, facing: Facing) => {
    setProgress((current) => {
      const next = awardGuideEntry(current, id);
      return {
        ...next,
        pigX,
        facing,
        unlockedIds: next.unlockedIds.includes(id) ? next.unlockedIds : [...next.unlockedIds, id],
      };
    });
  }, []);

  const rememberFind = useCallback((found: FoundDiscovery) => {
    setProgress((current) => {
      if (current.found.some((item) => item.id === found.id)) return current;
      return { ...current, found: [...current.found, found] };
    });
  }, []);

  return { progress, unlock, rememberFind };
}
