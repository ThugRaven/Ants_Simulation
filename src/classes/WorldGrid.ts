interface WorldOptions {
	width: number;
	height: number;
	cellSize: number;
}

export default class WorldGrid {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;
	cellSize: number;

	constructor(canvas: HTMLCanvasElement, worldOptions: WorldOptions) {
		this.canvas = canvas;
		this.width = worldOptions.width;
		this.height = worldOptions.height;
		this.cellSize = worldOptions.cellSize;
	}

	create() {
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		console.log(`Created canvas with size: ${this.width} x ${this.height}`);

		return this.canvas.getContext('2d');
	}
}

export function calcWorldSize(worldOptions: WorldOptions) {
	let rows = Math.round(worldOptions.width / worldOptions.cellSize);
	let cols = Math.round(worldOptions.height / worldOptions.cellSize);

	let newWidth = rows * worldOptions.cellSize;
	let newHeight = cols * worldOptions.cellSize;

	console.log(
		`Calculate sizes:\n${
			worldOptions.width == newWidth
				? newWidth
				: `${worldOptions.width} -> ${newWidth}`
		} x ${
			worldOptions.height == newHeight
				? newHeight
				: `${worldOptions.height} -> ${newHeight}`
		}`,
	);

	return [newWidth, newHeight];
}
