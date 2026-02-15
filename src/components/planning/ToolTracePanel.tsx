import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Timer } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import type { ToolTrace } from '@/types';

export function ToolTracePanel() {
  const { toolTrace } = useAppSelector((s) => s.planning);
  const [expanded, setExpanded] = useState(false);

  if (!toolTrace || toolTrace.length === 0) return null;

  const successCount = toolTrace.filter((t) => t.success).length;
  const totalLatency = toolTrace.reduce((sum, t) => sum + (t.latency_ms || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm text-gray-900">
            Tool Trace ({toolTrace.length} tools called)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {successCount}/{toolTrace.length} succeeded
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {totalLatency}ms total
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded trace details */}
      {expanded && (
        <div className="border-t border-gray-200 divide-y divide-gray-100">
          {toolTrace.map((trace, idx) => (
            <ToolTraceRow key={idx} trace={trace} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolTraceRow({ trace, index }: { trace: ToolTrace; index: number }) {
  const [showArgs, setShowArgs] = useState(false);

  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-4">{index + 1}.</span>
          {trace.success ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="font-mono text-sm text-gray-800">{trace.tool}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{trace.latency_ms}ms</span>
          <button
            onClick={() => setShowArgs(!showArgs)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showArgs ? 'Hide' : 'Args'}
          </button>
        </div>
      </div>

      {showArgs && trace.arguments && (
        <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
          {JSON.stringify(trace.arguments, null, 2)}
        </pre>
      )}
    </div>
  );
}
