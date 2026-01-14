import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { FileText, Search, LogOut, Menu, X, LayoutDashboard, TrendingUp, Zap, FileCheck, Clock } from 'lucide-react';
import { useState } from 'react';

const BidderSidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/bidder/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/bidder/tenders', label: 'Discover Tenders', icon: Search },
    { path: '/bidder/analyze', label: 'Analyze', icon: TrendingUp },
    { path: '/bidder/proposal-drafting', label: 'Proposal Drafting', icon: FileCheck },
    { path: '/bidder/history', label: 'Bidder History', icon: Clock },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary-600 text-white"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } shadow-xl`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold">TenderFlow</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wider uppercase">{user?.role || 'Bidder'}</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 mt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-4">Navigation</p>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 transition-transform ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-6 border-t border-slate-700"></div>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-900 bg-opacity-50">
          <div className="mb-4 px-4 py-3 bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">{user?.email || 'Bidder'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200 font-medium"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default BidderSidebar;
