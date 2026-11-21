/**
 * ViewportContainer.tsx
 *
 * Stacks the cross-section and plan panes in the centre area. Each pane is shown or
 * hidden by the header toggles (showCrossSection / showTopView in the store), and the
 * visible panes share the available height.
 */
import React from "react";
import { useBridgeStore } from "../../store/useBridgeStore";
import { CrossSectionView, PlanView } from "./CadViews";

const paneStyle: React.CSSProperties = {
  position: "relative",
  flex: 1,
  minHeight: 0,
};

export const ViewportContainer: React.FC = () => {
  const showCrossSection = useBridgeStore((s) => s.showCrossSection);  //reads value from the bridge to make the view appear and diappear
  const showTopView = useBridgeStore((s) => s.showTopView);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)", // theme variable: confirm the name, see below
      }}
    >
      {showCrossSection && (  //shows the cross section only when showCrossSection is true
        <div style={paneStyle}>
          <CrossSectionView />
        </div>
      )}
      {showTopView && (
        <div
          style={{
            ...paneStyle,
            borderTop: showCrossSection
              ? "1px solid var(--border-color)"
              : "none",
          }}
        >
          <PlanView />
        </div>
      )}
    </div>
  );
};
