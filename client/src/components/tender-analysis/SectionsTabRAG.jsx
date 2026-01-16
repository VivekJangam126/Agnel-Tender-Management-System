import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function SectionsTabRAG({ sections }) {
  const [expandedSections, setExpandedSections] = useState([0]);

  const toggleSection = (index) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index));
    } else {
      setExpandedSections([...expandedSections, index]);
    }
  };

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

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return <XCircle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading sections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isExpanded = expandedSections.includes(index);
        const summary = section.summary || {};

        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(index)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-left">
                    {section.section_name}
                  </h3>
                  {summary.isMandatory && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      Mandatory
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-auto mr-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getRiskColor(summary.riskLevel)}`}>
                    {getRiskIcon(summary.riskLevel)}
                    {summary.riskLevel || 'Medium'} Risk
                  </span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
                {/* Summary */}
                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Summary</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {summary.summary || 'No summary available'}
                  </p>
                </div>

                {/* Key Requirements */}
                {summary.keyRequirements && summary.keyRequirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Key Requirements</h4>
                    <ul className="space-y-2">
                      {summary.keyRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {summary.concerns && summary.concerns.length > 0 && (
                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Concerns
                    </h4>
                    <ul className="space-y-1">
                      {summary.concerns.map((concern, idx) => (
                        <li key={idx} className="text-orange-800 text-sm flex items-start gap-2">
                          <span>•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
