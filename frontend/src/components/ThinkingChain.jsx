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
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="mt-0.5">
        {getStepIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {step.message}
        </p>
        {step.data && Object.keys(step.data).length > 0 && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
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
  const [expanded, setExpanded] = useState(isExpanded);

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
    <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tankekedja
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({thinkingChain.length} steg)
          </span>
          {isProcessing && (
            <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
              Bearbetar...
            </span>
          )}
        </div>
        <div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {thinkingChain.map((step, index) => (
            <ThinkingStepItem key={index} step={step} index={index} />
          ))}
        </div>
      )}
    </div>
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
        [tänker...] {currentStep}
      </span>
    </div>
  );
}
