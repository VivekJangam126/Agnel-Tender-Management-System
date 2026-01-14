import React from 'react';
import { FileText } from 'lucide-react';

export default function OverviewTab({ tender, sections }) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Estimated Value</div>
          <div className="text-2xl font-bold text-slate-900">{tender.estimatedValue || 'N/A'}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Sections</div>
          <div className="text-2xl font-bold text-slate-900">{sections.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Competition</div>
          <div className="text-2xl font-bold text-slate-900">{tender.proposalCount}</div>
        </div>
      </div>

      {/* Section Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Document Structure</h3>
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="font-medium text-slate-900">{section.name}</div>
                  <div className="text-xs text-slate-500">{section.keyPoints?.length || 0} key requirements</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                section.complexity === 'Very High' ? 'bg-red-100 text-red-700' :
                section.complexity === 'High' ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {section.complexity || 'Medium'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
