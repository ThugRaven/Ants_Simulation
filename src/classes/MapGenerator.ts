import { MapGeneratorOptions } from '../constants';
import { random } from './Utils';
import WorldGrid from './WorldGrid';

interface MapGeneratorOptions {
	width: number;
	height: number;
	fillRatio: number;
}

interface Coord {
	x: number;
	y: number;
}

export default class MapGenerator {
	width: number;
	height: number;
	map: number[][];
	fillRatio: number;
	threshold: number;

	constructor(mapGeneratorOptions: MapGeneratorOptions) {
		this.width = mapGeneratorOptions.width;
		this.height = mapGeneratorOptions.height;
		this.map = Array.from(Array(this.width), () => new Array(this.height));
		this.fillRatio = mapGeneratorOptions.fillRatio;
		this.threshold = (this.width + this.height) / 2;
	}

	generateMap(worldGrid: WorldGrid) {
		this.randomFillMap();

		for (let i = 0; i < 15; i++) {
			this.smoothMap();
		}

		this.addBorderWalls();
		this.processMap();

		for (let x = 0; x < worldGrid.width; x++) {
			for (let y = 0; y < worldGrid.height; y++) {
				worldGrid.cells[worldGrid.getIndexFromCoords(x, y)].wall = this.map[x][
					y
				]
					? 1
					: 0;
			}
		}
	}

	randomFillMap() {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.map[x][y] = random(0, 1) < this.fillRatio ? 1 : 0;
			}
		}
	}

	smoothMap() {
		let mapCopy = [];
		for (let i = 0; i < this.map.length; i++) {
			mapCopy[i] = this.map[i].slice();
		}

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				let wallCount = this.getNeighbourWallCount(x, y);
				if (wallCount > 4) {
					mapCopy[x][y] = 1;
				} else if (wallCount < 4) {
					mapCopy[x][y] = 0;
				}
			}
		}

		this.map = mapCopy;
	}

	getNeighbourWallCount(cellX: number, cellY: number) {
		let wallCount = 0;
		for (let x = cellX - 1; x <= cellX + 1; x++) {
			for (let y = cellY - 1; y <= cellY + 1; y++) {
				if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
					if (x !== cellX || y !== cellY) {
						wallCount += this.map[x][y];
					}
				} else {
					wallCount++;
				}
			}
		}

		return wallCount;
	}

	addBorderWalls() {
		let borderSize = MapGeneratorOptions.BORDER_SIZE;
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < borderSize; y++) {
				this.map[x][y] = 1;
				this.map[x][this.height - y - 1] = 1;
			}
		}

		for (let x = 0; x < borderSize; x++) {
			for (let y = 0; y < this.height; y++) {
				this.map[x][y] = 1;
				this.map[this.width - x - 1][y] = 1;
			}
		}
	}

	processMap() {
		let wallRegions = this.getRegions(1);

		if (!wallRegions) {
			return;
		}

		let wallThresholdSize = this.threshold;
		for (const wallRegion of wallRegions) {
			if (wallRegion.length < wallThresholdSize) {
				for (const cell of wallRegion) {
					this.map[cell.x][cell.y] = 0;
				}
			}
		}

		let roomRegions = this.getRegions(0);

		if (!roomRegions) {
			return;
		}

		let roomThresholdSize = this.threshold;
		for (const roomRegion of roomRegions) {
			if (roomRegion.length < roomThresholdSize) {
				for (const cell of roomRegion) {
					this.map[cell.x][cell.y] = 1;
				}
			}
		}
	}

	getRegions(cellType: number) {
		let regions: Coord[][] = [];
		let mapFlags = Array.from(Array(this.width), () =>
			new Array(this.height).fill(0),
		);

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				if (mapFlags[x][y] === 0 && this.map[x][y] === cellType) {
					let newRegion = this.getRegionCells(x, y);

					if (!newRegion) {
						return;
					}

					regions.push(newRegion);

					for (const cell of newRegion) {
						mapFlags[cell.x][cell.y] = 1;
					}
				}
			}
		}

		return regions;
	}

	getRegionCells(cellX: number, cellY: number) {
		let cells: Coord[] = [];
		let mapFlags = Array.from(Array(this.width), () =>
			new Array(this.height).fill(0),
		);
		let cellType = this.map[cellX][cellY];

		let queue: Coord[] = [];
		queue.push({ x: cellX, y: cellY });
		mapFlags[cellX][cellY] = 1;

		while (queue.length > 0) {
			let cell = queue.shift();
			if (!cell) {
				return;
			}

			cells.push(cell);

			for (let x = cell.x - 1; x <= cell.x + 1; x++) {
				for (let y = cell.y - 1; y <= cell.y + 1; y++) {
					if (
						x >= 0 &&
						x < this.width &&
						y >= 0 &&
						y < this.height &&
						(y === cell.y || x === cell.x)
					) {
						if (mapFlags[x][y] === 0 && this.map[x][y] === cellType) {
							mapFlags[x][y] = 1;
							queue.push({ x, y });
						}
					}
				}
			}
		}

		return cells;
	}
}
