import React from 'react';
import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

export default function InsightsTab({ aiInsights }) {
  if (!aiInsights) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-600">Loading AI insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Score */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Your Match Score</h3>
          <div className="text-4xl font-bold text-blue-600">{aiInsights.matchScore || 75}%</div>
        </div>
        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ width: `${aiInsights.matchScore || 75}%` }}
          />
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Good match with improvement areas identified
        </p>
      </div>

      {/* Strengths */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Your Strengths
        </h3>
        <div className="space-y-3">
          {(aiInsights.strengths || []).map((strength, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-900">{strength}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Concerns */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          Areas of Concern
        </h3>
        <div className="space-y-3">
          {(aiInsights.concerns || []).map((concern, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900">{concern}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          AI Recommendations
        </h3>
        <div className="space-y-3">
          {(aiInsights.recommendations || []).map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
