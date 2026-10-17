import React from 'react';
import { useNotice } from '../context/NoticeContext';
import {
  Sparkles,
  Download,
  Menu,
  X,
  FileSearch,
  Calendar,
  AlertTriangle,
  GitCompare,
  LayoutDashboard
} from 'lucide-react';
import { downloadIcsFile } from '../utils/icsExport';

interface HeaderProps {
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav }) => {
  const { activeTab, setActiveTab, conflicts, stats, events } = useNotice();

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze', icon: FileSearch },
    { id: 'events', label: 'Schedule', icon: Calendar, badge: stats.totalEvents },
    {
      id: 'conflicts',
      label: 'Conflict Map',
      icon: AlertTriangle,
      badge: conflicts.filter(c => c.severity === 'high').length,
      badgeColor: 'bg-[#FF647C]/20 text-[#FF647C] border-[#FF647C]/40',
    },
    { id: 'updates', label: 'Change Radar', icon: GitCompare },
  ];

  const handleExport = () => {
    const result = downloadIcsFile(events, 'academic_schedule.ics');
    if (!result.success) {
      setActiveTab('export');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0D12]/90 backdrop-blur-md border-b border-[#1F2637] text-[#F5F5F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            {/* Custom abstract document-to-calendar logo */}
            <div className="relative w-8 h-8 rounded-lg bg-[#121620] border border-[#2A3449] flex items-center justify-center overflow-hidden group-hover:border-[#D7FF64] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#63E6FF]">
                <rect x="3" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
                <rect x="8" y="7" width="13" height="14" rx="2" stroke="#D7FF64" strokeWidth="1.75" />
                <path d="M11 11H17" stroke="#D7FF64" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M11 14H15" stroke="#D7FF64" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="16" cy="17" r="1" fill="#D7FF64" />
              </svg>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-sm tracking-wider text-white">
                NOTICE
              </span>
              <span className="text-xs font-mono text-[#9299A8]">/</span>
              <span className="font-display font-bold text-sm tracking-wider text-[#D7FF64]">
                DECODER
              </span>
            </div>
          </button>

          {/* Small live application status indicator */}
          <div className="hidden xl:flex items-center gap-2 pl-3 ml-2 border-l border-[#1F2637] text-[11px] font-mono-code text-[#9299A8]">
            <span className="w-2 h-2 rounded-full bg-[#D7FF64] shadow-[0_0_8px_#D7FF64] animate-pulse" />
            <span className="tracking-wide text-slate-300">ENGINE: ACTIVE</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">100% PRIVATE</span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id || (activeTab === 'dashboard' && item.id === 'overview');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white bg-[#181D29] border border-[#2A3449] shadow-xs'
                    : 'text-[#9299A8] hover:text-white hover:bg-[#121620]'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono-code px-1.5 py-0.2 rounded-full tabular-nums border ${
                      item.badgeColor || 'bg-[#181D29] text-[#9299A8] border-[#2A3449]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExport}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-code text-[#9299A8] hover:text-white bg-[#121620] hover:bg-[#181D29] border border-[#1F2637] rounded-lg transition-colors cursor-pointer"
            title="Download RFC 5545 .ICS file"
          >
            <Download className="w-3.5 h-3.5 text-[#63E6FF]" />
            <span>.ICS</span>
          </button>

          {/* High-contrast "New Analysis" action button in electric acid-lime */}
          <button
            onClick={() => setActiveTab('analyze')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-lg transition-all shadow-[0_0_15px_rgba(215,255,100,0.3)] hover:shadow-[0_0_20px_rgba(215,255,100,0.45)] whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0B0D12]" />
            <span>New Analysis</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-1.5 text-[#9299A8] hover:text-white rounded-lg hover:bg-[#181D29] transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
