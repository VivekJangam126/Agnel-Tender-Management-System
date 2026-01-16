import React from 'react';
import { DollarSign, FileText, Clock, Users, CheckCircle, AlertTriangle } from 'lucide-react';

export default function OverviewTabRAG({ overview }) {
  if (!overview) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading overview...</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Estimated Value',
      value: overview.estimatedValue || 'Not specified',
      icon: DollarSign,
      color: 'blue',
    },
    {
      label: 'Total Sections',
      value: overview.totalSections || 0,
      icon: FileText,
      color: 'purple',
    },
    {
      label: 'Mandatory Sections',
      value: overview.mandatorySections || 0,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Estimated Read Time',
      value: `${overview.readTime || 0} min`,
      icon: Clock,
      color: 'orange',
    },
  ];

  const getCompetitionColor = (level) => {
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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-gradient-to-br from-white to-slate-50 rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Competition Level */}
      {overview.competition && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-600" />
              <span className="font-semibold text-slate-900">Competition Level</span>
            </div>
            <span className={`px-4 py-2 rounded-lg font-semibold border ${getCompetitionColor(overview.competition)}`}>
              {overview.competition}
            </span>
          </div>
        </div>
      )}

      {/* Eligibility Summary */}
      {overview.eligibilitySummary && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Eligibility Requirements</h3>
              <p className="text-blue-800 leading-relaxed">{overview.eligibilitySummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Deadlines */}
      {overview.keyDeadlines && overview.keyDeadlines.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-slate-900">Key Deadlines</h3>
          </div>
          <ul className="space-y-2">
            {overview.keyDeadlines.map((deadline, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span>{deadline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Insight Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 pt-4 border-t border-slate-200">
        <AlertTriangle className="w-4 h-4" />
        <span>Analysis powered by document intelligence</span>
      </div>
    </div>
  );
}
