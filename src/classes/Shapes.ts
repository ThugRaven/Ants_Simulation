export function circle(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	fill = true,
	stroke = false,
) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	if (fill) {
		ctx.fill();
	}
	if (stroke) {
		ctx.stroke();
	}
}

export function line(
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.closePath();
}

export function rect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	ctx.rect(x, y, width, height);
	ctx.fill();
}
