import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { fetchPresence, sendHeartbeat } from '@/store/presenceSlice';

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Hook that sends heartbeats and polls presence for a project.
 * Automatically stops when the component unmounts or projectId changes.
 */
export function usePresence(projectId: string | null | undefined) {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // Send initial heartbeat and fetch presence
    dispatch(sendHeartbeat(projectId));
    dispatch(fetchPresence(projectId));

    // Set up periodic heartbeat + presence refresh
    intervalRef.current = setInterval(() => {
      dispatch(sendHeartbeat(projectId));
      dispatch(fetchPresence(projectId));
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [projectId, dispatch]);
}
