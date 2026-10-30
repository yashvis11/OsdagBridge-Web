/**
 * InputErrorDialog.tsx
 *
 * "Input Error" modal mirroring desktop CustomMessageBox and CustomTitleBar
 * from osdagbridge.desktop.ui.dialogs.custom_messagebox.
 *
 * Matches desktop implementation:
 *   - CustomTitleBar: 32px height, /vectors/Osdag_logo.svg (20x20), "Input Error" label (12px, medium),
 *     46x32 close button with "✕", 1px bottom border.
 *   - Dialog frame: 1px solid #90AF13 border, #ffffff background, 4px border-radius.
 *   - Content layout: 20px padding, /vectors/msg_warning.svg (34x34), 12px text (#1f1f1f).
 *   - Button layout: right-aligned #FF9800 orange "OK" button (height 30px, border-radius 5px, 12px font).
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';

export const InputErrorDialog: React.FC = () => {
  const inputErrorDialog = useBridgeStore((s) => s.inputErrorDialog);
  const dismissInputErrorDialog = useBridgeStore((s) => s.dismissInputErrorDialog);

  const [closeHover, setCloseHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [btnActive, setBtnActive] = useState(false);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inputErrorDialog) {
        dismissInputErrorDialog();
      }
    },
    [inputErrorDialog, dismissInputErrorDialog],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!inputErrorDialog) return null;

  const handleOk = () => {
    inputErrorDialog.onOk();
    dismissInputErrorDialog();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-error-title"
      aria-describedby="input-error-message"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      {/* Dialog card — mirrors CustomMessageBox (1px solid #90AF13 border, white bg) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #90AF13',
          borderRadius: '4px',
          minWidth: '380px',
          maxWidth: '460px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* CustomTitleBar — mirrors desktop CustomTitleBar (32px, Osdag_logo.svg, ✕ close button) */}
        <div
          style={{
            height: '32px',
            background: '#f4f4f4',
            borderBottom: '1px solid #dcdcdc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '8px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/vectors/Osdag_logo.svg"
              alt="Osdag"
              width={20}
              height={20}
              style={{ display: 'block' }}
            />
            <span
              id="input-error-title"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#1f1f1f',
              }}
            >
              Input Error
            </span>
          </div>

          <button
            type="button"
            onClick={dismissInputErrorDialog}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            aria-label="Close"
            style={{
              width: '46px',
              height: '32px',
              border: 'none',
              background: closeHover ? '#e81123' : 'transparent',
              color: closeHover ? '#ffffff' : '#333333',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.1s ease, color 0.1s ease',
            }}
          >
            ✕
          </button>
        </div>

        {/* ContentWidget — mirrors contentLayout (20px margins, msg_warning.svg, 12px text) */}
        <div
          style={{
            padding: '20px 20px 16px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Inner row: warning icon + text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <img
              src="/vectors/msg_warning.svg"
              alt="Warning"
              width={34}
              height={34}
              style={{
                flexShrink: 0,
                display: 'block',
              }}
            />
            <p
              id="input-error-message"
              style={{
                fontSize: '12px',
                color: '#1f1f1f',
                lineHeight: 1.5,
                margin: 0,
                textAlign: 'left',
              }}
            >
              {inputErrorDialog.message}
            </p>
          </div>

          {/* Button layout — right-aligned #FF9800 warning button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '16px',
            }}
          >
            <button
              type="button"
              onClick={handleOk}
              autoFocus
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => {
                setBtnHover(false);
                setBtnActive(false);
              }}
              onMouseDown={() => setBtnActive(true)}
              onMouseUp={() => setBtnActive(false)}
              style={{
                height: '30px',
                minWidth: '70px',
                padding: '5px 18px',
                backgroundColor: btnActive ? '#F57C00' : btnHover ? '#FB8C00' : '#FF9800',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

