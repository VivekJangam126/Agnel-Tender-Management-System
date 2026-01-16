import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import BidderLayout from '../../components/bidder-layout/BidderLayout';
import TenderHeader from '../../components/tender-analysis/TenderHeader';
import TabNavigation from '../../components/tender-analysis/TabNavigation';
import OverviewTabRAG from '../../components/tender-analysis/OverviewTabRAG';
import SectionsTabRAG from '../../components/tender-analysis/SectionsTabRAG';
import InsightsTabRAG from '../../components/tender-analysis/InsightsTabRAG';
import AIAssistantRAG from '../../components/tender-analysis/AIAssistantRAG';
import AnalysisLoadingModal from '../../components/tender-analysis/AnalysisLoadingModal';
import { tenderService } from '../../services/bidder/tenderService';
import { ragService } from '../../services/bidder/ragService';

export default function TenderAnalysisRAG() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get session_id from URL params (passed from discovery page)
  const sessionIdFromUrl = searchParams.get('session_id');
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(sessionIdFromUrl);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [showLoadingModal, setShowLoadingModal] = useState(!sessionIdFromUrl);
  
  // Data states
  const [tender, setTender] = useState(null);
  const [overview, setOverview] = useState(null);
  const [sections, setSections] = useState([]);
  const [insights, setInsights] = useState(null);

  // Initialize session or load existing one
  useEffect(() => {
    if (sessionIdFromUrl) {
      // Session already created, just load data
      loadAnalysisData(sessionIdFromUrl);
    } else {
      // Create new session
      initializeSession();
    }
  }, [id, sessionIdFromUrl]);

  const initializeSession = async () => {
    try {
      setShowLoadingModal(true);
      
      // Initialize RAG session
      const initResponse = await ragService.initSession(parseInt(id));
      const newSessionId = initResponse.session_id;
      setSessionId(newSessionId);
      
      // Poll until ready
      await ragService.pollSessionReady(newSessionId);
      
      setShowLoadingModal(false);
      
      // Load analysis data
      await loadAnalysisData(newSessionId);
    } catch (err) {
      console.error('Session initialization error:', err);
      setError(err.message || 'Failed to initialize analysis session');
      setShowLoadingModal(false);
    }
  };

  const loadAnalysisData = async (sid) => {
    try {
      setLoading(true);
      
      // Fetch tender details
      const tenderResponse = await tenderService.getTenderFullDetails(id);
      const tenderData = tenderResponse.data.data.tender;
      
      setTender({
        title: tenderData.title,
        organization: tenderData.organizationId?.organizationName || 'Organization',
        publishedAt: tenderData.createdAt,
        closedAt: tenderData.deadline,
        daysRemaining: tenderData.deadline
          ? Math.max(0, Math.ceil((new Date(tenderData.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
          : 0,
        description: tenderData.description,
      });
      
      // Fetch RAG-based overview
      const overviewResponse = await ragService.getTenderOverview(sid, parseInt(id));
      setOverview(overviewResponse.overview);
      
      // Fetch section summaries
      const sectionNames = ['Scope', 'Eligibility', 'Technical', 'Financial', 'Terms and Conditions'];
      const sectionsResponse = await ragService.getSectionSummaries(sid, sectionNames);
      setSections(sectionsResponse.sections);
      
      // Fetch AI insights
      const insightsResponse = await ragService.getAIInsights(sid, parseInt(id));
      setInsights(insightsResponse.insights);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading analysis data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load analysis');
      setLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
  };

  const handleLoadingError = (errorMsg) => {
    setError(errorMsg);
    setShowLoadingModal(false);
  };

  if (showLoadingModal) {
    return (
      <AnalysisLoadingModal
        sessionId={sessionId}
        onComplete={handleLoadingComplete}
        onError={handleLoadingError}
      />
    );
  }

  if (error) {
    return (
      <BidderLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/bidder/tenders')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Back to Discovery
            </button>
          </div>
        </div>
      </BidderLayout>
    );
  }

  if (loading) {
    return (
      <BidderLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading analysis...</p>
          </div>
        </div>
      </BidderLayout>
    );
  }

  return (
    <BidderLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        {tender && <TenderHeader tender={tender} />}
        
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Analysis Content (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
              
              {/* Tab Content */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {activeTab === 'overview' && <OverviewTabRAG overview={overview} />}
                {activeTab === 'sections' && <SectionsTabRAG sections={sections} />}
                {activeTab === 'insights' && <InsightsTabRAG insights={insights} />}
              </div>
            </div>
            
            {/* Right: AI Assistant (1/3) */}
            <div className="lg:col-span-1">
              <AIAssistantRAG sessionId={sessionId} tenderId={id} />
            </div>
          </div>
        </div>
      </div>
    </BidderLayout>
  );
}
