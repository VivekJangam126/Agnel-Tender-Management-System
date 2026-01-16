import React, { useEffect, useState } from 'react';
import { Loader2, FileSearch, Zap, Brain, CheckCircle, XCircle } from 'lucide-react';

/**
 * Analysis Loading Modal
 * Shows while tender PDF is being embedded and processed
 */
export default function AnalysisLoadingModal({ sessionId, onComplete, onError }) {
  const [status, setStatus] = useState('PROCESSING');
  const [progress, setProgress] = useState(0);
  const [chunksEmbedded, setChunksEmbedded] = useState(0);
  const [stage, setStage] = useState('Initializing...');

  const stages = [
    { label: 'Extracting text from PDF', icon: FileSearch, duration: 3000 },
    { label: 'Creating document chunks', icon: Zap, duration: 2000 },
    { label: 'Generating embeddings', icon: Brain, duration: 8000 },
    { label: 'Preparing insights', icon: CheckCircle, duration: 2000 },
  ];

  useEffect(() => {
    // Simulate progress through stages
    let currentStage = 0;
    let progressInterval;

    const advanceStage = () => {
      if (currentStage < stages.length) {
        setStage(stages[currentStage].label);
        setProgress((currentStage / stages.length) * 100);
        
        setTimeout(() => {
          currentStage++;
          advanceStage();
        }, stages[currentStage]?.duration || 2000);
      } else {
        setProgress(100);
        setStatus('READY');
      }
    };

    advanceStage();

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (status === 'READY') {
      setTimeout(() => onComplete(), 1000);
    } else if (status === 'FAILED') {
      setTimeout(() => onError('Analysis failed'), 1500);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            {status === 'PROCESSING' && (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            )}
            {status === 'READY' && (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
            {status === 'FAILED' && (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'PROCESSING' && 'Analyzing Tender Document'}
            {status === 'READY' && 'Analysis Complete'}
            {status === 'FAILED' && 'Analysis Failed'}
          </h2>
          
          <p className="text-gray-600">
            {status === 'PROCESSING' && 'Preparing AI insights using document intelligence'}
            {status === 'READY' && 'Redirecting to analysis workspace...'}
            {status === 'FAILED' && 'Something went wrong during analysis'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                status === 'READY'
                  ? 'bg-green-600'
                  : status === 'FAILED'
                  ? 'bg-red-600'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Stage */}
        {status === 'PROCESSING' && (
          <div className="space-y-4">
            {stages.map((s, idx) => {
              const Icon = s.icon;
              const isCurrent = s.label === stage;
              const isComplete = progress > (idx / stages.length) * 100;

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border border-blue-200'
                      : isComplete
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isCurrent
                        ? 'text-blue-600 animate-pulse'
                        : isComplete
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-blue-900'
                        : isComplete
                        ? 'text-green-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  {isComplete && !isCurrent && (
                    <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Brain className="w-4 h-4" />
            <span>Using advanced document intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
