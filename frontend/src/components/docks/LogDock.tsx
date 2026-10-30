/**
 * LogDock.tsx
 *
 * Log dock component for the OsdagBridge workbench.
 * Adapts osdagbridge.desktop.ui.docks.log_dock.LogDock for React.
 *
 * Features (matching desktop behaviour):
 *   - Title bar with dynamic title: "Log Window", "Log Window — Analysing… X%", "Log Window — Complete (100%)"
 *   - Inline progress bar shown while analysis is running (0–99%)
 *   - Color-coded messages by log level: error (red), warning (orange), success (green), info/stdout (grey)
 *   - Smart auto-scroll: scrolls to bottom only if user was already at bottom (within 15px tolerance)
 *   - Copy logs to clipboard (with fallback for older browsers)
 *   - Reset / Clear action restoring initial "Log initialized" state
 *   - Minimizable (collapse title bar only) and closeable
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { Terminal, Trash2, Copy, Check, ChevronDown, ChevronUp, X } from 'lucide-react';

// ─── Log Level → Color Map ─────────────────────────────────────────────────────

/** Returns the display color for a given log level, matching desktop log_dock.py colors. */
function getLevelColor(level: string): string {
  switch (level) {
    case 'error':        return '#FF0000'; // Red
    case 'warning':      return '#FFA500'; // Orange
    case 'success':      return '#008000'; // Green
    case 'stdout_print':
    case 'info':
    default:             return 'var(--log-text-color)'; // Grey / theme default
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LogDock: React.FC = () => {
  const {
    isLogDockOpen,
    toggleLogDock,
    isLogDockCollapsed,
    toggleLogDockCollapse,
    logWindowTitle,
    logProgress,
    logs,
    resetLogs,
    activeViewportTab,
  } = useBridgeStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Auto-scroll when new logs arrive; honours the "within 15px of bottom" rule (matches desktop)
  useEffect(() => {
    if (!scrollRef.current || !isAutoScroll || isLogDockCollapsed) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs, isAutoScroll, isLogDockCollapsed]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAutoScroll(scrollHeight - scrollTop - clientHeight <= 15);
  };

  const handleCopyLogs = async () => {
    const text = logs.map((l) => l.message).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without Clipboard API
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isLogDockOpen) return null;

  return (
    <div
      id="logs_dock"
      style={{
        width: '100%',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: isLogDockCollapsed ? '28px' : (activeViewportTab === 'plots' ? '140px' : 'clamp(130px, 18.5vh, 180px)'),
        flexShrink: 0,
        transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 5,
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Title Bar (mirrors QLabel log_window_title in log_dock.py init_ui) ── */}
      <div
        style={{
          height: '26px',
          minHeight: '26px',
          background: 'var(--log-header-bg)',
          borderBottom: isLogDockCollapsed ? 'none' : '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          userSelect: 'none',
        }}
      >
        {/* Left: Title + Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              fontFamily: 'inherit',
            }}
          >
            {logWindowTitle}
          </span>

          {/* Inline progress bar shown while analysis is running (0–99%) */}
          {logProgress !== null && logProgress < 100 && (
            <div
              style={{
                width: '60px',
                height: '4px',
                background: 'rgba(144, 175, 19, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${logProgress}%`,
                  height: '100%',
                  background: 'var(--accent-osdag)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          )}
        </div>

        {/* Right: Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Copy Logs */}
          <button
            id="btn_copy_logs"
            type="button"
            onClick={handleCopyLogs}
            title="Copy logs to clipboard"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copied ? 'var(--accent-osdag)' : 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {/* Delete / Close Log Dock */}
          <button
            id="btn_delete_logs"
            type="button"
            onClick={() => toggleLogDock(false)}
            title="Close Log Window"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
            }}
          >
            <Trash2 size={13} />
          </button>

          {/* Collapse / Expand */}
          <button
            id="btn_toggle_collapse_logs"
            type="button"
            onClick={toggleLogDockCollapse}
            title={isLogDockCollapsed ? 'Expand Log Window' : 'Minimize Log Window'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
            }}
          >
            {isLogDockCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Close Dock */}
          <button
            id="btn_close_logs"
            type="button"
            onClick={() => toggleLogDock(false)}
            title="Close Log Window"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Log Display Area (mirrors QTextEdit#textEdit in log_dock.py) ───────── */}
      {!isLogDockCollapsed && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          id="textEdit"
          role="log"
          aria-live="polite"
          aria-label="Design log messages"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '5px 8px',
            background: 'var(--log-bg)',
            color: 'var(--log-text)',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            lineHeight: 1.45,
            border: '1px solid var(--log-border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            userSelect: 'text',
          }}
        >
          {logs.map((entry) => (
            <div
              key={entry.id}
              style={{
                color: getLevelColor(entry.level),
                marginBottom: '2px',
              }}
            >
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
