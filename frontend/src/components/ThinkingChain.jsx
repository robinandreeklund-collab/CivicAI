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

  // Get step title based on step type
  const getStepTitle = () => {
    if (step.step === 'personality_selection') {
      return `Steg 1 - Valde personlighet: ${step.personality || 'Okänd'}`;
    } else if (step.step === 'api_selection') {
      const apiList = step.apis ? step.apis.join(', ') : 'Inga APIs';
      return `Steg 2 - Valde API: ${apiList}`;
    } else if (step.step === 'final_answer_start' || step.step === 'final_answer') {
      return 'Steg 3 - Slutligt svar';
    } else {
      return step.message || 'Bearbetar...';
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 px-4 hover:bg-[#151515] dark:hover:bg-[#151515] transition-colors border-b border-[#1a1a1a] dark:border-[#1a1a1a] last:border-0">
      <div className="mt-0.5">
        {getStepIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#ddd] dark:text-[#ddd]">
          {getStepTitle()}
        </p>
        
        {/* Display reasoning if available (from three-stage pipeline) */}
        {step.reasoning && (
          <div className="mt-2 text-sm text-[#888] dark:text-[#888] italic pl-4 border-l-2 border-[#333] dark:border-[#333]">
            <span className="text-[#999] dark:text-[#999] font-medium">Reasoning: </span>
            {step.reasoning}
          </div>
        )}
        
        {/* Legacy: display message if no reasoning */}
        {!step.reasoning && step.message && step.step !== 'personality_selection' && step.step !== 'api_selection' && (
          <p className="mt-1 text-xs text-[#777] dark:text-[#777]">
            {step.message}
          </p>
        )}
        
        {/* Display data if available (legacy compatibility) */}
        {step.data && Object.keys(step.data).length > 0 && (
          <div className="mt-2 text-xs text-[#888] dark:text-[#888] font-mono bg-[#151515] dark:bg-[#151515] p-2 rounded overflow-auto max-h-32 border border-[#222]">
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
    console.log('[ThinkingChain] No thinking chain data to display');
    return null;
  }

  console.log('[ThinkingChain] Rendering with', thinkingChain.length, 'steps:', thinkingChain);

  const lastStep = thinkingChain[thinkingChain.length - 1];
  const isProcessing = lastStep?.step === 'received' || 
                       lastStep?.step === 'analyzing' || 
                       lastStep?.step?.includes('ing');

  return (
    <details 
      open={expanded}
      className="mt-3 rounded-lg overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a] border border-[#222] dark:border-[#222]"
    >
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

      {/* Expanded content - always rendered, visibility controlled by details[open] */}
      <div className="bg-[#0a0a0a] dark:bg-[#0a0a0a] divide-y divide-[#1a1a1a] dark:divide-[#1a1a1a] border-t border-[#222]">
        {thinkingChain.map((step, index) => (
          <ThinkingStepItem key={index} step={step} index={index} />
        ))}
      </div>
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
