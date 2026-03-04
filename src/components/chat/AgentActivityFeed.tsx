import { useEffect, useRef, useState } from 'react';
import type { AgentEvent } from '@/types';
import { PlanOutlineCard } from './PlanOutlineCard';

interface AgentActivityFeedProps {
  events: AgentEvent[];
}

/**
 * Live agent activity feed showing real-time thinking, tool calls, and stage changes.
 *
 * Renders below the assistant message bubble during processing.
 * Each event type has a distinct visual treatment:
 * - thinking: brain icon + animated text
 * - tool_start: wrench icon + tool name + arguments
 * - tool_result: check/x icon + summary + latency
 * - stage_change: milestone dot
 * - plan_outline: structured preview card
 */
export function AgentActivityFeed({ events }: AgentActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [events.length]);

  if (events.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5 pl-11 max-h-64 overflow-y-auto text-xs">
      {events.map((event, idx) => (
        <EventRow key={idx} event={event} isLatest={idx === events.length - 1} allEvents={events} />
      ))}
      <div ref={scrollRef} />
    </div>
  );
}

function EventRow({ event, isLatest, allEvents }: { event: AgentEvent; isLatest: boolean; allEvents: AgentEvent[] }) {
  switch (event.type) {
    case 'thinking': {
      const text = String(event.data.message || event.data.text || '');
      const isReasoning = event.data.source === 'reasoning_model';
      if (isReasoning) {
        return <ReasoningEvent text={text} model={String(event.data.model || '')} animate={isLatest} />;
      }
      return <ThinkingEvent text={text} animate={isLatest} />;
    }
    case 'tool_start':
      return <ToolStartEvent tool={String(event.data.tool || '')} args={event.data.arguments as Record<string, unknown> | undefined} />;
    case 'tool_result':
      return <ToolResultEvent event={event} />;
    case 'stage_change':
      return <StageChangeEvent message={String(event.data.message || event.data.stage || '')} />;
    case 'plan_outline':
      return <PlanOutlineEvent data={event.data} />;
    case 'cost_summary':
      return <CostSummaryEvent data={event.data} />;
    case 'auth_required':
      return <AuthRequiredEvent event={event} allEvents={allEvents} />;
    case 'auth_success':
      return <AuthSuccessEvent event={event} />;
    case 'auth_expired':
      return <AuthExpiredEvent event={event} />;
    default:
      return null;
  }
}

function ThinkingEvent({ text, animate }: { text: string; animate: boolean }) {
  return (
    <div className="flex items-start gap-2 text-gray-600">
      <span className={`mt-0.5 shrink-0 ${animate ? 'animate-pulse' : ''}`}>
        <BrainIcon />
      </span>
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}

/**
 * Displays o-series model reasoning/thinking content (chain-of-thought).
 * Shows a collapsible section since reasoning can be quite long (2000+ tokens).
 * This gives users visibility into HOW the AI is thinking, not just WHAT it outputs.
 */
function ReasoningEvent({ text, model, animate }: { text: string; model: string; animate: boolean }) {
  // Split reasoning into paragraphs for readability
  const paragraphs = text.split('\n').filter(p => p.trim());
  const isLong = text.length > 300;

  return (
    <div className="mt-1 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 text-xs">
      {/* Header */}
      <div className="flex items-center gap-1.5 font-medium text-purple-700 mb-1.5">
        <span className={animate ? 'animate-pulse' : ''}>
          <SparklesIcon />
        </span>
        <span>AI Reasoning</span>
        {model && <span className="text-purple-400 font-normal ml-1">({model})</span>}
      </div>
      {/* Content */}
      {isLong ? (
        <details className="group" open={animate}>
          <summary className="cursor-pointer text-purple-500 hover:text-purple-700 select-none mb-1">
            {animate ? 'Thinking process (click to collapse)' : `Show thinking (${paragraphs.length} steps)`}
          </summary>
          <div className="space-y-1.5 text-gray-700 leading-relaxed max-h-48 overflow-y-auto">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-gray-600">{p}</p>
            ))}
          </div>
        </details>
      ) : (
        <div className="space-y-1 text-gray-600 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolStartEvent({ tool, args }: { tool: string; args?: Record<string, unknown> }) {
  const argsStr = args ? Object.entries(args).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ') : '';
  return (
    <div className="flex items-start gap-2 text-blue-600">
      <span className="mt-0.5 shrink-0 animate-spin-slow">
        <WrenchIcon />
      </span>
      <div>
        <span className="font-medium">{tool}</span>
        {argsStr && <span className="text-gray-400 ml-1">({argsStr.length > 80 ? argsStr.slice(0, 80) + '...' : argsStr})</span>}
      </div>
    </div>
  );
}

function ToolResultEvent({ event }: { event: AgentEvent }) {
  const success = event.data.success as boolean;
  const tool = String(event.data.tool || '');
  const latency = event.data.latency_ms as number | undefined;
  const summary = String(event.data.summary || '');

  return (
    <div className={`flex items-start gap-2 ${success ? 'text-green-600' : 'text-red-500'}`}>
      <span className="mt-0.5 shrink-0">{success ? <CheckIcon /> : <XIcon />}</span>
      <div>
        <span className="font-medium">{tool}</span>
        {latency != null && <span className="text-gray-400 ml-1">{latency}ms</span>}
        {summary && (
          <p className="text-gray-500 mt-0.5 line-clamp-2">{summary.length > 150 ? summary.slice(0, 150) + '...' : summary}</p>
        )}
      </div>
    </div>
  );
}

function StageChangeEvent({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-500 py-0.5">
      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function PlanOutlineEvent({ data }: { data: Record<string, unknown> }) {
  return <PlanOutlineCard data={data as {
    summary?: string;
    daily_themes?: Array<{ day: number; theme: string; highlight?: string }>;
    estimated_budget?: string;
    weather_summary?: string;
  }} />;
}

interface CostBreakdownItem {
  label: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

function CostSummaryEvent({ data }: { data: Record<string, unknown> }) {
  const totalCost = data.total_cost_usd as number | undefined;
  const totalTokens = data.total_tokens as number | undefined;
  const llmCalls = data.llm_calls as number | undefined;
  const toolCalls = data.tool_calls as number | undefined;
  const processingTime = data.processing_time_ms as number | undefined;
  const breakdown = data.breakdown as CostBreakdownItem[] | undefined;

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="mt-1 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 p-3 text-xs">
      {/* Header */}
      <div className="flex items-center gap-1.5 font-medium text-gray-700 mb-2">
        <DollarIcon />
        <span>Request Cost Summary</span>
      </div>
      {/* Stats row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 mb-2">
        {totalCost != null && (
          <span className="font-semibold text-blue-700">{formatCost(totalCost)}</span>
        )}
        {totalTokens != null && (
          <span>{totalTokens.toLocaleString()} tokens</span>
        )}
        {llmCalls != null && (
          <span>{llmCalls} LLM calls</span>
        )}
        {toolCalls != null && (
          <span>{toolCalls} tool calls</span>
        )}
        {processingTime != null && (
          <span>{(processingTime / 1000).toFixed(1)}s</span>
        )}
      </div>
      {/* Per-call breakdown table */}
      {breakdown && breakdown.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
            Show breakdown
          </summary>
          <table className="mt-1.5 w-full text-left text-[11px]">
            <thead>
              <tr className="text-gray-400 border-b border-gray-200">
                <th className="pb-1 font-medium">Step</th>
                <th className="pb-1 font-medium">Model</th>
                <th className="pb-1 font-medium text-right">In</th>
                <th className="pb-1 font-medium text-right">Out</th>
                <th className="pb-1 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0">
                  <td className="py-0.5 text-gray-600">{item.label}</td>
                  <td className="py-0.5 text-gray-500">{item.model}</td>
                  <td className="py-0.5 text-right text-gray-500">{item.input_tokens.toLocaleString()}</td>
                  <td className="py-0.5 text-right text-gray-500">{item.output_tokens.toLocaleString()}</td>
                  <td className="py-0.5 text-right font-medium text-blue-600">{formatCost(item.cost_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

// ── Auth Events (QR Code Login Flow) ────────────────────────

function AuthRequiredEvent({ event, allEvents }: { event: AgentEvent; allEvents: AgentEvent[] }) {
  const service = String(event.data.service || 'unknown');
  const serviceName = String(event.data.serviceName || service);
  const qrBase64 = String(event.data.qrCodeBase64 || '');
  const expiresAt = String(event.data.expiresAt || '');
  const message = String(event.data.message || '请扫码登录');

  // Check if a subsequent auth_success or auth_expired event exists for this service
  const resolved = allEvents.some(
    (e) =>
      (e.type === 'auth_success' || e.type === 'auth_expired') &&
      String(e.data.service) === service
  );

  return (
    <div className="mt-1 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-3 text-xs">
      <div className="flex items-center gap-1.5 font-medium text-orange-700 mb-2">
        <QrCodeIcon />
        <span>{serviceName} 登录验证</span>
      </div>
      {resolved ? (
        <p className="text-gray-400 text-center py-1">已处理</p>
      ) : (
        <>
          <p className="text-gray-600 mb-2">{message}</p>
          {qrBase64 && (
            <div className="flex justify-center mb-2">
              <img
                src={`data:image/png;base64,${qrBase64}`}
                alt="Login QR Code"
                className="w-40 h-40 rounded border border-gray-200"
              />
            </div>
          )}
          {expiresAt && <CountdownTimer expiresAt={expiresAt} />}
        </>
      )}
    </div>
  );
}

function AuthSuccessEvent({ event }: { event: AgentEvent }) {
  const serviceName = String(event.data.serviceName || event.data.service || 'Service');
  return (
    <div className="flex items-center gap-2 text-green-600 py-0.5">
      <span className="shrink-0"><CheckIcon /></span>
      <span className="font-medium">{serviceName} 登录成功</span>
    </div>
  );
}

function AuthExpiredEvent({ event }: { event: AgentEvent }) {
  const serviceName = String(event.data.serviceName || event.data.service || 'Service');
  const message = String(event.data.message || '登录超时');
  return (
    <div className="flex items-center gap-2 text-gray-400 py-0.5">
      <span className="shrink-0"><XIcon /></span>
      <span>{serviceName}: {message}</span>
    </div>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState<number>(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(diff / 1000));
      setRemaining(secs);
      if (secs <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, remaining]);

  if (remaining <= 0) {
    return <p className="text-center text-gray-400 text-[11px]">二维码已过期</p>;
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <p className="text-center text-orange-500 text-[11px]">
      请在 {mins}:{secs.toString().padStart(2, '0')} 内扫码
    </p>
  );
}

// ── Small SVG Icons ─────────────────────────────────────────

function BrainIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2a6 6 0 0 0-6 6c0 1.5.5 2.8 1.3 3.9L12 22l4.7-10.1A6 6 0 0 0 12 2z" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" />
    </svg>
  );
}

function QrCodeIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <path d="M21 14h-3v3h3v4h-7v-7h4" />
    </svg>
  );
}
