import React, { useState, useEffect } from 'react';
import { FileText, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BidderLayout from '../../components/bidder-layout/BidderLayout';
import StatsGrid from '../../components/bidder-discovery/StatsGrid';
import SearchAndFilters from '../../components/bidder-discovery/SearchAndFilters';
import TenderCard from '../../components/bidder-discovery/TenderCard';
import { tenderService } from '../../services/bidder/tenderService';

export default function BidderTenderDiscovery() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    industryDomain: '',
    sortBy: 'publishedAt',
    sortOrder: 'desc'
  });
  const [selectedView, setSelectedView] = useState('grid');
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTenders();
  }, [page, filters, searchQuery]);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 12,
        search: searchQuery,
        industryDomain: filters.industryDomain,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await tenderService.discoverTenders(params);
      
      if (response.data && response.data.tenders) {
        setTenders(response.data.tenders);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setError('Failed to load tenders');
      }
    } catch (err) {
      console.error('Error fetching tenders:', err);
      setError(err.response?.data?.message || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTender = (tenderId) => {
    navigate(`/bidder/tenders/${tenderId}/analyze`);
  };

  const stats = [
    { label: 'Available Tenders', value: tenders.length.toString(), icon: FileText, color: 'blue' },
    { label: 'Avg. Competition', value: '18', icon: Users, color: 'purple' },
    { label: 'Closing Soon', value: '12', icon: Clock, color: 'orange' },
    { label: 'Total Value', value: '$42M', icon: TrendingUp, color: 'green' }
  ];

  const getUrgencyColor = (days) => {
    if (days <= 7) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 14) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getCompetitionLevel = (count) => {
    if (count >= 30) return { label: 'High', color: 'red' };
    if (count >= 15) return { label: 'Medium', color: 'orange' };
    return { label: 'Low', color: 'green' };
  };

  if (loading && tenders.length === 0) {
    return (
      <BidderLayout>
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </BidderLayout>
    );
  }

  return (
    <BidderLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Discover Tenders</h1>
            <p className="text-sm sm:text-base text-slate-600">Find and analyze opportunities matching your expertise</p>
          </div>

          <StatsGrid stats={stats} />
          <SearchAndFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
          />

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error loading tenders</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <p className="text-sm sm:text-base text-slate-600">
              Showing <span className="font-semibold text-slate-900">{tenders.length}</span> tenders
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedView('grid')}
                className={`px-3 py-2 text-sm rounded-lg ${selectedView === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Grid
              </button>
              <button 
                onClick={() => setSelectedView('list')}
                className={`px-3 py-2 text-sm rounded-lg ${selectedView === 'list' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                List
              </button>
            </div>
          </div>

          {tenders.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tenders found</h3>
              <p className="text-slate-600">Try adjusting your search criteria</p>
            </div>
          )}

          {tenders.length > 0 && (
            <div className={selectedView === 'grid' ? 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6' : 'space-y-4'}>
              {tenders.map((tender) => (
                <div key={tender._id} onClick={() => handleViewTender(tender._id)} className="cursor-pointer">
                  <TenderCard 
                    tender={tender}
                    getUrgencyColor={getUrgencyColor}
                    getCompetitionLevel={getCompetitionLevel}
                    onViewDetails={() => handleViewTender(tender._id)}
                  />
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-2 rounded-lg ${
                      page === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </BidderLayout>
  );
}

