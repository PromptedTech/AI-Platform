/**
 * SourceBadge Component
 * 
 * Displays inline badges showing which knowledge base files
 * were used to generate an AI response.
 * 
 * Features:
 * - Clickable badges showing source filenames
 * - Tooltip with chunk preview on hover
 * - Expandable panel showing all sources
 */

import { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function SourceBadge({ sources = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredSource, setHoveredSource] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const badgeRef = useRef(null);

  // Don't render if no sources
  if (!sources || sources.length === 0) {
    return null;
  }

  // Group sources by filename
  const groupedSources = sources.reduce((acc, source) => {
    const filename = source.filename || 'Unknown';
    if (!acc[filename]) {
      acc[filename] = [];
    }
    acc[filename].push(source);
    return acc;
  }, {});

  const filenames = Object.keys(groupedSources);
  const totalChunks = sources.length;

  /**
   * Handle badge hover for tooltip
   */
  const handleMouseEnter = (e, source) => {
    if (!source.text) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top - 10,
      left: rect.left + rect.width / 2,
    });
    setHoveredSource(source);
  };

  const handleMouseLeave = () => {
    setHoveredSource(null);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      {/* Compact View */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <FileText className="w-3.5 h-3.5" />
          <span className="font-medium">Sources:</span>
        </div>

        {/* Show up to 3 filenames */}
        {filenames.slice(0, 3).map((filename, index) => (
          <button
            key={index}
            ref={badgeRef}
            onMouseEnter={(e) => handleMouseEnter(e, groupedSources[filename][0])}
            onMouseLeave={handleMouseLeave}
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <span className="truncate max-w-[120px]">{filename}</span>
            {groupedSources[filename].length > 1 && (
              <span className="text-blue-500 dark:text-blue-400">
                ×{groupedSources[filename].length}
              </span>
            )}
          </button>
        ))}

        {/* More indicator */}
        {filenames.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            +{filenames.length - 3} more
          </button>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Show all ({totalChunks})</span>
            </>
          )}
        </button>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {Object.entries(groupedSources).map(([filename, chunks], fileIndex) => (
              <div key={fileIndex}>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{filename}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({chunks.length} chunk{chunks.length > 1 ? 's' : ''})
                  </span>
                </div>
                
                <div className="ml-6 space-y-1">
                  {chunks.map((chunk, chunkIndex) => (
                    <div
                      key={chunkIndex}
                      className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-white dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-medium text-gray-500 dark:text-gray-500">
                          Chunk {chunkIndex + 1}
                        </span>
                        {chunk.score !== undefined && (
                          <span className="text-[10px] text-green-600 dark:text-green-400">
                            {(chunk.score * 100).toFixed(0)}% match
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2">
                        {chunk.text || 'No preview available'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredSource && hoveredSource.text && (
        <div
          className="fixed z-50 max-w-sm p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <div className="mb-1 font-medium opacity-75">
            {hoveredSource.filename}
          </div>
          <div className="line-clamp-4">
            {hoveredSource.text}
          </div>
          {hoveredSource.score !== undefined && (
            <div className="mt-1 text-[10px] opacity-75">
              Relevance: {(hoveredSource.score * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
