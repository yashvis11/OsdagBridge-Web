/**
 * App.tsx
 *
 * Root component for the OsdagBridge web workbench.
 * Mirrors the top-level layout of osdagbridge.desktop.ui.template_page.
 *
 * Layout structure:
 *   ┌─────────────────────────────────────────────────┐
 *   │ Header (menu bar + viewport toggles)            │
 *   ├────────────┬──────────────────────┬─────────────┤
 *   │ InputDock  │   (app-center)       │ OutputDock  │
 *   │            │                      │             │
 *   │            ├──────────────────────┤             │
 *   │            │ LogDock (bottom-ctr) │             │
 *   └────────────┴──────────────────────┴─────────────┘
 *
 * Modals:
 *   ProjectLocationModal — project location picker (always mounted, hidden until triggered)
 */

import React, { useEffect } from 'react';
import { useBridgeStore } from './store/useBridgeStore';
import { Header } from './components/layout/Header';
import { InputDock } from './components/docks/InputDock';
import { OutputDock } from './components/docks/OutputDock';
import { LogDock } from './components/docks/LogDock';
import { ProjectLocationModal } from './components/dialogs/ProjectLocationModal';
import { InputErrorDialog } from './components/dialogs/InputErrorDialog';
import { ViewportContainer } from './components/viewports/ViewportContainer';

export default function App() {
  const darkMode = useBridgeStore((s) => s.darkMode);
  const isLogDockOpen = useBridgeStore((s) => s.isLogDockOpen);

  // Sync the HTML root element's data-theme attribute with the store flag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <div
      className="app-root"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}
    >
      {/* Accessibility: skip-nav link */}
      <a href="#main-workbench" className="skip-link">Skip to workbench</a>

      <Header />

      {/* Three-column workbench: Input | Center (Log) | Output */}
      <div
        id="main-workbench"
        className="app-workbench"
        role="main"
        style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
      >
        <InputDock />

        <div
          className="app-center"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minWidth: 0,
            position: 'relative',
          }}
        >          
          <div style={{ flex: 1, minHeight: 0, paddingBottom: isLogDockOpen ? 190 : 0 }}>
            <ViewportContainer />
          </div>

          {/* LogDock anchored to bottom-center of the center panel.
          {/* LogDock anchored to bottom-center of the center panel.
              position:absolute keeps it out of the flex flow so the
              center area above stays free for a future viewport panel.
              maxHeight:50% prevents the expanded dock from covering more
              than half the available height and overlapping the side docks.
              width:100% + left:0 fills the full center column width. */}
          {isLogDockOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                maxHeight: '50%',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <LogDock />
            </div>
          )}
        </div>

        <OutputDock />
      </div>

      {/* Modals — always mounted, revealed by store flags */}
      <ProjectLocationModal />
      <InputErrorDialog />
    </div>
  );
}
