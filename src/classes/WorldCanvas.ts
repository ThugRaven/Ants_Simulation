interface WorldCanvasOptions {
	width: number;
	height: number;
	cellSize: number;
}

export default class WorldCanvas {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;
	cellSize: number;

	constructor(
		canvas: HTMLCanvasElement,
		worldCanvasOptions: WorldCanvasOptions,
	) {
		this.canvas = canvas;
		this.width = worldCanvasOptions.width;
		this.height = worldCanvasOptions.height;
		this.cellSize = worldCanvasOptions.cellSize;
	}

	create() {
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		console.log(`Created canvas with size: ${this.width} x ${this.height}`);

		return this.canvas.getContext('2d');
	}
}

export function calcWorldSize(worldCanvasOptions: WorldCanvasOptions) {
	let rows = Math.floor(worldCanvasOptions.width / worldCanvasOptions.cellSize);
	let cols = Math.floor(
		worldCanvasOptions.height / worldCanvasOptions.cellSize,
	);

	// Convert rows/cols to odd numbers
	if (rows % 2 === 0) {
		rows--;
	}
	if (cols % 2 === 0) {
		cols--;
	}

	const newWidth = rows * worldCanvasOptions.cellSize;
	const newHeight = cols * worldCanvasOptions.cellSize;

	console.log(
		`Calculate sizes:\n${
			worldCanvasOptions.width == newWidth
				? newWidth
				: `${worldCanvasOptions.width} -> ${newWidth}`
		} x ${
			worldCanvasOptions.height == newHeight
				? newHeight
				: `${worldCanvasOptions.height} -> ${newHeight}`
		}`,
	);

	return [newWidth, newHeight];
}
