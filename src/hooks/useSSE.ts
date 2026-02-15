import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/api/client';
import { useAppDispatch } from '@/store/hooks';
import {
  setProgress,
  setCompleted,
  setFailed,
  addAgentEvent,
  setSseConnected,
} from '@/store/chatSlice';
import type { AgentEvent, StructuredItinerary, TaskStatus, ToolTrace } from '@/types';
import { normalizeItinerary } from '@/utils/normalizeItinerary';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 2000;
const POLL_INTERVAL_MS = 5000;

/**
 * Hook that manages an SSE connection for real-time task updates.
 *
 * Connects to /api/planning/tasks/{taskId}/stream when taskId is provided.
 * Dispatches Redux actions for progress, completion, and failure events.
 *
 * Resilience features:
 * - Auto-reconnects on SSE connection loss (exponential backoff, up to 5 attempts)
 * - Falls back to HTTP polling if SSE reconnection exhausted
 * - Auto-closes on completion/failure or component unmount
 */
export function useSSE(taskId: string | null) {
  const dispatch = useAppDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTerminalRef = useRef(false);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    isTerminalRef.current = false;
  }, []);

  const handleStatusData = useCallback(
    (data: Record<string, unknown>) => {
      const status = (data.status as TaskStatus) || 'PROCESSING';
      const progress =
        (data.progressPercent as number) ?? (data.progress as number) ?? 0;
      const message =
        (data.progressMessage as string) ??
        (data.message as string) ??
        '';

      if (status === 'COMPLETED') {
        isTerminalRef.current = true;

        // Extract structured itinerary (normalize snake_case → camelCase)
        let itinerary: StructuredItinerary | null =
          normalizeItinerary(data.structuredItinerary) || null;
        let toolTrace: ToolTrace[] = [];

        // Fallback: try parsing from result string
        if (!itinerary && data.result) {
          try {
            const raw = JSON.parse(data.result as string);
            itinerary = normalizeItinerary(raw) || null;
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
        cleanup();
        dispatch(setSseConnected(false));
      } else if (status === 'FAILED') {
        isTerminalRef.current = true;
        dispatch(
          setFailed(
            (data.errorMessage as string) ||
              (data.message as string) ||
              'Unknown error',
          ),
        );
        cleanup();
        dispatch(setSseConnected(false));
      } else if (status === 'CANCELLED') {
        isTerminalRef.current = true;
        dispatch(setFailed('Task was cancelled'));
        cleanup();
        dispatch(setSseConnected(false));
      } else {
        dispatch(setProgress({ status, progress, message }));
      }
    },
    [dispatch, cleanup],
  );

  // Polling fallback: when SSE is completely unavailable, poll the task status API
  const startPolling = useCallback(
    (tid: string) => {
      if (pollTimerRef.current) return; // Already polling

      pollTimerRef.current = setInterval(async () => {
        if (isTerminalRef.current) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          return;
        }

        try {
          const data = await apiClient.get<Record<string, unknown>>(
            `/planning/status/${tid}`,
          );
          handleStatusData(data);
        } catch {
          // Ignore poll errors, will retry next interval
        }
      }, POLL_INTERVAL_MS);
    },
    [handleStatusData],
  );

  const connectSSE = useCallback(
    (tid: string) => {
      if (isTerminalRef.current) return;

      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = apiClient.createSSE(`/planning/tasks/${tid}/stream`);
      eventSourceRef.current = es;
      dispatch(setSseConnected(true));

      const handleEvent = (event: MessageEvent) => {
        // Reset reconnect counter on successful message
        reconnectAttemptRef.current = 0;

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

      // Handle rich agent events (Phase 1 SSE streaming)
      es.addEventListener('agent_event', (event: MessageEvent) => {
        reconnectAttemptRef.current = 0;
        try {
          const data = JSON.parse(event.data);
          // Forward event to the progress handler for percent/message updates
          handleStatusData(data);
          // Also dispatch as an AgentEvent for the activity feed
          if (data.eventType) {
            const agentEvent: AgentEvent = {
              type: data.eventType,
              timestamp: data.timestamp || new Date().toISOString(),
              data: data.eventData || {},
            };
            dispatch(addAgentEvent(agentEvent));
          }
        } catch {
          // Ignore malformed events
        }
      });

      // Handle generic messages (fallback)
      es.onmessage = (event: MessageEvent) => {
        reconnectAttemptRef.current = 0;
        try {
          const data = JSON.parse(event.data);
          handleStatusData(data);
        } catch {
          // Ignore
        }
      };

      // Handle connection errors — attempt reconnect
      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        dispatch(setSseConnected(false));

        if (isTerminalRef.current) return;

        reconnectAttemptRef.current += 1;

        if (reconnectAttemptRef.current <= MAX_RECONNECT_ATTEMPTS) {
          // Exponential backoff reconnect
          const delay =
            RECONNECT_BASE_DELAY_MS *
            Math.pow(2, reconnectAttemptRef.current - 1);
          reconnectTimerRef.current = setTimeout(() => {
            connectSSE(tid);
          }, delay);
        } else {
          // SSE exhausted — fall back to polling
          console.warn(
            `SSE reconnect exhausted after ${MAX_RECONNECT_ATTEMPTS} attempts, switching to polling`,
          );
          startPolling(tid);
        }
      };
    },
    [dispatch, handleStatusData, startPolling],
  );

  useEffect(() => {
    if (!taskId) {
      cleanup();
      return;
    }

    isTerminalRef.current = false;
    reconnectAttemptRef.current = 0;
    connectSSE(taskId);

    // Cleanup on unmount or taskId change
    return () => {
      cleanup();
      dispatch(setSseConnected(false));
    };
  }, [taskId, connectSSE, cleanup, dispatch]);
}
