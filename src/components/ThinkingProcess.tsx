import { CheckCircle2, Loader2, Circle, Brain, Sparkles, XCircle, RefreshCw } from 'lucide-react';

export interface ThinkingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  details?: string;
  timestamp?: number;
}

interface ThinkingProcessProps {
  steps: ThinkingStep[];
  title?: string;
  onReset?: () => void;
}

export function ThinkingProcess({ steps, title = "AI Processing Steps", onReset }: ThinkingProcessProps) {
  if (steps.length === 0) return null;

  const hasError = steps.some(s => s.status === 'error');

  return (
    <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-6 w-6 text-ctp-accent" />
        <h3 className="text-xl font-bold text-ctp-text">{title}</h3>
        <Sparkles className="h-5 w-5 text-ctp-yellow animate-pulse" />
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connection line to next step */}
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gradient-to-b from-ctp-surface2 to-ctp-overlay0" />
            )}

            {/* Step card */}
            <div className={`relative flex gap-4 p-4 rounded-lg transition-all ${
              step.status === 'in_progress' ? 'bg-ctp-accent/20 border-2 border-ctp-accent/50' :
              step.status === 'completed' ? 'bg-gradient-to-r from-ctp-green/20 to-ctp-teal/20 border-2 border-ctp-green shadow-lg' :
              step.status === 'error' ? 'bg-ctp-red/20 border border-ctp-red/50' :
              'bg-ctp-surface1/30 border border-ctp-surface2'
            }`}>
              {/* Status icon */}
              <div className="flex-shrink-0 mt-1">
                {step.status === 'completed' && (
                  <CheckCircle2 className="h-8 w-8 text-ctp-green" />
                )}
                {step.status === 'in_progress' && (
                  <Loader2 className="h-8 w-8 text-ctp-accent animate-spin" />
                )}
                {step.status === 'pending' && (
                  <Circle className="h-8 w-8 text-ctp-overlay0" />
                )}
                {step.status === 'error' && (
                  <XCircle className="h-8 w-8 text-ctp-red" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`font-bold text-lg leading-tight ${
                    step.status === 'in_progress' ? 'text-ctp-accent' :
                    step.status === 'completed' ? 'text-ctp-green' :
                    step.status === 'error' ? 'text-ctp-red' :
                    'text-ctp-subtext1'
                  }`}>
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-xs text-ctp-overlay1 flex-shrink-0 font-medium">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <p className={`text-sm leading-relaxed ${
                  step.status === 'in_progress' ? 'text-ctp-text' :
                  step.status === 'completed' ? 'text-ctp-subtext0' :
                  step.status === 'error' ? 'text-ctp-red' :
                  'text-ctp-subtext0'
                }`}>
                  {step.description}
                </p>

                {/* Additional details if available */}
                {step.details && step.status !== 'pending' && (
                  <div className={`mt-3 p-3 rounded-lg text-sm font-mono overflow-x-auto ${
                    step.status === 'completed' ? 'bg-ctp-green/10 text-ctp-text border border-ctp-green/30' :
                    step.status === 'error' ? 'bg-ctp-red/10 text-ctp-red border border-ctp-red/30' :
                    'bg-ctp-base/60 text-ctp-subtext1 border border-ctp-surface2'
                  }`}>
                    {step.details}
                  </div>
                )}

                {/* Real-time process output for in-progress steps */}
                {step.status === 'in_progress' && step.details && (
                  <div className="mt-2 p-2 bg-ctp-surface2/30 rounded text-xs font-mono text-ctp-accent border border-ctp-accent/30">
                    <span>Output: </span>
                    <span>{step.details}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {steps.every(s => s.status === 'completed') && (
        <div className="mt-6 p-4 bg-gradient-to-r from-ctp-green/20 to-ctp-teal/20 border-2 border-ctp-green rounded-lg shadow-lg">
          <p className="text-ctp-text text-base font-semibold flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-ctp-green" />
            All processing steps completed successfully!
          </p>
        </div>
      )}

      {/* Error Summary with Reset Button */}
      {hasError && onReset && (
        <div className="mt-6 p-4 bg-ctp-red/20 border-2 border-ctp-red rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-ctp-red flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-ctp-text text-base font-semibold mb-3">
                Processing failed. Please check the error details above.
              </p>
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-ctp-red hover:bg-ctp-red/80 rounded-lg transition-colors text-ctp-base font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Reset and Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
