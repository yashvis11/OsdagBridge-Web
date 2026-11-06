/*
 * CadCanvas Component: 
 * 1. Automatically sizing and sharpening the drawing board for high-resolution screens.
 * 2. Listening for window size changes so the bridge drawing always fits when the screen resizes.
 * 3. Handling user interactions—letting users click and drag to move (pan) around, use buttons to zoom in/out, 
 *    and track the mouse cursor to show tooltips when hovering over specific parts like girders or crash barriers.
 */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CadModel, DrawFn, HitZone, HoverState } from "../../types/cad";
import { fitView } from "../../cad/geometry";
import { hits } from "../../cad/drawHelpers";

interface CadCanvasProps<M extends CadModel> { model: M; draw: DrawFn<M> }

const boxStyle: CSSProperties = {
  position: "absolute", inset: 0, background: "#fff", overflow: "hidden",
};
const btnColumn: CSSProperties = {
  position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 4,
};
// + and − : light square box with a thin grey border
const btn: CSSProperties = {
  width: 28, height: 28, cursor: "pointer", padding: 0,
  background: "#fafafa", border: "1px solid #c8c8c8", borderRadius: 3,
  color: "#222", fontSize: 16, lineHeight: 1,
  display: "flex", alignItems: "center", justifyContent: "center",
};

//reset : no box at all, just the icon
const btnBare: CSSProperties = {
  width: 32, height: 32, cursor: "pointer", padding: 0,
  background: "transparent", border: "none", color: "#222",
  display: "flex", alignItems: "center", justifyContent: "center",
};

export default function CadCanvas<M extends CadModel>({ model, draw }: CadCanvasProps<M>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const zonesRef = useRef<HitZone[]>([]);                 // hit zones from the last draw
  const [zoom, setZoom] = useState(1);                    // 1 = fit to window
  const [pan, setPan] = useState({ x: 0, y: 0 });         // pixels dragged
  const [hover, setHover] = useState<HoverState | null>(null);


  /*
  * Gets the direct references to HTML elements canvas and box
  * Maintains CAD quality on high-resolution screens by measuring the device pixel ratio
  * Fits the CAD in the available space, keeping enough space for both the CAD and dimension labels
  * while keeping the CAD centered
  * Calls the drawCossSection function
  * Resizes browser based on changes such as opening and closing input and output docks
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    //calculate the device's pixel ratio to keep the quality high on high-resolution screens
    const render = () => {
      const { width: w, height: h } = box.getBoundingClientRect();
      if (w === 0 || h === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;                             // sharp on high-resolution screens
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      //calls function to draw the cross section, centered
      const base = fitView(model.bounds, w, h, model.pad); //calculates the offsets based on the layout of the bridge. To keep the bridge centered
      const cx = w / 2;  //centers of the canvas
      const cy = h / 2;
      zonesRef.current = draw(ctx, model, {   //calling drawCrossSection
        scale: base.scale * zoom,
        ox: cx - (cx - base.ox) * zoom + pan.x,   //the new x offset based on the user's zoom. To keep the CAD in the center even while zooming
        oy: cy - (cy - base.oy) * zoom + pan.y,
      }, hover);
    };

    render();
    //to maintain the CAD when the browser size changes: such as opening or closing the input dock
    const observer = new ResizeObserver(render);
    observer.observe(box);
    return () => observer.disconnect();
  }, [model, draw, zoom, pan, hover]);

  //reset CAD size after zooming
  const fit = () => { setZoom(1); setPan({ x: 0, y: 0 }); setHover(null); };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drag.current) {  //measure mouse drag movements 
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    const zs = zonesRef.current;  //get the active hit zones
    let found: HoverState | null = null;
    for (let i = zs.length - 1; i >= 0; i--) {            // last drawn = on top
      if (hits(zs[i].shape, x, y)) { found = { id: zs[i].id, zone: i }; break; }
    }  //checks if the mouse is inside the zone's geometry 
    setHover((h) => (h?.id === found?.id && h?.zone === found?.zone ? h : found));
  };  

  return (
    <div ref={boxRef} style={boxStyle}>
      <canvas
        ref={canvasRef}
        //change the mouse to either pointer or grab
        style={{ position: "absolute", top: 0, left: 0, display: "block", cursor: hover ? "pointer" : "grab" }}
        //to track mouse movements for both hover, pan and when outside the CAD
        onMouseDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; setHover(null); }}
        onMouseMove={onMove}
        onMouseUp={() => { drag.current = null; }}
        onMouseLeave={() => { drag.current = null; setHover(null); }}
      />
      {/* zoom in, out and reset buttons */}
      <div style={btnColumn}>
        <button style={btn} onClick={() => { setZoom((z) => z * 1.2); setHover(null); }}>+</button>
        <button style={btn} onClick={() => { setZoom((z) => z / 1.2); setHover(null); }}>-</button>
        <button style={btnBare} onClick={fit} title="Fit to window" aria-label="Fit to window">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />
          <rect x="7.5" y="8" width="9" height="8" />
        </svg>
        </button>
      </div>
    </div>
  );
}