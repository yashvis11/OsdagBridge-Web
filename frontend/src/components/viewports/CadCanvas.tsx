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
const btn: CSSProperties = { width: 28, height: 28, cursor: "pointer" };

export default function CadCanvas<M extends CadModel>({ model, draw }: CadCanvasProps<M>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const zonesRef = useRef<HitZone[]>([]);                 // hit zones from the last draw
  const [zoom, setZoom] = useState(1);                    // 1 = fit to window
  const [pan, setPan] = useState({ x: 0, y: 0 });         // pixels dragged
  const [hover, setHover] = useState<HoverState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

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

      const base = fitView(model.bounds, w, h, model.pad);
      const cx = w / 2;
      const cy = h / 2;
      zonesRef.current = draw(ctx, model, {
        scale: base.scale * zoom,
        ox: cx - (cx - base.ox) * zoom + pan.x,
        oy: cy - (cy - base.oy) * zoom + pan.y,
      }, hover);
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(box);
    return () => observer.disconnect();
  }, [model, draw, zoom, pan, hover]);

  const fit = () => { setZoom(1); setPan({ x: 0, y: 0 }); setHover(null); };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    const zs = zonesRef.current;
    let found: HoverState | null = null;
    for (let i = zs.length - 1; i >= 0; i--) {            // last drawn = on top
      if (hits(zs[i].shape, x, y)) { found = { id: zs[i].id, zone: i }; break; }
    }
    setHover((h) => (h?.id === found?.id && h?.zone === found?.zone ? h : found));
  };

  return (
    <div ref={boxRef} style={boxStyle}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, display: "block", cursor: hover ? "pointer" : "grab" }}
        onMouseDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; setHover(null); }}
        onMouseMove={onMove}
        onMouseUp={() => { drag.current = null; }}
        onMouseLeave={() => { drag.current = null; setHover(null); }}
      />
      <div style={btnColumn}>
        <button style={btn} onClick={() => { setZoom((z) => z * 1.2); setHover(null); }}>+</button>
        <button style={btn} onClick={() => { setZoom((z) => z / 1.2); setHover(null); }}>−</button>
        <button style={btn} onClick={fit}>⤢</button>
      </div>
    </div>
  );
}