import { createVector } from './Vector';
import WorldGrid from './WorldGrid';

export default class WallDistance {
	calculateDistances(worldGrid: WorldGrid) {
		for (let x = 0; x < worldGrid.width; x++) {
			for (let y = 0; y < worldGrid.height; y++) {
				const cell = worldGrid.cells[worldGrid.getIndexFromCoords(x, y)];

				if (cell.wall) {
					cell.dist = this.getMinDistance(x, y, worldGrid, false, 20);
				} else {
					cell.dist = this.getMinDistance(x, y, worldGrid, true, 3);
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
	) {
		let minDist = maxIterations;
		for (let dX = -maxIterations; dX <= maxIterations; dX++) {
			for (let dY = -maxIterations; dY <= maxIterations; dY++) {
				const cell =
					worldGrid.cells[worldGrid.getIndexFromCoords(x + dX, y + dY)];

				if (cell) {
					if (
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
