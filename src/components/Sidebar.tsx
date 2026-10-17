import React from 'react';
import { useNotice } from '../context/NoticeContext';
import {
  LayoutDashboard,
  FileSearch,
  Calendar,
  AlertTriangle,
  GitCompare,
  Settings,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, conflicts, stats, loadSampleDataset } = useNotice();

  const navLinks = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Notice', icon: FileSearch },
    { id: 'events', label: 'Schedule Registry', icon: Calendar, badge: stats.totalEvents },
    {
      id: 'conflicts',
      label: 'Conflict Center',
      icon: AlertTriangle,
      badge: conflicts.filter(c => c.severity === 'high').length,
      badgeColor: 'bg-[#FF647C]/20 text-[#FF647C] border-[#FF647C]/40 font-bold',
    },
    { id: 'updates', label: 'Notice Change Radar', icon: GitCompare },
    { id: 'settings', label: 'Settings & Storage', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Persistent Desktop Sidebar & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0E121A] border-r border-[#1F2637] text-[#F5F5F0] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Product Brand Zone - Clean and no SETU 2026 at the top */}
          <div className="p-4 sm:p-5 border-b border-[#1F2637] flex items-center justify-between">
            <button
              onClick={() => handleNavClick('overview')}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-[#121620] border border-[#2A3449] flex items-center justify-center text-white group-hover:border-[#D7FF64] transition-colors shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#63E6FF]">
                  <rect x="3" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
                  <rect x="8" y="7" width="13" height="14" rx="2" stroke="#D7FF64" strokeWidth="1.75" />
                  <path d="M11 11H17" stroke="#D7FF64" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 14H15" stroke="#D7FF64" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="16" cy="17" r="1" fill="#D7FF64" />
                </svg>
              </div>
              <div>
                <span className="font-display font-extrabold text-sm tracking-tight text-white block">
                  Notice Decoder
                </span>
                <span className="text-[10px] text-[#D7FF64] font-mono-code font-bold tracking-wider uppercase block">
                  INTELLIGENCE LAB
                </span>
              </div>
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-[#9299A8] hover:text-white rounded-lg hover:bg-[#181D29] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 flex-1 overflow-y-auto space-y-6">
            <div>
              <p className="px-3 pb-2 text-[10px] font-mono-code font-bold tracking-widest text-[#9299A8] uppercase">
                INTELLIGENCE OPS
              </p>
              <nav className="space-y-1">
                {navLinks.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (activeTab === 'dashboard' && item.id === 'overview');

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono-code rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#181D29] text-white font-bold border border-[#2A3449] shadow-xs'
                          : 'text-[#9299A8] hover:bg-[#121620] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D7FF64]' : 'text-[#9299A8]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
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
            </div>

            {/* Quick Demo Dataset Launcher */}
            <div className="p-3.5 rounded-2xl bg-[#121620] border border-[#1F2637] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold text-white">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF64]" />
                <span>Quick Test Dataset</span>
              </div>
              <p className="text-[11px] text-[#9299A8] leading-relaxed">
                Loads the benchmark CSE notice featuring Internal Test 2, Lab Records, and AI Guest Lecture.
              </p>
              <button
                onClick={() => {
                  loadSampleDataset();
                  handleNavClick('overview');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono-code font-bold text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] rounded-xl transition-all shadow-[0_0_12px_rgba(215,255,100,0.2)] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-[#0B0D12]" />
                <span>Load Sample Circular</span>
              </button>
            </div>
          </div>

          {/* Sidebar Footer with storage status */}
          <div className="p-4 border-t border-[#1F2637] bg-[#0B0D12]">
            <div className="flex items-center justify-between text-[11px] font-mono-code text-[#9299A8]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D7FF64] shadow-[0_0_6px_#D7FF64] animate-pulse" />
                <span className="text-slate-300">Browser DB</span>
              </span>
              <span className="text-[10px] text-[#63E6FF] bg-[#121620] px-1.5 py-0.5 rounded border border-[#1F2637]">
                OFFLINE READY
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
