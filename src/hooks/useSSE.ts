import { useEffect, useRef } from 'react';
import { apiClient } from '@/api/client';
import { useAppDispatch } from '@/store/hooks';
import {
  setProgress,
  setCompleted,
  setFailed,
  setSseConnected,
} from '@/store/chatSlice';
import type { StructuredItinerary, TaskStatus, ToolTrace } from '@/types';

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

    const handleStatusData = (data: Record<string, unknown>) => {
      const status = (data.status as TaskStatus) || 'PROCESSING';
      const progress =
        (data.progressPercent as number) ?? (data.progress as number) ?? 0;
      const message =
        (data.progressMessage as string) ??
        (data.message as string) ??
        '';

      if (status === 'COMPLETED') {
        // Extract structured itinerary
        let itinerary: StructuredItinerary | null =
          (data.structuredItinerary as StructuredItinerary) || null;
        let toolTrace: ToolTrace[] = [];

        // Fallback: try parsing from result string
        if (!itinerary && data.result) {
          try {
            itinerary = JSON.parse(data.result as string);
          } catch {
            // ignore
          }
        }

        if (data.toolTrace) {
          toolTrace = data.toolTrace as ToolTrace[];
        }

        dispatch(
          setCompleted({
            itinerary,
            toolTrace,
            rawResult: data.result as string,
          }),
        );
        es.close();
        dispatch(setSseConnected(false));
      } else if (status === 'FAILED') {
        dispatch(
          setFailed(
            (data.errorMessage as string) ||
              (data.message as string) ||
              'Unknown error',
          ),
        );
        es.close();
        dispatch(setSseConnected(false));
      } else if (status === 'CANCELLED') {
        dispatch(setFailed('Task was cancelled'));
        es.close();
        dispatch(setSseConnected(false));
      } else {
        dispatch(setProgress({ status, progress, message }));
      }
    };

    // Handle named events (progress, status, completed, failed)
    const handleEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleStatusData(data);
      } catch {
        // Ignore malformed events
      }
    };

    es.addEventListener('progress', handleEvent);
    es.addEventListener('status', handleEvent);
    es.addEventListener('completed', handleEvent);
    es.addEventListener('failed', handleEvent);

    // Handle generic messages (fallback)
    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleStatusData(data);
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
