import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DatasetManagement from '../components/admin/DatasetManagement';
import TrainingControl from '../components/admin/TrainingControl';
import ModelManagement from '../components/admin/ModelManagement';
import MonitoringDashboard from '../components/admin/MonitoringDashboard';

/**
 * Admin Dashboard for OneSeek-7B-Zero Management
 * 
 * Features:
 * - Dataset management (upload, browse, validate, edit)
 * - Training control panel (configure, start/stop, monitor)
 * - Model management (list versions, compare, rollback, download)
 * - Real-time monitoring (progress, GPU/CPU, notifications)
 * 
 * Location: /admin
 * Access: Admin users only (role: "admin" in Firebase)
 */
export default function AdminDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('datasets');
  const { user, loading } = useAuth();
  
  // Check if user has admin role from Firebase
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#666] font-mono text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center space-y-6">
          <div className="text-[#888] font-mono text-lg">Access Denied</div>
          <div className="text-[#666] text-sm">
            You need administrator privileges to access this page.
          </div>
          <Link 
            to="/"
            className="inline-block px-6 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'datasets', label: 'Datasets', icon: '📁' },
    { id: 'training', label: 'Training', icon: '🎯' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'monitoring', label: 'Monitoring', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#eee] text-2xl font-mono font-semibold">
                Admin Dashboard
              </h1>
              <p className="text-[#666] text-sm font-mono mt-1">
                OneSeek-7B-Zero Training & Model Management
              </p>
            </div>
            <Link
              to="/oqt-dashboard"
              className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
            >
              OQT Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#2a2a2a] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-6 py-3 font-mono text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'text-[#eee] border-b-2 border-[#eee]'
                    : 'text-[#666] hover:text-[#888]'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {selectedTab === 'datasets' && <DatasetManagement />}
          {selectedTab === 'training' && <TrainingControl />}
          {selectedTab === 'models' && <ModelManagement />}
          {selectedTab === 'monitoring' && <MonitoringDashboard />}
        </div>
      </div>
    </div>
  );
}
