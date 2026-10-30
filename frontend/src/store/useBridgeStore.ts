/**
 * useBridgeStore.ts
 *
 * Zustand store for the OsdagBridge frontend.
 * Manages UI state for the input dock, output dock, log dock, and shared layout.
 *
 * Schema loading behaviour:
 *   - On mount, fetchSchema() attempts to load the bridge input schema from the backend.
 *   - If the backend is unreachable, schemaError is set and schema stays empty.
 *   - No static fallback schema is used; the input dock shows an error state instead.
 */
import { create } from 'zustand';
import { UIFieldSchema } from '../types/schema';
import { LocationData } from '../types/location';
import { INPUT_KEYS } from '../utils/bridgeInputs';
import {
  fetchBasicSchema,
  fetchSteelMaterials,
  fetchConcreteMaterials,
  type ConcreteMaterial,
  type SteelMaterial,
} from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'success' | 'warning' | 'stdout_print';
}
function formatLogTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function createInitialLogEntry(): LogEntry {
  const timestamp = formatLogTimestamp();
  return {
    id: `init-${Date.now()}`,
    timestamp,
    message: `[${timestamp}] Log initialized`,
    level: 'info',
  };
}

interface BridgeState {
  // ── Input schema ───────────────────────────────────────────────────────────
  inputs: Record<string, any>;
  additionalInputs: Record<string, any>;
  schema: UIFieldSchema[];
  schemaLoading: boolean;
  schemaError: string | null;
  steelMaterials: SteelMaterial[];
  concreteMaterials: ConcreteMaterial[];
  location: LocationData | null;
  isLocationModalOpen: boolean;

  // ── UI dock visibility ─────────────────────────────────────────────────────
  isDockCollapsed: boolean;
  isOutputDockCollapsed: boolean;
  isLocked: boolean;
  collapsedContainers: Record<string, boolean>;

  // ── Output dock (display values) ───────────────────────────────────────────
  outputCollapsedSections: Record<string, boolean>;
  analysisMember: string | null;
  analysisLoadCase: string | null;
  analysisForce: string | null;
  analysisDisplayOptions: Record<string, boolean>;
  designMember: string | null;
  designLoadCase: string | null;
  dcrValues: Record<string, number> | null;
  /** Null until a design run has completed and returned results. */
  srcValues: Record<string, number> | null;

  // ── Log dock ───────────────────────────────────────────────────────────────
  isLogDockOpen: boolean;
  isLogDockCollapsed: boolean;
  logWindowTitle: string;
  logProgress: number | null;
  logs: LogEntry[];

  // ── Theme ──────────────────────────────────────────────────────────────────
  darkMode: boolean;

  // ── Input Error Dialog ─────────────────────────────────────────────────────
  inputErrorDialog: { message: string; onOk: () => void } | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  fetchSchema: () => Promise<void>;
  updateField: (key: string, value: any) => void;
  toggleLock: () => void;
  toggleDock: () => void;
  toggleOutputDock: () => void;
  toggleOutputSection: (section: string) => void;
  setAnalysisMember: (m: string | null) => void;
  setAnalysisLoadCase: (lc: string | null) => void;
  setAnalysisForce: (f: string | null) => void;
  toggleAnalysisDisplayOption: (key: string) => void;
  setDesignMember: (m: string | null) => void;
  setDesignLoadCase: (lc: string | null) => void;
  toggleContainer: (container: string) => void;
  toggleLogDock: (open?: boolean) => void;
  toggleLogDockCollapse: () => void;
  resetLogs: () => void;
  toggleDarkMode: () => void;
  setLocation: (loc: LocationData) => void;
  setLocationModalOpen: (open: boolean) => void;
  showInputErrorDialog: (message: string, onOk: () => void) => void;
  dismissInputErrorDialog: () => void;

  // UI-only no-ops (kept so existing JSX references compile)
  saveInputs: () => void;
  loadInputs: () => void;
  saveLogs: () => void;
  export3DModel: (format: string) => void;
  exportCadImage: () => void;
  runDesign: () => void;
  resetInputs: () => void;
  setAdditionalInputsOpen: (open: boolean) => void;
  setSteelDesignModalOpen: (open: boolean) => void;
  setTransverseDesignModalOpen: (open: boolean) => void;
  setDeckDesignModalOpen: (open: boolean) => void;
  setGenerateResultsModalOpen: (open: boolean) => void;
  setReportModalOpen: (open: boolean) => void;
  requireDesignCheck: () => boolean;

  // Viewport tab (kept for Header compatibility)
  activeViewportTab: 'plan' | 'cross_section' | 'dual' | '3d' | 'plots';
  setActiveViewportTab: (tab: 'plan' | 'cross_section' | 'dual' | '3d' | 'plots') => void;
  showCrossSection: boolean;
  showTopView: boolean;
  toggleCrossSection: () => void;
  toggleTopView: () => void;
  toggleCad3dView: () => void;
  togglePlotsView: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBridgeStore = create<BridgeState>((set, get) => ({
  // ── Input schema ───────────────────────────────────────────────────────────
  inputs: {},
  additionalInputs: {},
  schema: [],
  schemaLoading: false,
  schemaError: null,
  steelMaterials: [],
  concreteMaterials: [],
  location: null,
  isLocationModalOpen: false,

  // ── Dock state ─────────────────────────────────────────────────────────────
  isDockCollapsed: false,
  isOutputDockCollapsed: false,
  isLocked: false,
  collapsedContainers: {},

  // ── Output dock (defaults to null before design run) ──────────────────────
  outputCollapsedSections: {},
  analysisMember: null,
  analysisLoadCase: null,
  analysisForce: null,
  analysisDisplayOptions: {},
  designMember: null,
  designLoadCase: null,
  dcrValues: null,

  // ── Log dock (static) ─────────────────────────────────────────────────────
  isLogDockOpen: true,
  isLogDockCollapsed: false,
  logWindowTitle: 'Log Window',
  logProgress: null,
  logs: [createInitialLogEntry()],
  srcValues: null,

  // ── Theme ──────────────────────────────────────────────────────────────────
  darkMode: false,

  // ── Input Error Dialog ─────────────────────────────────────────────────────
  inputErrorDialog: null,

  // ── Viewport (display-only, drives Header button state) ───────────────────
  activeViewportTab: 'dual',
  showCrossSection: true,
  showTopView: true,

  // ── Actions ────────────────────────────────────────────────────────────────

  fetchSchema: async () => {
    set({ schemaLoading: true, schemaError: null });
    try {
      // Fetch schema first — failure here propagates to the catch block and leaves
      // the input dock unloaded (no static fallback). Ancillary endpoints
      // (materials, location) fall back internally and do not throw.
      const schemaData = await fetchBasicSchema();

      const [steelMaterials, concreteMaterials] = await Promise.all([
        fetchSteelMaterials(),
        fetchConcreteMaterials(),
      ]);

      // Populate inputs from schema-provided defaults only.
      // /api/v1/schema already supplies a 'default' for every field, so no
      // manual per-key fallbacks are needed here.
      const initialInputs: Record<string, any> = { ...get().inputs };
      schemaData.forEach((f) => {
        if (f.default !== undefined && f.default !== null && initialInputs[f.key] === undefined) {
          initialInputs[f.key] = f.default;
        }
      });

      set({
        schema: schemaData,
        inputs: initialInputs,
        schemaLoading: false,
        schemaError: null,
        steelMaterials,
        concreteMaterials,
      });
    } catch (err) {
      set({
        schema: [],
        schemaLoading: false,
        schemaError:
          err instanceof Error
            ? err.message
            : 'Unable to connect to backend server. The input schema could not be loaded.',
      });
    }
  },

  updateField: (key, value) => {
    set((state) => ({
      inputs: { ...state.inputs, [key]: value },
    }));
  },

  toggleLock: () => set((state) => ({ isLocked: !state.isLocked })),
  toggleDock: () => set((state) => ({ isDockCollapsed: !state.isDockCollapsed })),
  toggleOutputDock: () => set((state) => ({ isOutputDockCollapsed: !state.isOutputDockCollapsed })),

  toggleOutputSection: (section) =>
    set((state) => ({
      outputCollapsedSections: {
        ...state.outputCollapsedSections,
        [section]: !state.outputCollapsedSections[section],
      },
    })),

  setAnalysisMember: (analysisMember) => set({ analysisMember }),
  setAnalysisLoadCase: (analysisLoadCase) => set({ analysisLoadCase }),
  setAnalysisForce: (analysisForce) => set({ analysisForce }),

  toggleAnalysisDisplayOption: (key) =>
    set((state) => ({
      analysisDisplayOptions: {
        ...state.analysisDisplayOptions,
        [key]: !state.analysisDisplayOptions[key],
      },
    })),

  setDesignMember: (designMember) => set({ designMember }),
  setDesignLoadCase: (designLoadCase) => set({ designLoadCase }),

  toggleContainer: (container) =>
    set((state) => ({
      collapsedContainers: {
        ...state.collapsedContainers,
        [container]: !state.collapsedContainers[container],
      },
    })),

  toggleLogDock: (open) =>
    set((state) => ({
      isLogDockOpen: open !== undefined ? open : !state.isLogDockOpen,
    })),

  toggleLogDockCollapse: () =>
    set((state) => ({ isLogDockCollapsed: !state.isLogDockCollapsed })),

  resetLogs: () =>
    set({
      logWindowTitle: 'Log Window',
      logProgress: null,
      logs: [createInitialLogEntry()],
    }),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return { darkMode: next };
    }),

  setLocation: (loc) =>
    set((state) => ({
      location: loc,
      inputs: {
        ...state.inputs,
        // Preserve the display string and all four environmental parameters
        // returned by /api/v1/location/details (IRC:6 wind, seismic zone,
        // temperature range). Keys are the canonical INPUT_KEYS constants.
        [INPUT_KEYS.projectLocation]: `${loc.station}, ${loc.state}`,
        [INPUT_KEYS.windSpeed]:        loc.basic_wind_speed,
        [INPUT_KEYS.seismicZone]:      loc.seismic_zone,
        [INPUT_KEYS.maxTemp]:          loc.max_temperature,
        [INPUT_KEYS.minTemp]:          loc.min_temperature,
      },
    })),

  setLocationModalOpen: (isLocationModalOpen) => set({ isLocationModalOpen }),

  showInputErrorDialog: (message, onOk) => set({ inputErrorDialog: { message, onOk } }),
  dismissInputErrorDialog: () => set({ inputErrorDialog: null }),

  setActiveViewportTab: (activeViewportTab) => set({ activeViewportTab }),
  toggleCrossSection: () => set((s) => ({ showCrossSection: !s.showCrossSection })),
  toggleTopView: () => set((s) => ({ showTopView: !s.showTopView })),
  toggleCad3dView: () => {},
  togglePlotsView: () => {},

  // ── UI-only no-ops ────────────────────────────────────────────────────────
  saveInputs: () => {},
  loadInputs: () => {},
  saveLogs: () => {},
  export3DModel: () => {},
  exportCadImage: () => {},
  runDesign: () => {},
  resetInputs: () => {},
  setAdditionalInputsOpen: () => {},
  setSteelDesignModalOpen: () => {},
  setTransverseDesignModalOpen: () => {},
  setDeckDesignModalOpen: () => {},
  setGenerateResultsModalOpen: () => {},
  setReportModalOpen: () => {},
  requireDesignCheck: () => false,
}));
