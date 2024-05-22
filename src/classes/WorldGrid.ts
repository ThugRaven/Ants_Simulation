import { MapGeneratorOptions, MarkerOptions, MarkerTypes } from '../constants';
import { circle } from './Shapes';
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

	addBorderWalls() {
		const borderSize = MapGeneratorOptions.BORDER_SIZE;
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < borderSize; y++) {
				const cellTop = this.cells[this.getIndexFromCoords(x, y)];
				const cellBottom =
					this.cells[this.getIndexFromCoords(x, this.height - y - 1)];
				cellTop.wall = 1;
				cellBottom.wall = 1;
			}
		}

		for (let x = 0; x < borderSize; x++) {
			for (let y = 0; y < this.height; y++) {
				const cellLeft = this.cells[this.getIndexFromCoords(x, y)];
				const cellRight =
					this.cells[this.getIndexFromCoords(this.width - x - 1, y)];
				cellLeft.wall = 1;
				cellRight.wall = 1;
			}
		}
	}

	update() {
		for (const cell of this.cells) {
			this.updateCell(cell);
		}
	}

	updateCell(cell: WorldCell) {
		cell.marker.update();

		for (let i = 0; i < 3; i++) {
			if (cell.density[i] > 0.01) {
				cell.density[i] *= 0.99;
			} else {
				cell.density[i] = 0;
			}
		}
	}

	addMarker(x: number, y: number, type: MarkerTypes, intensity: number) {
		const cell = this.cells[this.getIndexFromCoords(x, y)];
		if (type === MarkerTypes.TO_HOME) {
			cell.marker.intensity[0] = Math.min(
				1,
				Math.max(cell.marker.getToHomeIntensity(), intensity),
			);
		} else if (type === MarkerTypes.TO_FOOD) {
			cell.marker.intensity[1] = Math.min(
				1,
				Math.max(cell.marker.getToFoodIntensity(), intensity),
			);
		}
	}

	addFood(x: number, y: number, quantity: number) {
		const index = this.getIndexFromCoords(x, y);
		if (index > this.cells.length || index < 0) return;

		const cell = this.cells[index];
		cell.food.quantity = Math.min(cell.food.quantity + quantity, 100);
		cell.food.changed = true;
	}

	drawMarkers(
		ctx: CanvasRenderingContext2D,
		markersImageData: ImageData,
		update = true,
	) {
		for (let i = 0; i < markersImageData.data.length; i += 4) {
			const cell = this.cells[i / 4];
			// Modify pixel data
			markersImageData.data[i + 0] = cell.marker.getToHomeIntensity() * 255; // R value
			markersImageData.data[i + 1] = cell.marker.getToFoodIntensity() * 255; // G value
			markersImageData.data[i + 2] = 0; // B value
			markersImageData.data[i + 3] = 255; // A value

			if (update) {
				this.updateCell(cell);
			}
		}
		ctx.putImageData(markersImageData, 0, 0);
	}

	drawFood(ctx: CanvasRenderingContext2D) {
		for (let i = 0; i < this.cells.length; i++) {
			if (this.cells[i].food.changed) {
				const [x, y] = this.getCoordsFromIndex(i);
				this.cells[i].food.draw(ctx, x, y);
			}
		}
	}

	drawWalls(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = 'rgb(163, 163, 163)';
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				const cell = this.cells[this.getIndexFromCoords(x, y)];
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
		advanced = false,
	) {
		for (let i = 0; i < densityImageData.data.length; i += 4) {
			const cell = this.cells[i / 4];
			const ratio = cell.density;

			// Modify pixel data
			if (!advanced) {
				const ratioAll = ratio[0] + ratio[1] + ratio[2];
				densityImageData.data[i + 0] = 4 * ratioAll; // R value
				densityImageData.data[i + 1] = ratioAll; // G value
				densityImageData.data[i + 2] = ratioAll; // B value
				densityImageData.data[i + 3] = 255; // A value
			} else {
				densityImageData.data[i + 0] = 4 * ratio[0]; // R value
				densityImageData.data[i + 1] = 4 * ratio[1]; // G value
				densityImageData.data[i + 2] = 4 * ratio[2]; // B value
				densityImageData.data[i + 3] = 255; // A value
			}

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

	getCoordsFromIndex(index: number) {
		const x = index % this.width;
		const y = Math.floor(index / this.width);
		return [x, y];
	}

	getCellCoords(x: number, y: number) {
		const xCell = Math.floor(x / MarkerOptions.SIZE);
		const yCell = Math.floor(y / MarkerOptions.SIZE);
		return [xCell, yCell];
	}

	getCellFromCoords(x: number, y: number, safe = false) {
		if (!safe) {
			[x, y] = this.getCellCoords(x, y);
		}
		return this.cells[this.getIndexFromCoords(x, y)];
	}

	getCellFromCoordsSafe(x: number, y: number) {
		const [xCell, yCell] = this.getCellCoords(x, y);
		if (this.checkCoords(xCell, yCell)) {
			return this.getCellFromCoords(xCell, yCell, true);
		} else {
			return null;
		}
	}

	checkCoords(x: number, y: number) {
		return x > -1 && x < this.width && y > -1 && y < this.height;
	}

	rayCast(
		position: Vector,
		direction: Vector,
		maxDistance: number,
		ctx: CanvasRenderingContext2D,
	) {
		const dX = maxDistance * Math.cos(direction.x);
		const dY = maxDistance * Math.sin(direction.y);
		const rayEnd = position.copy();
		rayEnd.x += dX;
		rayEnd.y += dY;

		const rayDir = rayEnd.copy().sub(position).normalize();
		ctx.fillStyle = 'green';
		circle(ctx, position.x, position.y, 5, true);
		ctx.fillStyle = 'red';
		circle(ctx, rayEnd.x, rayEnd.y, 5, true);

		const rayUnitStepSize = new Vector(
			Math.sqrt(1 + (rayDir.y / rayDir.x) * (rayDir.y / rayDir.x)),
			Math.sqrt(1 + (rayDir.x / rayDir.y) * (rayDir.x / rayDir.y)),
		);

		const mapCheck = position.copy();
		const rayLength = new Vector(0, 0);
		const step = new Vector(0, 0);

		if (rayDir.x < 0) {
			step.x = -1;
			rayLength.x = (position.x - Math.round(mapCheck.x)) * rayUnitStepSize.x;
		} else {
			step.x = 1;
			rayLength.x =
				(Math.round(mapCheck.x + 1) - position.x) * rayUnitStepSize.x;
		}

		if (rayDir.y < 0) {
			step.y = -1;
			rayLength.y = (position.y - Math.round(mapCheck.y)) * rayUnitStepSize.y;
		} else {
			step.y = 1;
			rayLength.y =
				(Math.round(mapCheck.y + 1) - position.y) * rayUnitStepSize.y;
		}

		let tileFound = false;
		let distance = 0;
		while (!tileFound && distance < maxDistance) {
			if (rayLength.x < rayLength.y) {
				mapCheck.x += step.x;
				distance = rayLength.x;
				rayLength.x += rayUnitStepSize.x;
			} else {
				mapCheck.y += step.y;
				distance = rayLength.y;
				rayLength.y += rayUnitStepSize.y;
			}
			const cell = this.getCellFromCoordsSafe(mapCheck.x, mapCheck.y);

			if (cell) {
				cell.density = [25, cell.density[1], cell.density[2]];
			}

			if (
				mapCheck.x >= 0 &&
				mapCheck.x < this.width * MarkerOptions.SIZE &&
				mapCheck.y >= 0 &&
				mapCheck.y < this.height * MarkerOptions.SIZE
			) {
				if (cell && cell.wall == 1) {
					tileFound = true;
					const normal = new Vector(
						rayLength.x < rayLength.y ? 1 : 0,
						rayLength.y < rayLength.x ? 1 : 0,
					);

					return {
						cell,
						distance,
						normal,
						intersection: position.add(rayDir.mult(distance)),
						rayEnd,
					};
				}
			}
		}

		return null;
	}
}
