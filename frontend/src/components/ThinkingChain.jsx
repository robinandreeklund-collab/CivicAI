/**
 * ThinkingChain Component - ONESEEK Δ+ v6.2
 * 
 * Displays the AI's thinking process as a collapsible chain of steps.
 * Shows live updates as the AI processes the query.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/**
 * Individual thinking step component
 */
function ThinkingStepItem({ step, index }) {
  const getStepIcon = () => {
    const stepType = step.step;
    
    // Map step types to icons
    if (stepType === 'received' || stepType === 'analyzing') {
      return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    } else if (stepType.includes('error')) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-[#151515] dark:hover:bg-[#151515] transition-colors">
      <div className="mt-0.5">
        {getStepIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#ccc] dark:text-[#ccc]">
          {step.message}
        </p>
        {step.data && Object.keys(step.data).length > 0 && (
          <div className="mt-1 text-xs text-[#888] dark:text-[#888] font-mono bg-[#151515] dark:bg-[#151515] p-2 rounded overflow-auto max-h-32 border border-[#222]">
            {/* Display as read-only JSON. Data comes from backend and is not user-controlled. */}
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(step.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main thinking chain component
 */
export default function ThinkingChain({ thinkingChain = [], isExpanded = false, onToggle = null }) {
  const [expanded, setExpanded] = useState(false); // Always start collapsed

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (onToggle) {
      onToggle(newExpanded);
    }
  };

  if (!thinkingChain || thinkingChain.length === 0) {
    return null;
  }

  const lastStep = thinkingChain[thinkingChain.length - 1];
  const isProcessing = lastStep?.step === 'received' || 
                       lastStep?.step === 'analyzing' || 
                       lastStep?.step?.includes('ing');

  return (
    <details className="mt-3 rounded-lg overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a] border border-[#222] dark:border-[#222]">
      {/* Toggle summary */}
      <summary 
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[#151515] dark:hover:bg-[#151515] transition-colors list-none"
        onClick={(e) => {
          e.preventDefault();
          handleToggle();
        }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#646cff]" />
          <span className="text-sm font-medium text-[#888] dark:text-[#888]">
            Tankekedja
          </span>
          <span className="text-xs text-[#666] dark:text-[#666]">
            ({thinkingChain.length} steg)
          </span>
          {isProcessing && (
            <span className="text-xs text-[#646cff] dark:text-[#646cff] animate-pulse">
              Bearbetar...
            </span>
          )}
        </div>
        <div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#666]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#666]" />
          )}
        </div>
      </summary>

      {/* Expanded content */}
      {expanded && (
        <div className="bg-[#0a0a0a] dark:bg-[#0a0a0a] divide-y divide-[#1a1a1a] dark:divide-[#1a1a1a] border-t border-[#222]">
          {thinkingChain.map((step, index) => (
            <ThinkingStepItem key={index} step={step} index={index} />
          ))}
        </div>
      )}
    </details>
  );
}

/**
 * Live thinking indicator - shows current step while processing
 */
export function LiveThinkingIndicator({ currentStep = null }) {
  if (!currentStep) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <Loader className="w-4 h-4 animate-spin text-blue-500" />
      <span className="text-sm text-blue-700 dark:text-blue-300">
        {currentStep}
      </span>
    </div>
  );
}
