import React from 'react';
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CitationChecker({ events, finalText }) {
  // Extract paste events
  const pasteEvents = events.filter(e => e.event_type === 'paste');

  // Analyze each paste for citations
  const analyzePastes = () => {
    return pasteEvents.map(event => {
      const pastedText = event.payload?.text || '';
      const wordCount = pastedText.split(/\s+/).filter(Boolean).length;
      
      // Check if paste is significant (>50 words)
      const isSignificant = wordCount > 50;

      // Simple citation detection
      const hasQuotes = pastedText.includes('"') || pastedText.includes("'");
      const hasCitationMarkers = /\(.*\d{4}.*\)|[\[\(]\d+[\]\)]/.test(pastedText);
      
      // Check if text appears in final document with citation context
      const searchContext = finalText.substring(
        Math.max(0, finalText.indexOf(pastedText.substring(0, 50)) - 200),
        finalText.indexOf(pastedText.substring(0, 50)) + pastedText.length + 200
      );
      
      const hasBibliography = finalText.toLowerCase().includes('bibliography') || 
                             finalText.toLowerCase().includes('references') ||
                             finalText.toLowerCase().includes('works cited');
      
      const hasCitationInContext = /\(.*\d{4}.*\)|[\[\(]\d+[\]\)]/.test(searchContext) ||
                                   searchContext.includes('"');

      const cited = hasQuotes || hasCitationMarkers || hasCitationInContext;

      return {
        timestamp: event.timestamp,
        content: pastedText,
        wordCount,
        isSignificant,
        cited,
        hasBibliography
      };
    });
  };

  const pasteAnalysis = analyzePastes();
  const significantPastes = pasteAnalysis.filter(p => p.isSignificant);
  const uncitedPastes = significantPastes.filter(p => !p.cited);

  if (pasteEvents.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">No Paste Events Detected</h4>
          <p className="text-xs text-emerald-700 mt-1">
            Student typed the entire essay manually. Excellent originality.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Citation Analysis</h3>
        <div className="flex items-center gap-2 text-xs">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">{pasteEvents.length} paste events</span>
        </div>
      </div>

      {/* Summary Card */}
      <div className={cn(
        'rounded-lg p-4 border-2',
        uncitedPastes.length > 0 
          ? 'bg-rose-50 border-rose-300'
          : 'bg-emerald-50 border-emerald-300'
      )}>
        <div className="flex items-start gap-3">
          {uncitedPastes.length > 0 ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className={cn(
              'text-sm font-semibold',
              uncitedPastes.length > 0 ? 'text-rose-900' : 'text-emerald-900'
            )}>
              {uncitedPastes.length > 0 
                ? `${uncitedPastes.length} Uncited Paste Event${uncitedPastes.length > 1 ? 's' : ''}`
                : 'All Pastes Properly Cited'
              }
            </h4>
            <p className={cn(
              'text-xs mt-1',
              uncitedPastes.length > 0 ? 'text-rose-700' : 'text-emerald-700'
            )}>
              {uncitedPastes.length > 0
                ? 'Student pasted content without proper attribution. Review required.'
                : 'All pasted content appears with citations or quotation marks.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {pasteAnalysis.map((paste, idx) => (
          <div
            key={idx}
            className={cn(
              'p-3 rounded-lg border text-sm',
              paste.isSignificant && !paste.cited
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">
                Paste Event #{idx + 1} • {paste.wordCount} words
              </span>
              {paste.cited ? (
                <span className="text-xs text-emerald-600 font-medium">✓ Cited</span>
              ) : paste.isSignificant ? (
                <span className="text-xs text-rose-600 font-medium">⚠ No Citation</span>
              ) : (
                <span className="text-xs text-slate-400">Minor paste</span>
              )}
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">
              {paste.content}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <strong>IB Academic Honesty:</strong> Pastes over 50 words require proper citation. 
        System flags uncited material for manual review.
      </div>
    </div>
  );
}