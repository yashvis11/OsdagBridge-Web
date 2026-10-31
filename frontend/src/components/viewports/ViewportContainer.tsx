// import React from "react";
// import { useBridgeStore } from "../../store/useBridgeStore";
// import { Eye, Layers, Box } from "lucide-react";
// import { CrossSectionView, PlanView } from "./CadViews";

// const TABS = [
//   { id: "plan", label: "Bridge Plan (2D)", Icon: Layers },
//   { id: "cross_section", label: "Cross Section (2D)", Icon: Eye },
//   { id: "3d", label: "3D CAD View", Icon: Box },
// ] as const;

// export const ViewportContainer: React.FC = () => {
//   const { activeViewportTab, setActiveViewportTab } = useBridgeStore();

//   return (
//     <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#ffffff" }}>
//       <div style={{
//         height: "36px", borderBottom: "1px solid var(--border-color)", display: "flex",
//         alignItems: "center", padding: "0 12px", gap: "6px", background: "#f8fafc",
//       }}>
//         {TABS.map(({ id, label, Icon }) => {
//           const active = activeViewportTab === id;
//           return (
//             <button
//               key={id}
//               onClick={() => setActiveViewportTab(id)}
//               style={{
//                 background: active ? "#ffffff" : "transparent",
//                 border: active ? "1px solid var(--border-color)" : "none",
//                 borderBottom: active ? "1px solid #ffffff" : "none",
//                 padding: "4px 10px", borderRadius: "4px 4px 0 0", cursor: "pointer",
//                 fontSize: "12px", fontWeight: active ? 600 : 400,
//                 display: "flex", alignItems: "center", gap: "6px",
//                 color: active ? "var(--accent-osdag)" : "var(--text-sub)",
//               }}
//             >
//               <Icon size={13} /> {label}
//             </button>
//           );
//         })}
//       </div>

//       {/* The drawing area needs a real size so the canvases can fill it */}
//       <div style={{ flex: 1, minHeight: 0, position: "relative", background: "#ffffff" }}>
//         {/* {activeViewportTab !== "3d" && (
//           <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
//             <div style={{ flex: 1, minHeight: 0 }}><CrossSectionView /></div>
//             <div style={{ flex: 1, minHeight: 0, borderTop: "1px solid var(--border-color)" }}><PlanView /></div>
//           </div>
//         )} */}
//         {activeViewportTab === "plan" && <PlanView />}
//         {activeViewportTab === "cross_section" && <CrossSectionView />}
//         {activeViewportTab === "3d" && (
//           <div style={{
//             height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
//             justifyContent: "center", color: "#64748b", textAlign: "center",
//           }}>
//             <Box size={40} color="var(--accent-osdag)" style={{ marginBottom: 12 }} />
//             <h4 style={{ fontSize: "14px", color: "var(--text-main)", marginBottom: "4px" }}>3D WebGL Viewport</h4>
//             <p style={{ fontSize: "12px" }}>
//               Three.js model renderer will load post-analysis OpenCASCADE .glb geometry here.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
import React from "react";
import { CrossSectionView, PlanView } from "./CadViews";

export const ViewportContainer: React.FC = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#ffffff" }}>
    <div style={{ flex: 1, minHeight: 0 }}><CrossSectionView /></div>
    <div style={{ flex: 1, minHeight: 0, borderTop: "1px solid var(--border-color)" }}><PlanView /></div>
  </div>
);