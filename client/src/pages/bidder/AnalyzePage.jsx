import React from 'react';
import { useNavigate } from 'react-router-dom';
import BidderLayout from '../../components/bidder-layout/BidderLayout';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [recentAnalyses] = React.useState([
    {
      id: '1',
      tenderTitle: 'Cloud Infrastructure Setup',
      matchScore: 82,
      analyzedDate: '2 hours ago'
    },
    {
      id: '2',
      tenderTitle: 'Mobile App Development',
      matchScore: 65,
      analyzedDate: '1 day ago'
    },
    {
      id: '3',
      tenderTitle: 'Data Analytics Platform',
      matchScore: 78,
      analyzedDate: '2 days ago'
    }
  ]);

  return (
    <BidderLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Analyze Tenders</h1>
          <p className="text-slate-600">View detailed AI analysis of tenders you're interested in</p>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Advanced Tender Analysis</h2>
              <p className="text-slate-600 mb-4">Get AI-powered insights on tender complexity, competition levels, and your match score. Navigate to a specific tender from the discovery page to view its detailed analysis.</p>
              <button
                onClick={() => navigate('/bidder/tenders')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Discover Tenders <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Analyses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 mb-3">{analysis.tenderTitle}</h4>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Match Score</p>
                      <p className="text-3xl font-bold text-blue-600">{analysis.matchScore}%</p>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {analysis.matchScore}%
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4">{analysis.analyzedDate}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BidderLayout>
  );
}
