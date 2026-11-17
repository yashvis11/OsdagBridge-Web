/**
 * CadCanvas.tsx
 *
 * Generic canvas used by both views. Takes a model and a draw function and handles
 * everything around them. Plays the role of the widget's paintEvent and scroll area
 * on the desktop.
 *
 * What it does:
 *   - Sizes the canvas to the pane at the screen's pixel ratio, so lines and text
 *     stay sharp.
 *   - Picks the scale: it fits the drawing to the pane but never goes below the
 *     model's minScale. If the drawing is bigger than the pane, the pane scrolls.
 *   - Tests the mouse against the HitZones returned by the draw function and
 *     redraws with the hovered element highlighted.
 *   - Zoom in, zoom out and fit buttons. Dragging scrolls the pane.
 *
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CadModel, DrawFn, HitZone, HoverState } from "../../types/cad";
import { hits } from "../../cad/drawHelpers";
import { useBridgeStore } from "../../store/useBridgeStore";
import { setCadTheme } from "../../cad/style";

interface CadCanvasProps<M extends CadModel> {
  model: M;
  draw: DrawFn<M>;
}

const boxStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "var(--bg-surface)",
  color: "var(--text-main)",
  overflow: "hidden",
};
const scrollStyle: CSSProperties = { position: "absolute", inset: 0 };
const btnColumn: CSSProperties = {
  position: "absolute",
  top: 8,
  right: 22,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const btn: CSSProperties = {
  width: 28,
  height: 28,
  cursor: "pointer",
  padding: 0,
  background: "var(--bg-surface)",
  border: "1px solid var(--border-color)",
  borderRadius: 3,
  color: "var(--text-main)",
  fontSize: 16,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const btnBare: CSSProperties = {
  width: 32,
  height: 32,
  cursor: "pointer",
  padding: 0,
  background: "transparent",
  border: "none",
  color: "var(--text-main)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// Gets thickness of the scrollbar for the specific device's configuration
function scrollbarSize(): number {
  const d = document.createElement("div");
  d.style.cssText =
    "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll";
  document.body.appendChild(d);
  const s = d.offsetWidth - d.clientWidth;
  document.body.removeChild(d);
  return s;
}
/* Checks if the dimensions needed for the bridge are greater than the viewport. Adds scrollbars accordingly.
Calculates new viewport dimensions including the scrollbar dimensions */
function layoutFor(
  model: CadModel,
  size: { w: number; h: number },
  zoom: number,
  sb: number,
) {
  const { bounds, pad } = model;
  const bw = Math.max(bounds.maxX - bounds.minX, 0.001);
  const bh = Math.max(bounds.maxY - bounds.minY, 0.001);
  let vw = size.w,
    vh = size.h; //viewport dimensions
  let scale = 0,
    needW = 0,
    needH = 0,
    needsX = false,
    needsY = false;
  for (let i = 0; i < 3; i++) {
    const availW = Math.max(vw - pad.l - pad.r, 10);
    const availH = Math.max(vh - pad.t - pad.b, 10);
    scale =
      Math.max(Math.min(availW / bw, availH / bh), model.minScale ?? 0) * zoom;
    needW = bw * scale + pad.l + pad.r; //new width of the bridge after scaling
    needH = bh * scale + pad.t + pad.b;
    needsX = needW > vw + 1;
    needsY = needH > vh + 1;
    const nvw = size.w - (needsY ? sb : 0); //viewport width - scrollbar thickness(if applied)
    const nvh = size.h - (needsX ? sb : 0);
    if (nvw === vw && nvh === vh) break; //stops the loop if the layout has stopped shifting and no changes are needed
    vw = nvw;
    vh = nvh;
  }
  return {
    bw,
    bh,
    scale,
    needsX,
    needsY,
    w: needsX ? needW : vw,
    h: needsY ? needH : vh,
  };
}

export default function CadCanvas<M extends CadModel>({
  model,
  draw,
}: CadCanvasProps<M>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null); //starting mouse coordinates before panning
  const zonesRef = useRef<HitZone[]>([]); // hit zones from the last draw
  const recenter = useRef(true); // scroll back to the middle on the next draw
  const [zoom, setZoom] = useState(1); // 1 = fit (or minScale, whichever is larger)
  const [tick, setTick] = useState(0); // increases when reset button is clicked to redraw the bridge to center
  const [hover, setHover] = useState<HoverState | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 }); // size of the pane (outer box)
  const [sb] = useState(() => scrollbarSize()); //to get the scrollbar size
  const darkMode = useBridgeStore((s) => s.darkMode);

  /* ------
   * Gets the direct references to HTML elements canvas and box
   * Maintains CAD quality on high-resolution screens by measuring the device pixel ratio
   * Resizes browser based on changes such as opening and closing input and output docks
   */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      // aligns the physical dimensions with the device's pixels to keep the lines crisp
      const w = Math.floor(r.width * d) / d,
        h = Math.floor(r.height * d) / d;
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  //---------

  // new inputs => scroll back to the middle
  useEffect(() => {
    recenter.current = true;
  }, [model]); //recenters when the bridge model changes

  const lay = useMemo(
    () => layoutFor(model, size, zoom, sb),
    [model, size, zoom, sb],
  );

  /* --------
  To keep the CAD crisp on high quality screens
  */
  useEffect(() => {
    const canvas = canvasRef.current;
    const scroller = scrollRef.current;
    if (!canvas || !scroller || size.w === 0 || size.h === 0) return;

    const { bounds, pad } = model;
    const { w, h, scale, bw, bh } = lay;

    const dpr = window.devicePixelRatio || 1;
    const bufW = Math.max(1, Math.round(w * dpr));
    const bufH = Math.max(1, Math.round(h * dpr));
    const cssW = bufW / dpr; // CSS size = a whole number of device pixels
    const cssH = bufH / dpr;
    canvas.width = bufW; // assigning the size also clears the canvas
    canvas.height = bufH;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    // ----------------

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(bufW / cssW, 0, 0, bufH / cssH, 0, 0); // exact device pixel ratio on both axes, no stretching
    ctx.clearRect(0, 0, cssW, cssH);

    // centre the drawing inside the canvas
    const ox =
      pad.l + (w - pad.l - pad.r - bw * scale) / 2 - bounds.minX * scale;
    const oy =
      h - pad.b - (h - pad.t - pad.b - bh * scale) / 2 + bounds.minY * scale;

    //passes the cad context, calculated scale and origin and captured hit zones(hover zones) to the draw function
    if (boxRef.current) {
      const cs = getComputedStyle(boxRef.current);
      setCadTheme(darkMode, cs.backgroundColor, cs.color); // read the live theme colours
    }
    zonesRef.current = draw(ctx, model, { scale, ox, oy }, hover); //drawCrossSection or drawPlan

    if (recenter.current) {
      //if recenter is needed
      scroller.scrollLeft = Math.max(0, (w - scroller.clientWidth) / 2);
      scroller.scrollTop = 0;
      recenter.current = false;
    }
  }, [model, draw, lay, hover, size, tick, darkMode]);

  const fit = () => {
    //function for fit to view feature
    setZoom(1);
    setHover(null);
    recenter.current = true;
    setTick((t) => t + 1);
  };

  //enables the panning movement
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const scroller = scrollRef.current;
    if (drag.current && scroller) {
      // if the user is holding down on the mouse and a scroller reference exists
      const dx = e.clientX - drag.current.x; //difference between previous mouse position and current
      const dy = e.clientY - drag.current.y;
      drag.current = { x: e.clientX, y: e.clientY }; //stores the new coordinates in the drag reference
      scroller.scrollLeft -= dx; //to scroll right distance from the leftmost corner is subtracted
      scroller.scrollTop -= dy;
      return;
    }

    const { offsetX: x, offsetY: y } = e.nativeEvent; //mouse event coordinates from the canvas
    const zs = zonesRef.current;
    let found: HoverState | null = null; //variable to store the id of the element being hovered over
    for (let i = zs.length - 1; i >= 0; i--) {
      if (hits(zs[i].shape, x, y)) {
        found = { id: zs[i].id, zone: i };
        break;
      }
    }
    //checks if the mouse is inside the zone's geometry
    setHover((h) =>
      h?.id === found?.id && h?.zone === found?.zone ? h : found,
    );
  };

  return (
    <div ref={boxRef} style={boxStyle}>
      <div
        ref={scrollRef}
        //if the bridge needs to be accessedvia scrolling, show the scroll bar otherwise hide it
        style={{
          ...scrollStyle,
          overflowX: lay.needsX ? "auto" : "hidden",
          overflowY: lay.needsY ? "auto" : "hidden",
        }}
        onScroll={() => setHover(null)}
      >
        <canvas
          ref={canvasRef}
          //change the mouse to either pointer or grab
          style={{ display: "block", cursor: hover ? "pointer" : "grab" }}
          //to track mouse movements for both hover, pan and when outside the CAD
          onMouseDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            setHover(null);
          }}
          onMouseMove={onMove}
          onMouseUp={() => {
            drag.current = null;
          }}
          onMouseLeave={() => {
            drag.current = null;
            setHover(null);
          }}
        />
      </div>
      {/* zoom in, out and reset buttons */}
      <div style={btnColumn}>
        <button
          style={btn}
          onClick={() => {
            setZoom((z) => z * 1.2);
            setHover(null);
          }}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          style={btn}
          onClick={() => {
            setZoom((z) => z / 1.2);
            setHover(null);
          }}
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          style={btnBare}
          onClick={fit}
          title="Fit to window"
          aria-label="Fit to window"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />
            <rect x="7.5" y="8" width="9" height="8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
