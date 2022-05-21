import { MarkerColors, MarkerTypes } from '../constants';
import { Vector } from './Vector';
import WorldCell from './WorldCell';

interface WorldGridOptions {
	width: number;
	height: number;
	cellSize: number;
}

export default class WorldGrid {
	width: number;
	height: number;
	cellSize: number;
	cells: WorldCell[];

	constructor(worldGridOptions: WorldGridOptions) {
		this.width = worldGridOptions.width;
		this.height = worldGridOptions.height;
		this.cellSize = worldGridOptions.cellSize;
		this.cells = [];
		for (let i = 0; i < this.width * this.height; i++) {
			this.cells.push(new WorldCell());
		}
	}

	update() {
		for (const cell of this.cells) {
			cell.marker.update();
		}
	}

	addMarker(x: number, y: number, type: MarkerTypes, intensity: number) {
		let cell = this.cells[this.getIndexFromCoords(x, y)];
		if (type == MarkerTypes.TO_HOME) {
			cell.marker.intensity[0] = intensity;
		} else if (type == MarkerTypes.TO_FOOD) {
			cell.marker.intensity[1] = intensity;
		}
	}

	addFood(x: number, y: number, quantity: number) {
		let cell = this.cells[this.getIndexFromCoords(x, y)];
		cell.food.quantity = Math.min(cell.food.quantity + quantity, 100);
	}

	drawMarkers(ctx: CanvasRenderingContext2D, markersImageData: ImageData) {
		// for (let x = 0; x < this.width; x++) {
		// 	for (let y = 0; y < this.height; y++) {
		// 		let cell = this.cells[this.getIndexFromCoords(x, y)];
		// 		cell.marker.draw(ctx, x, y);
		// 	}
		// }

		for (let i = 0; i < markersImageData.data.length; i += 4) {
			let cell = this.cells[i / 4];
			let colors = cell.marker.getMixedColor();

			// Modify pixel data
			markersImageData.data[i + 0] = colors[0]; // R value
			markersImageData.data[i + 1] = colors[1]; // G value
			markersImageData.data[i + 2] = colors[2]; // B value
			markersImageData.data[i + 3] = 255; // A value

			cell.marker.update();
		}
		ctx.putImageData(markersImageData, 0, 0);
	}

	drawFood(ctx: CanvasRenderingContext2D) {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				let cell = this.cells[this.getIndexFromCoords(x, y)];
				if (cell.food.quantity > 0) {
					cell.food.draw(ctx, x, y);
				}
			}
		}
	}

	getIndexFromCoords(x: number, y: number) {
		return x + y * this.width;
	}
}
