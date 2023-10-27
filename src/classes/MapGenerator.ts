import seedrandom from 'seedrandom';
import { MapGeneratorOptions } from '../constants';
import { seededRandom } from './Utils';
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

	generateMap(worldGrid: WorldGrid, fromSeed = false, seed = '') {
		console.log('Generate Map');

		const url = new URL(window.location.href);
		const urlSeed = url.searchParams.get('seed');
		let rng = null;
		if (fromSeed && urlSeed != null) {
			rng = seedrandom(urlSeed);
		} else if (!fromSeed) {
			const generatedSeed = Math.random().toString(36).slice(2, 7);
			rng = seedrandom(seed != '' ? seed : generatedSeed);
			url.searchParams.set('seed', seed != '' ? seed : generatedSeed);
		} else {
			return;
		}
		console.log(rng());
		window.history.pushState({ path: url.href }, '', url.href);

		this.randomFillMap(rng);

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

	randomFillMap(rng: seedrandom.PRNG) {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.map[x][y] = seededRandom(0, 1, rng) < this.fillRatio ? 1 : 0;
			}
		}
	}

	smoothMap() {
		const mapCopy = [];
		for (let i = 0; i < this.map.length; i++) {
			mapCopy[i] = this.map[i].slice();
		}

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				const wallCount = this.getNeighbourWallCount(x, y);
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
		const borderSize = MapGeneratorOptions.BORDER_SIZE;
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
		const wallRegions = this.getRegions(1);

		if (!wallRegions) {
			return;
		}

		const wallThresholdSize = this.threshold;
		for (const wallRegion of wallRegions) {
			if (wallRegion.length < wallThresholdSize) {
				for (const cell of wallRegion) {
					this.map[cell.x][cell.y] = 0;
				}
			}
		}

		const roomRegions = this.getRegions(0);

		if (!roomRegions) {
			return;
		}

		const roomThresholdSize = this.threshold;
		for (const roomRegion of roomRegions) {
			if (roomRegion.length < roomThresholdSize) {
				for (const cell of roomRegion) {
					this.map[cell.x][cell.y] = 1;
				}
			}
		}
	}

	getRegions(cellType: number) {
		const regions: Coord[][] = [];
		const mapFlags = Array.from(Array(this.width), () =>
			new Array(this.height).fill(0),
		);

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				if (mapFlags[x][y] === 0 && this.map[x][y] === cellType) {
					const newRegion = this.getRegionCells(x, y);

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
		const cells: Coord[] = [];
		const mapFlags = Array.from(Array(this.width), () =>
			new Array(this.height).fill(0),
		);
		const cellType = this.map[cellX][cellY];

		const queue: Coord[] = [];
		queue.push({ x: cellX, y: cellY });
		mapFlags[cellX][cellY] = 1;

		while (queue.length > 0) {
			const cell = queue.shift();
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
