type Ctx = CanvasRenderingContext2D;

export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function arrow(ctx: Ctx, x: number, y: number, dx: number, dy: number, size = 6): void {
  const a = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(a - 0.35), y - size * Math.sin(a - 0.35));
  ctx.lineTo(x - size * Math.cos(a + 0.35), y - size * Math.sin(a + 0.35));
  ctx.closePath();
  ctx.fill();
}

function dimStyle(ctx: Ctx): void {
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.lineWidth = 1;
  ctx.font = "13px sans-serif";
}

// Horizontal dimension, label centred above or below the line.
export function dimH(ctx: Ctx, x1: number, x2: number, y: number, label: string, above = true): void {
  ctx.save();
  dimStyle(ctx);
  line(ctx, x1, y, x2, y);
  arrow(ctx, x1, y, -1, 0);
  arrow(ctx, x2, y, 1, 0);
  line(ctx, x1, y - 6, x1, y + 6);
  line(ctx, x2, y - 6, x2, y + 6);
  ctx.textAlign = "center";
  ctx.textBaseline = above ? "bottom" : "top";
  ctx.fillText(label, (x1 + x2) / 2, above ? y - 4 : y + 4);
  ctx.restore();
}

// Horizontal dimension with the label to the right (for short dimensions).
export function dimHSide(ctx: Ctx, x1: number, x2: number, y: number, label: string): void {
  ctx.save();
  dimStyle(ctx);
  line(ctx, x1, y, x2, y);
  arrow(ctx, x1, y, -1, 0);
  arrow(ctx, x2, y, 1, 0);
  line(ctx, x1, y - 6, x1, y + 6);
  line(ctx, x2, y - 6, x2, y + 6);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x2 + 8, y);
  ctx.restore();
}

// Vertical dimension, label to the right of the line.
export function dimV(ctx: Ctx, x: number, y1: number, y2: number, label: string): void {
  ctx.save();
  dimStyle(ctx);
  const dir = y2 > y1 ? 1 : -1;
  line(ctx, x, y1, x, y2);
  arrow(ctx, x, y1, 0, -dir);
  arrow(ctx, x, y2, 0, dir);
  line(ctx, x - 6, y1, x + 6, y1);
  line(ctx, x - 6, y2, x + 6, y2);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 8, (y1 + y2) / 2);
  ctx.restore();
}

// Speckled concrete fill, built once and reused.
let cachedPattern: CanvasPattern | null = null;
export function concretePattern(ctx: Ctx): CanvasPattern | string {
  if (cachedPattern) return cachedPattern;
  const tile = document.createElement("canvas");
  tile.width = tile.height = 16;
  const g = tile.getContext("2d");
  if (!g) return "#e6e6e6";
  g.fillStyle = "#e6e6e6";
  g.fillRect(0, 0, 16, 16);
  g.fillStyle = "#555";
  [[3, 4], [10, 2], [7, 11], [13, 12]].forEach(([x, y]) => g.fillRect(x, y, 1.5, 1.5));
  cachedPattern = ctx.createPattern(tile, "repeat");
  return cachedPattern ?? "#e6e6e6";
}