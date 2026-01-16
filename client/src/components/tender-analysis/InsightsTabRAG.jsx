import React from 'react';
import { AlertTriangle, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function InsightsTabRAG({ insights }) {
  if (!insights) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading insights...</p>
      </div>
    );
  }

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk Assessment */}
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Overall Risk Assessment
          </h3>
          <span className={`px-4 py-2 rounded-lg font-bold border ${getRiskColor(insights.overallRiskAssessment)}`}>
            {insights.overallRiskAssessment || 'Medium'}
          </span>
        </div>
      </div>

      {/* Unusual Clauses */}
      {insights.unusualClauses && insights.unusualClauses.length > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Unusual or Risky Clauses
          </h3>
          <div className="space-y-4">
            {insights.unusualClauses.map((clause, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-red-300 p-4">
                <h4 className="font-semibold text-red-900 mb-2">{clause.clause}</h4>
                <p className="text-red-800 text-sm mb-2">
                  <strong>Concern:</strong> {clause.concern}
                </p>
                <p className="text-red-700 text-sm">
                  <strong>Comparison:</strong> {clause.comparison}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Penalties */}
      {insights.highPenalties && insights.highPenalties.length > 0 && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
          <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Penalty Clauses
          </h3>
          <div className="space-y-3">
            {insights.highPenalties.map((penalty, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-orange-300 p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-orange-900">{penalty.type}</h4>
                  <div className="flex items-center gap-1">
                    {getSeverityIcon(penalty.severity)}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(penalty.severity)}`}>
                      {penalty.severity}
                    </span>
                  </div>
                </div>
                <p className="text-orange-800 text-sm">{penalty.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Clauses */}
      {insights.missingClauses && insights.missingClauses.length > 0 && (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Missing Standard Clauses
          </h3>
          <div className="space-y-3">
            {insights.missingClauses.map((missing, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-yellow-300 p-4">
                <h4 className="font-semibold text-yellow-900 mb-1">{missing.expectedClause}</h4>
                <p className="text-yellow-800 text-sm">{missing.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-blue-900 flex-1">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No insights message */}
      {(!insights.unusualClauses || insights.unusualClauses.length === 0) &&
       (!insights.highPenalties || insights.highPenalties.length === 0) &&
       (!insights.missingClauses || insights.missingClauses.length === 0) && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Standard Tender Terms</h3>
          <p className="text-green-800">
            This tender appears to follow standard industry practices. No unusual clauses or high-risk terms detected.
          </p>
        </div>
      )}
    </div>
  );
}
