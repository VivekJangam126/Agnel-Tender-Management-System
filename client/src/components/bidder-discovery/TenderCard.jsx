import React from 'react';
import { Building, Calendar, FileText, Eye, ChevronRight } from 'lucide-react';

export default function TenderCard({ tender, getUrgencyColor, getCompetitionLevel, onViewDetails }) {
  const competition = getCompetitionLevel(tender.proposalCount || 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {tender.title}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3">
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{tender.organizationId?.organizationName || 'Organization'}</span>
            </span>
            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs w-fit">
              {tender.organizationId?.industryDomain || 'N/A'}
            </span>
          </div>
        </div>
        <div className={`px-2 sm:px-3 py-1 border rounded-full text-xs font-semibold whitespace-nowrap ${getUrgencyColor(tender.daysRemaining || 30)}`}>
          {tender.daysRemaining || 30}d
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
        {tender.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {(tender.tags || []).map((tag, idx) => (
          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 p-2.5 sm:p-3 bg-slate-50 rounded-lg">
        <div>
          <div className="text-xs text-slate-500 mb-1">Estimated Value</div>
          <div className="text-sm sm:text-base font-semibold text-slate-900">${tender.value || tender.estimatedValue || 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Competition</div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-sm sm:text-base font-semibold text-slate-900">{tender.proposalCount || 0}</span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium w-fit ${
              competition.color === 'red' ? 'bg-red-100 text-red-700' :
              competition.color === 'orange' ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              {competition.label}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 mb-3 sm:mb-4">
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          0 sections
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 group-hover:shadow-md transition-all"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          className="sm:flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold flex items-center justify-center gap-2"
        >
          Analyze
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
