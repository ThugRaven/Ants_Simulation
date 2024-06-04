import { createVector } from './Vector';
import WorldGrid from './WorldGrid';

export default class WallDistance {
	calculateDistances(worldGrid: WorldGrid) {
		for (let x = 0; x < worldGrid.width; x++) {
			for (let y = 0; y < worldGrid.height; y++) {
				const cell = worldGrid.cells[worldGrid.getIndexFromCoords(x, y)];

				if (cell.wall) {
					cell.dist = this.getMinDistance(x, y, worldGrid, false, 10);
				} else {
					cell.dist = this.getMinDistance(x, y, worldGrid, true, 3);
				}
			}
		}
	}

	calculateFoodDistances(worldGrid: WorldGrid) {
		for (let x = 0; x < worldGrid.width; x++) {
			for (let y = 0; y < worldGrid.height; y++) {
				const cell = worldGrid.cells[worldGrid.getIndexFromCoords(x, y)];

				if (cell.food.quantity > 0) {
					const food = Math.round(
						this.getMinDistance(x, y, worldGrid, false, 3, true) * 100,
					);
					cell.food.quantity = food;
					cell.food.changed = true;
				}
			}
		}
	}

	getMinDistance(
		x: number,
		y: number,
		worldGrid: WorldGrid,
		distanceToWalls: boolean,
		maxIterations: number,
		food = false,
	) {
		let minDist = maxIterations;
		for (let dX = -maxIterations; dX <= maxIterations; dX++) {
			for (let dY = -maxIterations; dY <= maxIterations; dY++) {
				const cell =
					worldGrid.cells[worldGrid.getIndexFromCoords(x + dX, y + dY)];

				if (cell) {
					if (food) {
						if (cell.food.quantity == 0 && !cell.wall) {
							const dist = createVector(dX, dY).mag();

							if (dist < minDist) {
								minDist = dist;
							}
						}
					} else if (
						(cell.wall && distanceToWalls) ||
						(!cell.wall && !distanceToWalls)
					) {
						const dist = createVector(dX, dY).mag();

						if (dist < minDist) {
							minDist = dist;
						}
					}
				}
			}
		}

		return (minDist = Math.min(1, minDist / maxIterations));
	}
}
