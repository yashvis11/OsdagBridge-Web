/**
 * OutputDock.tsx
 *
 * Output dock component for the Highway Bridge Design workbench.
 * Adapts osdagbridge.desktop.ui.docks.output_dock.OutputDock for React.
 *
 * Structural organization:
 *   - Toggle strip: Expandable/collapsible indicator on the left dock boundary.
 *   - Top bar: "Output Dock" header label.
 *   - Scroll area:
 *       1. Superstructure collapsible section:
 *          - Girder Analysis Results (member, load case, 3x3 force grid, display values)
 *          - Girder Design (member, load case, DCR utilization bars, design summary)
 *          - Transverse Design (design summary button)
 *          - Deck Design (design summary button)
 *       2. Substructure collapsible section:
 *          - Informational state notice
 *   - Bottom action bar: "Results Table" and "Create Report" custom dock buttons.
 */

import React from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { PercentBarWidget } from '../widgets/PercentBarWidget';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { getNoOfGirders } from '../../utils/bridgeInputs';

// ─── Force Grid Definitions ───────────────────────────────────────────────────

interface ForceOption {
  key: string;
  label: React.ReactNode;
}

const FORCE_COLUMNS: ForceOption[][] = [
  [
    { key: 'Fx', label: <>F<sub>x</sub></> },
    { key: 'Vy', label: <>V<sub>y</sub></> },
    { key: 'Vz', label: <>V<sub>z</sub></> },
  ],
  [
    { key: 'Tx', label: <>T<sub>x</sub></> },
    { key: 'My', label: <>M<sub>y</sub></> },
    { key: 'Mz', label: <>M<sub>z</sub></> },
  ],
  [
    { key: 'Dx', label: <>D<sub>x</sub></> },
    { key: 'Dy', label: <>D<sub>y</sub></> },
    { key: 'Dz', label: <>D<sub>z</sub></> },
  ],
];

export const OutputDock: React.FC = () => {
  const {
    inputs,
    additionalInputs,
    isOutputDockCollapsed,
    toggleOutputDock,
    outputCollapsedSections,
    toggleOutputSection,
    analysisMember,
    setAnalysisMember,
    analysisLoadCase,
    setAnalysisLoadCase,
    analysisForce,
    setAnalysisForce,
    analysisDisplayOptions,
    toggleAnalysisDisplayOption,
    designMember,
    setDesignMember,
    designLoadCase,
    setDesignLoadCase,
    dcrValues,
    requireDesignCheck,
    setSteelDesignModalOpen,
    setTransverseDesignModalOpen,
    setDeckDesignModalOpen,
    setGenerateResultsModalOpen,
    setReportModalOpen,
  } = useBridgeStore();

  const isDesignAvailable = requireDesignCheck();
  const noOfGirders = getNoOfGirders(inputs, additionalInputs);
  const girderItems = Array.from({ length: noOfGirders }, (_, i) => `G${i + 1}`);

  const isSuperstructureCollapsed = Boolean(outputCollapsedSections['superstructure']);
  const isSubstructureCollapsed = Boolean(outputCollapsedSections['substructure']);

  return (
    <div
      className="osdag-output-dock"
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {isOutputDockCollapsed ? (
        // ─── Collapsed Indicator (mirrors desktop OutputDockIndicator) ─────────
        <div className="osdag-dock-indicator osdag-dock-indicator--output">
          {/* row-reverse: strip on left toward center, label SVG on right outer edge */}
          <img
            src="/vectors/outputs_label_light.svg"
            alt="Outputs"
            style={{ width: '32px', height: '100%', display: 'block', userSelect: 'none' }}
          />
          <div
            className="osdag-toggle-strip"
            onClick={toggleOutputDock}
            title="Show output panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '3px 0 0 3px' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleOutputDock();
              }}
              title="Show output panel"
              aria-label="Expand output dock"
            >
              ❮
            </button>
          </div>
        </div>
      ) : (
        // ─── Expanded Output Panel ────────────────────────────────────────────
        <>
          {/* ── 1. Toggle Strip on Left of Output Dock ───────────────────────── */}
          <div
            className="osdag-toggle-strip"
            onClick={toggleOutputDock}
            title="Hide output panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '0 3px 3px 0' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleOutputDock();
              }}
              title="Hide output panel"
              aria-label="Collapse output dock"
            >
              ❯
            </button>
          </div>

          {/* ── 2. Content Container (Output Panel) ─────────────────────────── */}
          <aside
            aria-label="Bridge Design Outputs"
            style={{
              width: '340px',
              minWidth: '340px',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border-color)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 15px 10px 15px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minWidth: '310px',
                boxSizing: 'border-box',
              }}
            >
              {/* ── Top Bar (_build_top_bar) ─────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--accent-osdag)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '7px 20px',
                    textAlign: 'center',
                    cursor: 'default',
                  }}
                >
                  Output Dock
                </button>
              </div>

              {/* ── Scroll Area (_build_scroll_area) ─────────────────────────── */}
              <div
                role="region"
                aria-label="Analysis and design results"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  padding: '6px 4px 10px 2px',
                }}
              >
                {/* ─── SECTION 1: Superstructure (Collapsible Card) ──────────── */}
                <div className="osdag-container-box" style={{ marginTop: '4px' }}>
                  <div
                    className="osdag-container-box__header"
                    style={{
                      cursor: 'pointer',
                      paddingBottom: isSuperstructureCollapsed ? '0' : '8px',
                      borderBottom: isSuperstructureCollapsed ? 'none' : '1px solid var(--border-subtle)',
                      marginBottom: isSuperstructureCollapsed ? '0' : '8px',
                    }}
                    onClick={() => toggleOutputSection('superstructure')}
                  >
                    <span className="osdag-container-box__title">Superstructure</span>
                    <button
                      type="button"
                      className="osdag-container-box__toggle"
                      aria-expanded={!isSuperstructureCollapsed}
                      title={isSuperstructureCollapsed ? 'Expand Superstructure' : 'Collapse Superstructure'}
                    >
                      {isSuperstructureCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                    </button>
                  </div>

                  {!isSuperstructureCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* ── 1.1 Girder Analysis Results Group ─────────────────── */}
                      <div className="osdag-groupbox">
                        <div className="osdag-groupbox__title">
                          <span>Girder Analysis Results</span>
                        </div>

                        {/* Member Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px' }}>
                            Member
                          </label>
                          <select
                            value={analysisMember ?? ''}
                            onChange={(e) => setAnalysisMember(e.target.value || null)}
                            className="osdag-select-field"
                            style={{ flex: 1 }}
                            aria-label="Analysis Member"
                          >
                            <option value="">-</option>
                            <option value="All">All</option>
                            {girderItems.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        {/* Load Case Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px', lineHeight: '1.2' }}>
                            Load Case /<br />Combination
                          </label>
                          <select
                            value={analysisLoadCase ?? ''}
                            onChange={(e) => setAnalysisLoadCase(e.target.value || null)}
                            className="osdag-select-field"
                            style={{ flex: 1, fontSize: '11px' }}
                            aria-label="Analysis Load Case"
                          >
                            <option value="">-</option>
                            <option value="1.35 DL + 1.5 LL">1.35 DL + 1.5 LL</option>
                            <option value="1.0 DL + 1.0 LL">1.0 DL + 1.0 LL</option>
                            <option value="0.9 DL + 1.5 LL">0.9 DL + 1.5 LL</option>
                            <option value="Design Envelope">Design Envelope</option>
                          </select>
                        </div>

                        {/* 3x3 Force Component Radio Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '4px',
                            padding: '6px 0',
                            borderTop: '1px solid var(--border-subtle)',
                            borderBottom: '1px solid var(--border-subtle)',
                            margin: '6px 0',
                          }}
                        >
                          {FORCE_COLUMNS.map((col, cIdx) => (
                            <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {col.map((item) => (
                                <label
                                  key={item.key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '2px 0',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name="force_radio_grid"
                                    checked={Boolean(analysisForce && analysisForce === item.key)}
                                    onChange={() => setAnalysisForce(item.key)}
                                    style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontWeight: analysisForce === item.key ? 700 : 500 }}>
                                    {item.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>

                        {/* Display Values Checkboxes */}
                        <div
                          style={{
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            marginTop: '6px',
                          }}
                        >
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Display Values
                          </div>
                          <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.Max)}
                                onChange={() => toggleAnalysisDisplayOption('Max')}
                                style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                              />
                              <span>Max</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.Min)}
                                onChange={() => toggleAnalysisDisplayOption('Min')}
                                style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                              />
                              <span>Min</span>
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.All)}
                                onChange={() => toggleAnalysisDisplayOption('All')}
                                style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                              />
                              <span>All</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(analysisDisplayOptions?.Summary)}
                                onChange={() => toggleAnalysisDisplayOption('Summary')}
                                style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                              />
                              <span>Summary</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* ── 1.2 Girder Design Group (Utilization Bars) ────────── */}
                      <div className="osdag-groupbox">
                        <div className="osdag-groupbox__title">
                          <span>Girder Design</span>
                        </div>

                        {/* Member Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px' }}>
                            Member
                          </label>
                          <select
                            value={designMember ?? ''}
                            onChange={(e) => setDesignMember(e.target.value || null)}
                            className="osdag-select-field"
                            style={{ flex: 1 }}
                            aria-label="Design Member"
                          >
                            <option value="">-</option>
                            {girderItems.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        {/* Load Case Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px', lineHeight: '1.2' }}>
                            Load Case /<br />Combination
                          </label>
                          <select
                            value={designLoadCase ?? ''}
                            onChange={(e) => setDesignLoadCase(e.target.value || null)}
                            className="osdag-select-field"
                            style={{ flex: 1, fontSize: '11px' }}
                            aria-label="Design Load Case"
                          >
                            <option value="">-</option>
                            <option value="Design Envelope">Design Envelope</option>
                            <option value="1.35 DL + 1.5 LL">1.35 DL + 1.5 LL</option>
                            <option value="1.0 DL + 1.0 LL">1.0 DL + 1.0 LL</option>
                          </select>
                        </div>

                        {/* DCR Utilization Bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '10px' }}>
                          <PercentBarWidget label="Strength Limit State (Flexure)" value={dcrValues?.flexure ?? 0} />
                          <PercentBarWidget label="Strength Limit State (Shear)" value={dcrValues?.shear ?? 0} />
                          <PercentBarWidget label="Interaction" value={dcrValues?.interaction ?? 0} />
                          <PercentBarWidget label="Lateral Torsional Buckling" value={dcrValues?.ltb ?? 0} />
                          <PercentBarWidget label="Resistance to Longitudinal Shear" value={dcrValues?.longTransShear ?? 0} />
                          <PercentBarWidget label="Resistance to Fatigue" value={dcrValues?.fatigue ?? 0} />
                          <PercentBarWidget label="Stress Limitation" value={dcrValues?.stressLimitation ?? 0} />
                          <PercentBarWidget label="Deflection" value={dcrValues?.deflection ?? 0} />
                        </div>

                        {/* Analysis and Design Summary Button */}
                        <button
                          type="button"
                          disabled={!isDesignAvailable}
                          title={!isDesignAvailable ? 'Available after running design' : undefined}
                          onClick={isDesignAvailable ? () => setSteelDesignModalOpen(true) : undefined}
                          className="osdag-action-btn"
                          style={{
                            width: '100%',
                            opacity: !isDesignAvailable ? 0.6 : 1,
                            cursor: !isDesignAvailable ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Analysis and Design Summary
                        </button>
                      </div>

                      {/* ── 1.3 Transverse Design Group ───────────────────────── */}
                      <div className="osdag-groupbox">
                        <div className="osdag-groupbox__title">
                          <span>Transverse Design</span>
                        </div>
                        <button
                          type="button"
                          disabled={!isDesignAvailable}
                          title={!isDesignAvailable ? 'Available after running design' : undefined}
                          onClick={isDesignAvailable ? () => setTransverseDesignModalOpen(true) : undefined}
                          className="osdag-action-btn"
                          style={{
                            width: '100%',
                            marginTop: '2px',
                            opacity: !isDesignAvailable ? 0.6 : 1,
                            cursor: !isDesignAvailable ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Design Summary
                        </button>
                      </div>

                      {/* ── 1.4 Deck Design Group ─────────────────────────────── */}
                      <div className="osdag-groupbox">
                        <div className="osdag-groupbox__title">
                          <span>Deck Design</span>
                        </div>
                        <button
                          type="button"
                          disabled={!isDesignAvailable}
                          title={!isDesignAvailable ? 'Available after running design' : undefined}
                          onClick={isDesignAvailable ? () => setDeckDesignModalOpen(true) : undefined}
                          className="osdag-action-btn"
                          style={{
                            width: '100%',
                            marginTop: '2px',
                            opacity: !isDesignAvailable ? 0.6 : 1,
                            cursor: !isDesignAvailable ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Design Summary
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── SECTION 2: Substructure (Collapsible Card) ────────────── */}
                <div className="osdag-container-box" style={{ marginTop: '10px' }}>
                  <div
                    className="osdag-container-box__header"
                    style={{
                      cursor: 'pointer',
                      paddingBottom: isSubstructureCollapsed ? '0' : '8px',
                      borderBottom: isSubstructureCollapsed ? 'none' : '1px solid var(--border-subtle)',
                      marginBottom: isSubstructureCollapsed ? '0' : '8px',
                    }}
                    onClick={() => toggleOutputSection('substructure')}
                  >
                    <span className="osdag-container-box__title">Substructure</span>
                    <button
                      type="button"
                      className="osdag-container-box__toggle"
                      aria-expanded={!isSubstructureCollapsed}
                      title={isSubstructureCollapsed ? 'Expand Substructure' : 'Collapse Substructure'}
                    >
                      {isSubstructureCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                    </button>
                  </div>

                  {!isSubstructureCollapsed && (
                    <div style={{ padding: '6px 4px', fontSize: '11px', color: 'var(--text-sub)', fontStyle: 'italic' }}>
                      Substructure modules will activate when substructure geometry is configured.
                    </div>
                  )}
                </div>
              </div>

              {/* ── 3. Bottom Action Buttons (_build_bottom_buttons) ──────────── */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '10px',
                  paddingTop: '2px',
                }}
              >
                {/* Generate Results Table Button */}
                <button
                  type="button"
                  disabled={!isDesignAvailable}
                  title={!isDesignAvailable ? 'Available after running design' : undefined}
                  onClick={isDesignAvailable ? () => setGenerateResultsModalOpen(true) : undefined}
                  className="dock-custom-button"
                  style={{
                    flex: 1.28,
                    minWidth: 0,
                    cursor: !isDesignAvailable ? 'not-allowed' : 'pointer',
                  }}
                >
                  <img src="/vectors/design_result_table.svg" alt="" width={16} height={16} />
                  <span>Generate Results Table</span>
                </button>

                {/* Generate Report Button */}
                <button
                  type="button"
                  disabled={!isDesignAvailable}
                  title={!isDesignAvailable ? 'Available after running design' : undefined}
                  onClick={isDesignAvailable ? () => setReportModalOpen(true) : undefined}
                  className="dock-custom-button"
                  style={{
                    flex: 0.88,
                    minWidth: 0,
                    cursor: !isDesignAvailable ? 'not-allowed' : 'pointer',
                  }}
                >
                  <img src="/vectors/design_report.svg" alt="" width={16} height={16} />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
