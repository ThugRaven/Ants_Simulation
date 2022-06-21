import { MarkerOptions, MarkerTypes } from '../constants';
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

	initializeBorderWalls() {
		for (let x = 0; x < this.width; x++) {
			let cellTop = this.cells[this.getIndexFromCoords(x, 0)];
			let cellBottom = this.cells[this.getIndexFromCoords(x, this.height - 1)];
			cellTop.wall = 1;
			cellBottom.wall = 1;
		}

		for (let y = 1; y < this.height - 1; y++) {
			let cellLeft = this.cells[this.getIndexFromCoords(0, y)];
			let cellRight = this.cells[this.getIndexFromCoords(this.width - 1, y)];
			cellLeft.wall = 1;
			cellRight.wall = 1;
		}
	}

	update() {
		for (const cell of this.cells) {
			this.updateCell(cell);
		}
	}

	updateCell(cell: WorldCell) {
		cell.marker.update();
		if (cell.density > 0.01) {
			cell.density *= 0.99;
		} else {
			cell.density = 0;
		}
	}

	addMarker(x: number, y: number, type: MarkerTypes, intensity: number) {
		let cell = this.cells[this.getIndexFromCoords(x, y)];
		if (type === MarkerTypes.TO_HOME) {
			if (cell.marker.intensity[0] > 0) {
				intensity /= 2;
			}
			cell.marker.intensity[0] = Math.min(
				1,
				cell.marker.intensity[0] + intensity,
			);
		} else if (type === MarkerTypes.TO_FOOD) {
			if (cell.marker.intensity[1] > 0) {
				intensity /= 2;
			}
			cell.marker.intensity[1] = Math.min(
				1,
				cell.marker.intensity[1] + intensity,
			);
		}
	}

	addFood(x: number, y: number, quantity: number) {
		let index = this.getIndexFromCoords(x, y);
		if (index > this.cells.length || index < 0) return;

		let cell = this.cells[index];
		cell.food.quantity = Math.min(cell.food.quantity + quantity, 100);
	}

	drawMarkers(
		ctx: CanvasRenderingContext2D,
		markersImageData: ImageData,
		update = true,
	) {
		for (let i = 0; i < markersImageData.data.length; i += 4) {
			let cell = this.cells[i / 4];
			let colors = cell.marker.getMixedColor();

			// Modify pixel data
			markersImageData.data[i + 0] = colors[0]; // R value
			markersImageData.data[i + 1] = colors[1]; // G value
			markersImageData.data[i + 2] = colors[2]; // B value
			markersImageData.data[i + 3] = 255; // A value

			if (update) {
				this.updateCell(cell);
			}
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

	drawWalls(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = 'rgb(163, 163, 163)';
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				let cell = this.cells[this.getIndexFromCoords(x, y)];
				if (cell.wall === 1) {
					cell.drawWall(ctx, x, y);
				}
			}
		}
	}

	drawDensity(
		ctx: CanvasRenderingContext2D,
		densityImageData: ImageData,
		update = true,
	) {
		for (let i = 0; i < densityImageData.data.length; i += 4) {
			let cell = this.cells[i / 4];
			let ratio = cell.density;

			// Modify pixel data
			densityImageData.data[i + 0] = 4 * ratio; // R value
			densityImageData.data[i + 1] = ratio; // G value
			densityImageData.data[i + 2] = ratio; // B value
			densityImageData.data[i + 3] = 255; // A value

			if (update) {
				this.updateCell(cell);
			}
		}
		ctx.putImageData(densityImageData, 0, 0);
	}

	isOnFood(x: number, y: number) {
		return this.cells[this.getIndexFromCoords(x, y)].food.quantity > 0;
	}

	getIndexFromCoords(x: number, y: number) {
		return x + y * this.width;
	}

	getCellCoords(x: number, y: number) {
		let xCell = Math.floor(x / MarkerOptions.SIZE);
		let yCell = Math.floor(y / MarkerOptions.SIZE);
		return [xCell, yCell];
	}

	getCellFromCoords(x: number, y: number, safe = false) {
		if (!safe) {
			[x, y] = this.getCellCoords(x, y);
		}
		return this.cells[this.getIndexFromCoords(x, y)];
	}

	getCellFromCoordsSafe(x: number, y: number) {
		let [xCell, yCell] = this.getCellCoords(x, y);
		if (this.checkCoords(xCell, yCell)) {
			return this.getCellFromCoords(xCell, yCell, true);
		} else {
			return null;
		}
	}

	checkCoords(x: number, y: number) {
		return x > -1 && x < this.width && y > -1 && y < this.height;
	}
}
