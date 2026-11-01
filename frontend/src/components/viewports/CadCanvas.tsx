import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CadModel, DrawFn } from "../../types/cad";
import { fitView } from "../../cad/geometry";

interface CadCanvasProps<M extends CadModel> { model: M; draw: DrawFn<M> }

const boxStyle: CSSProperties = {
  position: "relative", width: "100%", height: "100%", minHeight: 200,
  background: "#fff", overflow: "hidden",
};
const btnColumn: CSSProperties = {
  position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 4,
};
const btn: CSSProperties = { width: 28, height: 28, cursor: "pointer" };

export default function CadCanvas<M extends CadModel>({ model, draw }: CadCanvasProps<M>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);                 // 1 = fit to window
  const [pan, setPan] = useState({ x: 0, y: 0 });      // pixels dragged

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const render = () => {
      const { width: w, height: h } = box.getBoundingClientRect();
      if (w === 0 || h === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;                          // sharp on high-resolution screens
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

    //   const base = fitView(model.bounds, w, h, model.pad);
          // Shrink the margins on short canvases so the drawing never gets squeezed out
    //   const k = Math.min(1, h / 520);
    //   const pad = {
    //     l: model.pad.l * k, r: model.pad.r * k,
    //     t: model.pad.t * k, b: model.pad.b * k,
    //   };
    //   const base = fitView(model.bounds, w, h, pad);
      const base = fitView(model.bounds, w, h, model.pad);
      const cx = w / 2;
      const cy = h / 2;
      draw(ctx, model, {
        scale: base.scale * zoom,
        ox: cx - (cx - base.ox) * zoom + pan.x,
        oy: cy - (cy - base.oy) * zoom + pan.y,
      });
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(box);
    return () => observer.disconnect();
  }, [model, draw, zoom, pan]);

  const fit = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div ref={boxRef} style={boxStyle}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", cursor: "grab" }}
        onMouseDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          drag.current = { x: e.clientX, y: e.clientY };
          setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
        }}
        onMouseUp={() => { drag.current = null; }}
        onMouseLeave={() => { drag.current = null; }}
      />
      <div style={btnColumn}>
        <button style={btn} onClick={() => setZoom((z) => z * 1.2)}>+</button>
        <button style={btn} onClick={() => setZoom((z) => z / 1.2)}>−</button>
        <button style={btn} onClick={fit}>⤢</button>
      </div>
    </div>
  );
}