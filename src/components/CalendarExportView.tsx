import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNotice } from '../context/NoticeContext';
import { generateIcsContent, downloadIcsFile } from '../utils/icsExport';
import { formatDateDisplay } from '../utils/parser';
import {
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';

export const CalendarExportView: React.FC = () => {
  const { events } = useNotice();

  const [calendarTitle, setCalendarTitle] = useState('College Academic Schedule 2026');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(events.map(e => e.id)));
  const [downloadStatus, setDownloadStatus] = useState<{
    initiated: boolean;
    exportedCount: number;
    filename: string;
  } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showRawIcs, setShowRawIcs] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const knownEventIds = useRef(new Set(events.map(event => event.id)));

  useEffect(() => {
    const currentIds = new Set(events.map(event => event.id));
    const addedIds = events
      .filter(event => !knownEventIds.current.has(event.id))
      .map(event => event.id);
    const removedIds = [...knownEventIds.current].filter(id => !currentIds.has(id));
    knownEventIds.current = currentIds;

    if (addedIds.length > 0 || removedIds.length > 0) {
      setSelectedIds(current => {
        const next = new Set([...current].filter(id => currentIds.has(id)));
        addedIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [events]);

  // Selected events
  const eventsToExport = useMemo(() => {
    return events.filter(e => selectedIds.has(e.id));
  }, [events, selectedIds]);

  const { icsString, exportedCount, skippedCount, skippedReasons } = useMemo(() => {
    return generateIcsContent(eventsToExport, calendarTitle);
  }, [eventsToExport, calendarTitle]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map(e => e.id)));
    }
  };

  const handleDownload = () => {
    const filename = `${calendarTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.ics`;
    setDownloadError(null);
    try {
      const res = downloadIcsFile(eventsToExport, filename);
      if (res.success) {
        setDownloadStatus({
          initiated: true,
          exportedCount: res.exportedCount,
          filename,
        });
      } else {
        setDownloadError(res.skippedReasons.join(' ') || 'No dated events are selected for export.');
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not download the calendar file.');
    }
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(icsString);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-[#1F2637] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
            Calendar Export Registry
          </h2>
          <p className="text-xs sm:text-sm text-[#9299A8] mt-0.5">
            RFC 5545 standard compliant .ICS output compatible with Google Calendar, Apple Calendar, and Outlook
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-[#9299A8]">Standard:</span>
          <span className="text-xs font-mono-code px-2.5 py-1 rounded bg-[#181D29] border border-[#2A3449] text-[#63E6FF]">
            RFC 5545 VCALENDAR
          </span>
        </div>
      </div>

      {/* Download Feedback Banner */}
      {downloadStatus && (
        <div className="p-4 sm:p-5 bg-[#0E1B18] border border-emerald-500/40 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-bold font-display text-white">
              Calendar Download Initiated: <span className="font-mono-code text-emerald-300">{downloadStatus.filename}</span>
            </h3>
          </div>
          <p className="text-xs text-slate-300 font-mono-code leading-relaxed">
            Successfully generated standard RFC 5545 VCALENDAR stream containing {downloadStatus.exportedCount} confirmed event(s). File saved to local downloads.
          </p>
          <div className="pt-2 text-[11px] font-mono-code text-[#9299A8] flex flex-wrap gap-4 border-t border-emerald-500/20">
            <span><strong className="text-white">Google Calendar:</strong> Settings → Import & Export → Import .ics</span>
            <span><strong className="text-white">Apple Calendar:</strong> Double-click .ics file or File → Import</span>
            <span><strong className="text-white">Outlook:</strong> File → Open & Export → Open Calendar</span>
          </div>
        </div>
      )}

      {downloadError && (
        <div role="alert" className="p-4 bg-[#1C141B] border border-[#FF647C]/40 rounded-xl text-xs font-mono-code text-[#FF647C]">
          Calendar export failed: {downloadError}
        </div>
      )}

      {/* Export Configuration Card */}
      <div className="bg-[#121620] rounded-2xl border border-[#1F2637] p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono-code text-[#9299A8] mb-1.5 uppercase tracking-wider">
              Calendar Output Title
            </label>
            <input
              type="text"
              value={calendarTitle}
              onChange={e => setCalendarTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono-code bg-[#0B0D12] border border-[#2A3449] rounded-xl text-white focus:outline-none focus:border-[#D7FF64]"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowRawIcs(!showRawIcs)}
              className="px-3.5 py-2.5 text-xs font-mono-code text-slate-300 hover:text-white bg-[#181D29] hover:bg-[#202738] border border-[#2A3449] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-[#63E6FF]" />
              <span>{showRawIcs ? 'Hide Raw .ICS' : 'Inspect Raw .ICS'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={exportedCount === 0}
              className="px-4 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider text-[#0B0D12] bg-[#D7FF64] hover:bg-[#c8f54c] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_0_15px_rgba(215,255,100,0.25)] flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0B0D12]" />
              <span>Export .ICS ({exportedCount})</span>
            </button>
          </div>
        </div>

        {/* Skipped Events Warning if any lack mandatory dates */}
        {skippedCount > 0 && (
          <div className="p-3 bg-[#1C1914] border border-[#FFC86B]/40 rounded-xl text-xs font-mono-code text-[#FFC86B] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-[#FFC86B]" />
              <span>{skippedCount} Event(s) Excluded from Export:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#FFC86B]/90">
              {skippedReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Raw ICS Viewer Drawer */}
        {showRawIcs && (
          <div className="space-y-2 pt-3 border-t border-[#1F2637]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code font-bold text-white uppercase tracking-wider">
                RFC 5545 Raw Payload Stream
              </span>
              <button
                onClick={handleCopyRaw}
                className="text-xs font-mono-code text-[#63E6FF] hover:text-[#D7FF64] flex items-center gap-1.5 cursor-pointer font-bold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedRaw ? 'Copied to Clipboard!' : 'Copy Raw Text'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0B0D12] text-[#63E6FF] border border-[#2A3449] rounded-xl text-xs font-mono-code overflow-x-auto max-h-64 leading-relaxed">
              {icsString}
            </pre>
          </div>
        )}
      </div>

      {/* Selectable Events Table */}
      <div className="bg-[#121620] rounded-2xl border border-[#1F2637] shadow-xl overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-[#1F2637] flex items-center justify-between bg-[#181D29]/60">
          <div>
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
              Selective Inclusions
            </h3>
            <p className="text-xs font-mono-code text-[#9299A8] mt-0.5">
              Only verified items will be packaged into the downloaded iCalendar container
            </p>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-xs font-mono-code text-[#D7FF64] hover:underline cursor-pointer"
          >
            {selectedIds.size === events.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono-code text-[#9299A8]">
            No schedule events found in database. Analyze a notice or add events to export.
          </div>
        ) : (
          <div className="divide-y divide-[#1F2637]">
            {events.map(evt => {
              const isSelected = selectedIds.has(evt.id);
              const hasDateError = !evt.date || evt.date.length < 10;

              return (
                <div
                  key={evt.id}
                  className={`p-4 flex items-center justify-between gap-3 hover:bg-[#181D29]/40 transition-colors ${
                    hasDateError ? 'bg-[#1C141B]/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected && !hasDateError}
                      disabled={hasDateError}
                      onChange={() => toggleSelect(evt.id)}
                      className="w-4 h-4 accent-[#D7FF64] rounded cursor-pointer disabled:opacity-40"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {evt.title}
                        </span>
                        {evt.isDeadline && (
                          <span className="text-[10px] font-mono-code font-bold text-[#FFC86B] bg-[#FFC86B]/20 border border-[#FFC86B]/40 px-1.5 py-0.2 rounded">
                            DEADLINE
                          </span>
                        )}
                        {hasDateError && (
                          <span className="text-[10px] font-mono-code font-bold text-[#FF647C] bg-[#FF647C]/20 border border-[#FF647C]/40 px-1.5 py-0.2 rounded">
                            MISSING DATE
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code text-[#9299A8] mt-1">
                        <span className="text-[#63E6FF]">{evt.type}</span>
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        <span>{formatDateDisplay(evt.date)}</span>
                        {evt.startTime && (
                          <>
                            <span aria-hidden="true" className="text-slate-700">·</span>
                            <span className="text-slate-300 tabular-nums">{evt.startTime} {evt.endTime ? `– ${evt.endTime}` : ''}</span>
                          </>
                        )}
                        {evt.venue && (
                          <>
                            <span aria-hidden="true" className="text-slate-700">·</span>
                            <span className="text-slate-400">{evt.venue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono-code text-[#9299A8] shrink-0">
                    {hasDateError ? 'SKIPPED' : isSelected ? 'INCLUDED' : 'OMITTED'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
