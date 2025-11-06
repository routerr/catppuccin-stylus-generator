import { CheckCircle2, Loader2, Circle, Brain, Sparkles } from 'lucide-react';

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
}

export function ThinkingProcess({ steps, title = "AI Processing Steps" }: ThinkingProcessProps) {
  if (steps.length === 0) return null;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-6 w-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connection line to next step */}
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gradient-to-b from-gray-600 to-gray-700" />
            )}

            {/* Step card */}
            <div className={`relative flex gap-4 p-4 rounded-lg transition-all ${
              step.status === 'in_progress' ? 'bg-purple-900/30 border-2 border-purple-500/50' :
              step.status === 'completed' ? 'grass-green-gradient border-2 grass-green-border shadow-lg' :
              step.status === 'error' ? 'bg-red-900/20 border border-red-500/30' :
              'bg-gray-800/30 border border-gray-600/30'
            }`}>
              {/* Status icon */}
              <div className="flex-shrink-0 mt-1">
                {step.status === 'completed' && (
                  <CheckCircle2 className="h-8 w-8 text-white" />
                )}
                {step.status === 'in_progress' && (
                  <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                )}
                {step.status === 'pending' && (
                  <Circle className="h-8 w-8 text-gray-500" />
                )}
                {step.status === 'error' && (
                  <Circle className="h-8 w-8 text-red-400" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`font-bold text-lg leading-tight ${
                    step.status === 'in_progress' ? 'text-purple-200' :
                    step.status === 'completed' ? 'text-white' :
                    step.status === 'error' ? 'text-red-200' :
                    'text-gray-300'
                  }`}>
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-xs text-gray-400 flex-shrink-0 font-medium">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <p className={`text-sm leading-relaxed ${
                  step.status === 'in_progress' ? 'text-purple-100' :
                  step.status === 'completed' ? 'text-gray-100' :
                  step.status === 'error' ? 'text-red-100' :
                  'text-gray-400'
                }`}>
                  {step.description}
                </p>

                {/* Additional details if available */}
                {step.details && step.status !== 'pending' && (
                  <div className={`mt-3 p-3 rounded-lg text-sm font-mono overflow-x-auto ${
                    step.status === 'completed' ? 'bg-white/15 text-white border border-white/20' :
                    'bg-gray-900/60 text-gray-200 border border-gray-700/50'
                  }`}>
                    {step.details}
                  </div>
                )}

                {/* Progress indicator for in-progress steps */}
                {step.status === 'in_progress' && (
                  <div className="mt-2">
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                           style={{ width: '60%' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {steps.every(s => s.status === 'completed') && (
        <div className="mt-6 p-4 grass-green-gradient border-2 grass-green-border rounded-lg shadow-lg">
          <p className="text-white text-base font-semibold flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-white" />
            All processing steps completed successfully!
          </p>
        </div>
      )}
    </div>
  );
}
