import React, { useState } from 'react';
import { NoticeProvider, useNotice } from './context/NoticeContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AnalyzeView } from './components/AnalyzeView';
import { EventsView } from './components/EventsView';
import { ConflictCenterView } from './components/ConflictCenterView';
import { NoticeUpdatesView } from './components/NoticeUpdatesView';
import { CalendarExportView } from './components/CalendarExportView';
import { SettingsView } from './components/SettingsView';
import { PricingView } from './components/PricingView';
import { EventModal } from './components/EventModal';
import { EvidenceModal } from './components/EvidenceModal';

const AppContent: React.FC = () => {
  const { activeTab, addEvent, inspectingEvent, setInspectingEvent } = useNotice();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  const handleSaveNewEvent = (data: any) => {
    addEvent(data);
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F5F5F0] font-sans flex antialiased bg-grid-pattern selection:bg-[#D7FF64] selection:text-[#0B0D12]">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area (Offset by 64px on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Compact Header */}
        <Header onToggleMobileNav={() => setIsMobileNavOpen(true)} />

        {/* Viewport Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {(activeTab === 'overview' || activeTab === 'dashboard') && <DashboardView />}
          {activeTab === 'analyze' && <AnalyzeView />}
          {activeTab === 'events' && <EventsView />}
          {activeTab === 'conflicts' && <ConflictCenterView />}
          {activeTab === 'updates' && <NoticeUpdatesView />}
          {activeTab === 'export' && <CalendarExportView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'pricing' && <PricingView />}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#1F2637] bg-[#0E121A]/90 py-5 text-xs text-[#9299A8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="font-bold font-display text-white">Notice Decoder</span>
              <span className="text-[#9299A8]"> — The Notice Intelligence Lab</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono-code text-[#9299A8]">
              <span className="text-[#D7FF64]">Featherless AI Analysis</span>
              <span aria-hidden="true" className="text-[#1F2637]">·</span>
              <span>100% Local Browser DB</span>
              <span aria-hidden="true" className="text-[#1F2637]">·</span>
              <span>RFC 5545 iCalendar</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Quick Add Event Modal */}
      <EventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onSave={handleSaveNewEvent}
      />

      {/* Notice Trust & Evidence Layer Modal */}
      <EvidenceModal
        isOpen={Boolean(inspectingEvent)}
        event={inspectingEvent}
        onClose={() => setInspectingEvent(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <NoticeProvider>
      <AppContent />
    </NoticeProvider>
  );
}
