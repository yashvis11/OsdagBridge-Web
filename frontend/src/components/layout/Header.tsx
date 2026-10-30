/**
 * Header.tsx
 *
 * Application menu bar for the OsdagBridge workbench.
 * Adapts the desktop template_page.py title bar and menu structure for web.
 *
 * Structure:
 *   - Brand area: Osdag logo + application title.
 *   - Menu bar (nav): File, Graphics, Database, Help drop-down menus.
 *   - Controls (right): Viewport toggle buttons, theme switcher, Design quick-action.
 *
 * Design notes:
 *   - MenuDropdown is extracted as an inline component to keep menu rendering self-contained.
 *   - viewControls is a data-driven array; adding a new toolbar button requires only
 *     a new entry, not additional JSX.
 *   - Ctrl+S keyboard shortcut mirrors the desktop Save Input binding.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

type MenuItem = {
  label?: string;
  shortcut?: string;
  action?: () => void;
  separator?: boolean;
  submenu?: MenuItem[];
};

type ViewControl = {
  key: string;
  tooltip: string;
  active: boolean;
  activeIcon: string;
  inactiveIcon: string;
  onClick: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Base path for toolbar vector icons (view_btn directory) */
const VIEW_BTN_BASE = '/vectors/view_btn';

// ─── MenuDropdown ─────────────────────────────────────────────────────────────

const MenuDropdown: React.FC<{
  title: string;
  items: MenuItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ title, items, open, onToggle, onClose }) => {
  const renderItems = (list: MenuItem[], depth = 0): React.ReactNode =>
    list.map((item, idx) => {
      if (item.separator) {
        return <div key={`sep-${idx}`} role="separator" className="osdag-menu-separator" />;
      }
      if (item.submenu) {
        return (
          <div key={item.label} className="osdag-menu-submenu">
            <button type="button" className="osdag-menu-item" role="menuitem" aria-haspopup="true">
              <span>{item.label}</span>
              <span className="osdag-menu-arrow">▸</span>
            </button>
            <div className="osdag-menu-panel osdag-menu-panel--nested" role="menu">
              {renderItems(item.submenu, depth + 1)}
            </div>
          </div>
        );
      }
      return (
        <button
          key={item.label}
          type="button"
          className="osdag-menu-item"
          role="menuitem"
          onClick={() => {
            item.action?.();
            onClose();
          }}
        >
          <span>{item.label}</span>
          {item.shortcut && <span className="osdag-menu-shortcut">{item.shortcut}</span>}
        </button>
      );
    });

  return (
    <div className="osdag-menu" style={{ position: 'relative' }}>
      <button
        type="button"
        className={`osdag-menu-title${open ? ' is-open' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onToggle}
      >
        {title}
      </button>
      {open && (
        <div className="osdag-menu-panel" role="menu" aria-label={title}>
          {renderItems(items)}
        </div>
      )}
    </div>
  );
};

// ─── Header Component ─────────────────────────────────────────────────────────

export const Header: React.FC = () => {
  const {
    activeViewportTab,
    setActiveViewportTab,
    showCrossSection,
    showTopView,
    toggleCrossSection,
    toggleTopView,
    toggleCad3dView,
    togglePlotsView,
    isLogDockOpen,
    toggleLogDock,
    isDockCollapsed,
    toggleDock,
    isOutputDockCollapsed,
    toggleOutputDock,
    resetInputs,
    saveInputs,
    loadInputs,
    saveLogs,
    export3DModel,
    exportCadImage,
    setReportModalOpen,
    darkMode,
    toggleDarkMode,
    runDesign,
  } = useBridgeStore();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Close menus when clicking outside the header
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Ctrl+S: mirrors desktop "Save Input" keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveInputs();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveInputs]);

  // ── Menu Definitions ─────────────────────────────────────────────────────────

  const menus: { title: string; items: MenuItem[] }[] = [
    {
      title: 'File',
      items: [
        { label: 'Load Input',           shortcut: 'Ctrl+L',   action: loadInputs },
        { separator: true },
        { label: 'Save Input',           shortcut: 'Ctrl+S',   action: saveInputs },
        { label: 'Save Log Messages',    shortcut: 'Alt+M',    action: saveLogs },
        { label: 'Create Design Report', shortcut: 'Alt+C',    action: () => setReportModalOpen(true) },
        { separator: true },
        { label: 'Save 3D Model',        shortcut: 'Alt+3',    action: () => export3DModel('stp') },
        { label: 'Save CAD Image',       shortcut: 'Alt+I',    action: exportCadImage },
        { separator: true },
        { label: 'Quit',                 shortcut: 'Shift+Q',  action: () => window.close() },
      ],
    },
    {
      title: 'Graphics',
      items: [
        { label: 'Zoom In',              shortcut: 'Ctrl+I' },
        { label: 'Zoom Out',             shortcut: 'Ctrl+O' },
        { label: 'Pan',                  shortcut: 'Ctrl+P' },
        { label: 'Rotate 3D Model',      shortcut: 'Ctrl+R' },
        { separator: true },
        { label: 'Show Front View',      shortcut: 'Alt+Shift+F' },
        { label: 'Show Top View',        shortcut: 'Alt+Shift+T', action: () => setActiveViewportTab('plan') },
        { label: 'Show Side View',       shortcut: 'Alt+Shift+S' },
      ],
    },
    {
      title: 'Database',
      items: [
        { label: 'Save Inputs (.csv)' },
        { label: 'Save Outputs (.csv)' },
        { label: 'Save Inputs (.osi)',   action: saveInputs },
        {
          label: 'Download Database',
          submenu: [
            { label: 'Column' },
            { label: 'Beam' },
            { label: 'Channel' },
            { label: 'Angle' },
          ],
        },
        { separator: true },
        { label: 'Reset',               shortcut: 'Alt+R',    action: resetInputs },
      ],
    },
    {
      title: 'Help',
      items: [
        { label: 'Video Tutorials' },
        { label: 'Design Examples' },
        { separator: true },
        { label: 'Ask Us a Question' },
        { label: 'About Osdag' },
        { separator: true },
        { label: 'Check For Update' },
      ],
    },
  ];

  // ── Viewport / Dock Toggle Controls ──────────────────────────────────────────

  const viewControls: ViewControl[] = [
    {
      key: 'cross_section',
      tooltip: 'Toggle Cross-Section View',
      active: activeViewportTab !== '3d' && activeViewportTab !== 'plots' && showCrossSection,
      activeIcon:   `${VIEW_BTN_BASE}/cross_section_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/cross_section_inactive.svg`,
      onClick: toggleCrossSection,
    },
    {
      key: 'top_view',
      tooltip: 'Toggle Top View',
      active: activeViewportTab !== '3d' && activeViewportTab !== 'plots' && showTopView,
      activeIcon:   `${VIEW_BTN_BASE}/top_view_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/top_view_inactive.svg`,
      onClick: toggleTopView,
    },
    {
      key: 'logs_dock',
      tooltip: 'Toggle Log Dock',
      active: isLogDockOpen,
      activeIcon:   `${VIEW_BTN_BASE}/logs_dock_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/logs_dock_inactive.svg`,
      onClick: () => toggleLogDock(),
    },
    {
      key: '3d_cad',
      tooltip: 'Toggle 3D CAD View',
      active: activeViewportTab === '3d',
      activeIcon:   `${VIEW_BTN_BASE}/3d_cad_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/3d_cad_inactive.svg`,
      onClick: toggleCad3dView,
    },
    {
      key: 'plots',
      tooltip: 'Toggle Plots View',
      active: activeViewportTab === 'plots',
      activeIcon:   `${VIEW_BTN_BASE}/plots_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/plots_inactive.svg`,
      onClick: togglePlotsView,
    },
    {
      key: 'input_dock',
      tooltip: 'Toggle Input Dock',
      active: !isDockCollapsed,
      activeIcon:   `${VIEW_BTN_BASE}/input_dock_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/input_dock_inactive.svg`,
      onClick: toggleDock,
    },
    {
      key: 'output_dock',
      tooltip: 'Toggle Output Dock',
      active: !isOutputDockCollapsed,
      activeIcon:   `${VIEW_BTN_BASE}/output_dock_active.svg`,
      inactiveIcon: `${VIEW_BTN_BASE}/output_dock_inactive.svg`,
      onClick: toggleOutputDock,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <header ref={headerRef} role="banner" className="app-header osdag-menubar">
      {/* Brand / Logo Area */}
      <div className="osdag-menubar__brand">
        <img src="/vectors/Osdag_logo.svg" alt="Osdag" width={20} height={20} />
        <span className="osdag-menubar__title">OsdagBridge</span>
      </div>

      {/* Application Menu Bar */}
      <nav aria-label="Application menu" className="osdag-menubar__menus">
        {menus.map((menu) => (
          <MenuDropdown
            key={menu.title}
            title={menu.title}
            items={menu.items}
            open={openMenu === menu.title}
            onToggle={() => setOpenMenu(openMenu === menu.title ? null : menu.title)}
            onClose={() => setOpenMenu(null)}
          />
        ))}
      </nav>

      {/* Right: Viewport Controls + Theme + Design Quick-Action */}
      <div className="osdag-menubar__controls">
        {viewControls.map((ctrl) => (
          <button
            key={ctrl.key}
            id={`btn_${ctrl.key}`}
            type="button"
            className={`osdag-viewbtn${ctrl.active ? ' is-active' : ''}`}
            title={ctrl.tooltip}
            aria-label={ctrl.tooltip}
            aria-pressed={ctrl.active}
            onClick={ctrl.onClick}
          >
            <img
              src={ctrl.active ? ctrl.activeIcon : ctrl.inactiveIcon}
              alt=""
              width={18}
              height={18}
            />
          </button>
        ))}

        <span className="osdag-menubar__divider" aria-hidden="true" />

        <button
          type="button"
          className="osdag-quickbtn"
          onClick={toggleDarkMode}
          title="Toggle theme"
          aria-label="Toggle dark/light theme"
        >
          {darkMode ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          className="osdag-quickbtn osdag-quickbtn--primary"
          onClick={runDesign}
          aria-label="Run bridge design"
        >
          Design
        </button>
      </div>
    </header>
  );
};
