import { useEffect, useRef } from 'react';
import { apiClient } from '@/api/client';
import { useAppDispatch } from '@/store/hooks';
import {
  setProgress,
  setCompleted,
  setFailed,
  setSseConnected,
} from '@/store/planningSlice';
import type { Itinerary, TaskStatus, ToolTrace } from '@/types';

/**
 * Hook that manages an SSE connection for real-time task updates.
 *
 * Connects to /api/planning/tasks/{taskId}/stream when taskId is provided.
 * Dispatches Redux actions for progress, completion, and failure events.
 * Auto-closes on completion/failure or component unmount.
 */
export function useSSE(taskId: string | null) {
  const dispatch = useAppDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!taskId) return;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = apiClient.createSSE(`/planning/tasks/${taskId}/stream`);
    eventSourceRef.current = es;
    dispatch(setSseConnected(true));

    // Handle progress events
    es.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        dispatch(
          setProgress({
            status: data.status as TaskStatus,
            progress: data.progress ?? 0,
            message: data.message ?? data.progressMessage ?? '',
          }),
        );
      } catch {
        // Ignore malformed events
      }
    });

    // Handle status events (initial state, updates)
    es.addEventListener('status', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        dispatch(
          setProgress({
            status: data.status as TaskStatus,
            progress: data.progress ?? 0,
            message: data.message ?? data.progressMessage ?? '',
          }),
        );
      } catch {
        // Ignore
      }
    });

    // Handle completed event
    es.addEventListener('completed', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        let itinerary: Itinerary | null = null;
        let toolTrace: ToolTrace[] = [];

        if (data.result) {
          try {
            const parsed = JSON.parse(data.result);
            itinerary = parsed;
          } catch {
            // result might not be parseable
          }
        }

        if (data.toolTrace) {
          toolTrace = data.toolTrace;
        }

        if (itinerary) {
          dispatch(setCompleted({ itinerary, toolTrace }));
        } else {
          dispatch(
            setProgress({
              status: 'COMPLETED',
              progress: 100,
              message: 'Completed',
            }),
          );
        }
      } catch {
        // Ignore
      }
      es.close();
      dispatch(setSseConnected(false));
    });

    // Handle failed event
    es.addEventListener('failed', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        dispatch(setFailed(data.errorMessage || data.message || 'Unknown error'));
      } catch {
        dispatch(setFailed('Task failed'));
      }
      es.close();
      dispatch(setSseConnected(false));
    });

    // Handle generic messages (fallback)
    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'COMPLETED') {
          if (data.result) {
            try {
              const itinerary = JSON.parse(data.result);
              dispatch(setCompleted({ itinerary }));
            } catch {
              dispatch(
                setProgress({ status: 'COMPLETED', progress: 100, message: 'Done' }),
              );
            }
          }
          es.close();
          dispatch(setSseConnected(false));
        } else if (data.status === 'FAILED') {
          dispatch(setFailed(data.errorMessage || 'Failed'));
          es.close();
          dispatch(setSseConnected(false));
        } else {
          dispatch(
            setProgress({
              status: data.status || 'PROCESSING',
              progress: data.progress ?? 0,
              message: data.message || data.progressMessage || '',
            }),
          );
        }
      } catch {
        // Ignore
      }
    };

    // Handle connection errors
    es.onerror = () => {
      es.close();
      dispatch(setSseConnected(false));
    };

    // Cleanup on unmount or taskId change
    return () => {
      es.close();
      dispatch(setSseConnected(false));
      eventSourceRef.current = null;
    };
  }, [taskId, dispatch]);
}
