import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { NOTIFICATION_PREFERENCES_KEY } from "@/api/queryKeys";
import {
  getNotificationPreferences,
  listProjects,
  updateNotificationPreferences,
} from "@/api/wharf";
import {
  COLLABORATION_KEYS,
  type CollaborationKey,
  DEFAULT_PREFERENCES,
  toPreferences,
} from "./catalogue";

// How long a row keeps saying "saved" before going quiet again.
const SAVED_LINGER_MS = 2000;

export type RowStatus = "idle" | "saving" | "saved" | "error";

// A row is on/off plus how its last write went. The two are separate because a
// failed write leaves the row showing the *stored* value while still reporting
// the failure — the toggle must never lie about what the server holds.
export type StatusMap = Partial<Record<CollaborationKey | "all", RowStatus>>;

export function useNotificationsLogic() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusMap>({});
  // The value a failed write was trying to store, so [ retry ] can repeat it
  // without the user having to click the toggle again.
  const failedRef = useRef<Partial<Record<CollaborationKey | "all", boolean>>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const preferencesQuery = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_KEY,
    queryFn: getNotificationPreferences,
  });

  // Only to decide whether to show the "no projects yet" note. It must not gate
  // the settings themselves: preferences are saved now and take effect when the
  // account joins a project, so a failed or slow projects call simply hides the
  // note rather than blocking the page.
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  const preferences = toPreferences(preferencesQuery.data?.preferences);

  // Clear pending timers on unmount so a fading "saved" cannot set state on a
  // page that is gone.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const markStatus = useCallback((key: CollaborationKey | "all", next: RowStatus) => {
    setStatus((current) => ({ ...current, [key]: next }));
    const existing = timers.current.get(key);
    if (existing) {
      clearTimeout(existing);
      timers.current.delete(key);
    }
    if (next === "saved") {
      timers.current.set(
        key,
        setTimeout(() => {
          setStatus((current) =>
            current[key] === "saved" ? { ...current, [key]: "idle" } : current,
          );
          timers.current.delete(key);
        }, SAVED_LINGER_MS),
      );
    }
  }, []);

  const mutation = useMutation({
    mutationFn: (changes: Partial<Record<CollaborationKey, boolean>>) =>
      updateNotificationPreferences({ preferences: changes }),
    onSuccess: (response) => {
      // Trust the server's full set over the optimistic guess: it is the only
      // thing that knows what actually landed.
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_KEY, response);
    },
  });

  const write = useCallback(
    async (
      marker: CollaborationKey | "all",
      changes: Partial<Record<CollaborationKey, boolean>>,
      previous: Record<CollaborationKey, boolean>,
    ) => {
      markStatus(marker, "saving");
      // Move immediately: the toggle following the pointer is what makes the
      // page feel like a switch rather than a form.
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_KEY, {
        preferences: { ...previous, ...changes },
      });
      try {
        await mutation.mutateAsync(changes);
        delete failedRef.current[marker];
        markStatus(marker, "saved");
      } catch {
        // Snap back to what the server still holds, and keep the message on the
        // row until a retry succeeds or the row is changed again.
        queryClient.setQueryData(NOTIFICATION_PREFERENCES_KEY, { preferences: previous });
        failedRef.current[marker] = changes[marker as CollaborationKey] ?? false;
        markStatus(marker, "error");
      }
    },
    [markStatus, mutation, queryClient],
  );

  const toggle = useCallback(
    (key: CollaborationKey) => {
      void write(key, { [key]: !preferences[key] }, preferences);
    },
    [preferences, write],
  );

  // Derived, never stored: on when all seven are on, off when all are off. A
  // click drives the whole group to the opposite of "all on", which is what
  // makes the indeterminate state resolve predictably in one press.
  const enabledCount = COLLABORATION_KEYS.filter((key) => preferences[key]).length;
  const allOn = enabledCount === COLLABORATION_KEYS.length;

  const toggleAll = useCallback(() => {
    const next = !allOn;
    const changes = Object.fromEntries(COLLABORATION_KEYS.map((key) => [key, next])) as Record<
      CollaborationKey,
      boolean
    >;
    void write("all", changes, preferences);
  }, [allOn, preferences, write]);

  const retry = useCallback(
    (marker: CollaborationKey | "all") => {
      const attempted = failedRef.current[marker];
      if (attempted === undefined) return;
      if (marker === "all") {
        const changes = Object.fromEntries(
          COLLABORATION_KEYS.map((key) => [key, attempted]),
        ) as Record<CollaborationKey, boolean>;
        void write("all", changes, preferences);
        return;
      }
      void write(marker, { [marker]: attempted }, preferences);
    },
    [preferences, write],
  );

  return {
    preferences,
    // Undefined only before the first load resolves; the page renders the
    // defaults meanwhile rather than an empty list that would shift on arrival.
    isLoading: preferencesQuery.isPending,
    loadFailed: preferencesQuery.isError,
    reload: () => void preferencesQuery.refetch(),
    status,
    enabledCount,
    total: COLLABORATION_KEYS.length,
    allOn,
    allOff: enabledCount === 0,
    // While the master write is in flight every row is pending, since every row
    // is being written.
    masterSaving: status.all === "saving",
    toggle,
    toggleAll,
    retry,
    // Undefined while loading — the note stays hidden rather than claiming an
    // account has no projects before we know.
    hasProjects: projectsQuery.data ? projectsQuery.data.length > 0 : undefined,
  };
}

export { DEFAULT_PREFERENCES };
