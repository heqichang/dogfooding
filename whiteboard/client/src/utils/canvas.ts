import { DrawingElement } from '../types';

export function drawElement(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
  ctx.save();

  const { style, type } = element;

  ctx.strokeStyle = style.strokeColor;
  ctx.fillStyle = style.fillColor;
  ctx.lineWidth = style.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'pen' || type === 'eraser') {
    if (!element.points || element.points.length < 2) {
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(element.points[0].x, element.points[0].y);

    for (let i = 1; i < element.points.length; i++) {
      const xc = (element.points[i].x + element.points[i - 1].x) / 2;
      const yc = (element.points[i].y + element.points[i - 1].y) / 2;
      ctx.quadraticCurveTo(element.points[i - 1].x, element.points[i - 1].y, xc, yc);
    }

    if (element.points.length >= 2) {
      const lastPoint = element.points[element.points.length - 1];
      const prevPoint = element.points[element.points.length - 2];
      const xc = (lastPoint.x + prevPoint.x) / 2;
      const yc = (lastPoint.y + prevPoint.y) / 2;
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, xc, yc);
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    if (type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = style.strokeWidth * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  } else if (type === 'rectangle') {
    if (!element.startPoint || !element.endPoint) {
      ctx.restore();
      return;
    }

    const x = Math.min(element.startPoint.x, element.endPoint.x);
    const y = Math.min(element.startPoint.y, element.endPoint.y);
    const w = Math.abs(element.endPoint.x - element.startPoint.x);
    const h = Math.abs(element.endPoint.y - element.startPoint.y);

    if (style.fillColor && style.fillColor !== 'transparent') {
      ctx.fillRect(x, y, w, h);
    }

    if (style.strokeWidth > 0 && style.strokeColor && style.strokeColor !== 'transparent') {
      ctx.strokeRect(x, y, w, h);
    }
  } else if (type === 'circle') {
    if (!element.center || element.radius === undefined || element.radius <= 0) {
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.arc(element.center.x, element.center.y, element.radius, 0, Math.PI * 2);

    if (style.fillColor && style.fillColor !== 'transparent') {
      ctx.fill();
    }

    if (style.strokeWidth > 0 && style.strokeColor && style.strokeColor !== 'transparent') {
      ctx.stroke();
    }
  } else if (type === 'text') {
    if (!element.position || !element.text) {
      ctx.restore();
      return;
    }

    const fontSize = style.fontSize || 16;
    const fontFamily = style.fontFamily || 'Arial';

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = style.strokeColor;
    ctx.textBaseline = 'bottom';

    ctx.fillText(element.text, element.position.x, element.position.y);
  }

  ctx.restore();
}

export function getElementBounds(element: DrawingElement): { x: number; y: number; width: number; height: number } | null {
  if (element.type === 'pen' || element.type === 'eraser') {
    if (!element.points || element.points.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    element.points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } else if (element.type === 'rectangle') {
    if (!element.startPoint || !element.endPoint) return null;

    const x = Math.min(element.startPoint.x, element.endPoint.x);
    const y = Math.min(element.startPoint.y, element.endPoint.y);
    const w = Math.abs(element.endPoint.x - element.startPoint.x);
    const h = Math.abs(element.endPoint.y - element.startPoint.y);

    return { x, y, width: w, height: h };
  } else if (element.type === 'circle') {
    if (!element.center || !element.radius) return null;

    return {
      x: element.center.x - element.radius,
      y: element.center.y - element.radius,
      width: element.radius * 2,
      height: element.radius * 2
    };
  } else if (element.type === 'text') {
    if (!element.position || !element.text) return null;

    return {
      x: element.position.x,
      y: element.position.y - (element.style.fontSize || 16),
      width: element.text.length * (element.style.fontSize || 16) * 0.6,
      height: element.style.fontSize || 16
    };
  }

  return null;
}

export function isPointInElement(point: { x: number; y: number }, element: DrawingElement): boolean {
  const bounds = getElementBounds(element);
  if (!bounds) return false;

  return (
    point.x >= bounds.x - 5 &&
    point.x <= bounds.x + bounds.width + 5 &&
    point.y >= bounds.y - 5 &&
    point.y <= bounds.y + bounds.height + 5
  );
}
