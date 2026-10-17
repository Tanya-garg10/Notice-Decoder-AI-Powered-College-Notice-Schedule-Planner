import { NoticeDiffResult } from '../types/notice';

/**
 * Computes word-level tokens from text
 */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Finds date-like patterns in text
 */
function findDatesInText(text: string): string[] {
  const matches = text.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,\s]+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/gi);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Finds time patterns in text
 */
function findTimesInText(text: string): string[] {
  const matches = text.match(/\b(?:\d{1,2}(?::\d{2})?\s*(?:AM|PM|noon|midnight)|\d{1,2}:\d{2})\b/gi);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Finds venue-like phrases
 */
function findVenuesInText(text: string): string[] {
  const matches = text.match(/\b(?:Room\s+\d+[A-Z]?|Seminar\s+Hall|Auditorium|Lab\s+\d+|Department\s+Office|LH-?\d+)\b/gi);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Compares an original notice and a revised notice
 */
export function compareNotices(original: string, revised: string): NoticeDiffResult {
  const cleanOrig = original.trim();
  const cleanRev = revised.trim();

  const origDates = findDatesInText(cleanOrig);
  const revDates = findDatesInText(cleanRev);

  const origTimes = findTimesInText(cleanOrig);
  const revTimes = findTimesInText(cleanRev);

  const origVenues = findVenuesInText(cleanOrig);
  const revVenues = findVenuesInText(cleanRev);

  // Sentence-level arrays for evidence matching
  const origSentences = cleanOrig
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  const revSentences = cleanRev
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  const findSentence = (sentences: string[], token: string): string | undefined => {
    if (!token) return undefined;
    return sentences.find(s => s.toLowerCase().includes(token.toLowerCase()));
  };

  // Compare dates
  const dateChanges: { original: string; revised: string; originalSentence?: string; revisedSentence?: string }[] = [];
  const maxDates = Math.max(origDates.length, revDates.length);
  for (let i = 0; i < maxDates; i++) {
    const o = origDates[i] || '';
    const r = revDates[i] || '';
    if (o && r && o.toLowerCase() !== r.toLowerCase()) {
      dateChanges.push({
        original: o,
        revised: r,
        originalSentence: findSentence(origSentences, o),
        revisedSentence: findSentence(revSentences, r),
      });
    }
  }

  // Compare times
  const timeChanges: { original: string; revised: string; originalSentence?: string; revisedSentence?: string }[] = [];
  const maxTimes = Math.max(origTimes.length, revTimes.length);
  for (let i = 0; i < maxTimes; i++) {
    const o = origTimes[i] || '';
    const r = revTimes[i] || '';
    if (o && r && o.toLowerCase() !== r.toLowerCase()) {
      timeChanges.push({
        original: o,
        revised: r,
        originalSentence: findSentence(origSentences, o),
        revisedSentence: findSentence(revSentences, r),
      });
    }
  }

  // Compare venues
  const venueChanges: { original: string; revised: string; originalSentence?: string; revisedSentence?: string }[] = [];
  const maxVenues = Math.max(origVenues.length, revVenues.length);
  for (let i = 0; i < maxVenues; i++) {
    const o = origVenues[i] || '';
    const r = revVenues[i] || '';
    if (o && r && o.toLowerCase() !== r.toLowerCase()) {
      venueChanges.push({
        original: o,
        revised: r,
        originalSentence: findSentence(origSentences, o),
        revisedSentence: findSentence(revSentences, r),
      });
    }
  }

  const removedPhrases: string[] = [];
  const addedPhrases: string[] = [];

  for (const os of origSentences) {
    if (!revSentences.includes(os)) {
      // Check if partially modified
      const hasSimilar = revSentences.some(rs => {
        const tokensO = new Set(tokenize(os.toLowerCase()));
        const tokensR = new Set(tokenize(rs.toLowerCase()));
        let overlap = 0;
        tokensO.forEach(t => { if (tokensR.has(t)) overlap++; });
        return overlap / Math.max(tokensO.size, tokensR.size) > 0.4;
      });
      if (!hasSimilar) {
        removedPhrases.push(os);
      }
    }
  }

  for (const rs of revSentences) {
    if (!origSentences.includes(rs)) {
      const hasSimilar = origSentences.some(os => {
        const tokensO = new Set(tokenize(os.toLowerCase()));
        const tokensR = new Set(tokenize(rs.toLowerCase()));
        let overlap = 0;
        tokensR.forEach(t => { if (tokensO.has(t)) overlap++; });
        return overlap / Math.max(tokensO.size, tokensR.size) > 0.4;
      });
      if (!hasSimilar) {
        addedPhrases.push(rs);
      }
    }
  }

  // Generate actionable summary items
  const summaryItems: string[] = [];

  dateChanges.forEach(dc => {
    summaryItems.push(`Date adjusted: from "${dc.original}" to "${dc.revised}".`);
  });

  timeChanges.forEach(tc => {
    summaryItems.push(`Time slot updated: from "${tc.original}" to "${tc.revised}".`);
  });

  venueChanges.forEach(vc => {
    summaryItems.push(`Location moved: from "${vc.original}" to "${vc.revised}".`);
  });

  addedPhrases.forEach(ap => {
    summaryItems.push(`New requirement or clause added: "${ap}".`);
  });

  removedPhrases.forEach(rp => {
    summaryItems.push(`Removed clause: "${rp}".`);
  });

  if (summaryItems.length === 0) {
    if (cleanOrig === cleanRev) {
      summaryItems.push('Both notices are identical. No scheduling or text changes detected.');
    } else {
      summaryItems.push('Minor wording or punctuation edits detected. Key dates and times appear consistent.');
    }
  }

  // Annotated tokens for side-by-side visualization
  const origTokens = tokenize(cleanOrig);
  const revTokens = tokenize(cleanRev);
  const revTokenSet = new Set(revTokens.map(t => t.toLowerCase()));
  const origTokenSet = new Set(origTokens.map(t => t.toLowerCase()));

  const annotatedOriginal = origTokens.map(t => ({
    text: t,
    status: (revTokenSet.has(t.toLowerCase()) ? 'unchanged' : 'removed') as 'unchanged' | 'removed' | 'modified',
  }));

  const annotatedRevised = revTokens.map(t => ({
    text: t,
    status: (origTokenSet.has(t.toLowerCase()) ? 'unchanged' : 'added') as 'unchanged' | 'added' | 'modified',
  }));

  return {
    addedPhrases,
    removedPhrases,
    dateChanges,
    timeChanges,
    venueChanges,
    summaryItems,
    annotatedOriginal,
    annotatedRevised,
  };
}
