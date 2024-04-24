import seedrandom from 'seedrandom';
import { MapGeneratorOptions } from './constants';
import { seededRandom } from './classes/Utils';

interface MapGeneratorOptions {
	width: number;
	height: number;
	fillRatio: number;
}

interface Coord {
	x: number;
	y: number;
}

let width = 0;
let height = 0;
let map = null;
let fillRatio = 0;
let threshold = 0;

self.onmessage = (
	e: MessageEvent<{ action: string; mapGeneratorOptions: MapGeneratorOptions }>,
) => {
	if (e.data.action === 'SETUP') {
		width = e.data.mapGeneratorOptions.width;
		height = e.data.mapGeneratorOptions.height;
		map = Array.from(Array(width), () => new Array(height));
		fillRatio = e.data.mapGeneratorOptions.fillRatio;
		threshold = (width + height) / 2;
	}

	console.log('MapWorker message', e.data);

	if (e.data.action === 'GENERATE') {
		console.log('generate map');
		generateMap();
	}
	// postMessage('halo');
};

function generateMap(fromSeed = false, seed = '') {
	console.log('Generate Map');

	let rng = null;

	const generatedSeed = Math.random().toString(36).slice(2, 7);
	rng = seedrandom(seed != '' ? seed : generatedSeed);
	randomFillMap(rng);

	for (let i = 0; i < 15; i++) {
		smoothMap();
	}

	addBorderWalls();
	processMap();

	console.log(map);

	// for (let x = 0; x < worldGrid.width; x++) {
	// 	for (let y = 0; y < worldGrid.height; y++) {
	// 		worldGrid.cells[worldGrid.getIndexFromCoords(x, y)].wall = map[x][
	// 			y
	// 		]
	// 			? 1
	// 			: 0;
	// 	}
	// }
}

function randomFillMap(rng: seedrandom.PRNG) {
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			map[x][y] = seededRandom(0, 1, rng) < fillRatio ? 1 : 0;
		}
	}
}

function smoothMap() {
	const mapCopy = [];
	for (let i = 0; i < map.length; i++) {
		mapCopy[i] = map[i].slice();
	}

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const wallCount = getNeighbourWallCount(x, y);
			if (wallCount > 4) {
				mapCopy[x][y] = 1;
			} else if (wallCount < 4) {
				mapCopy[x][y] = 0;
			}
		}
	}

	map = mapCopy;
}

function getNeighbourWallCount(cellX: number, cellY: number) {
	let wallCount = 0;
	for (let x = cellX - 1; x <= cellX + 1; x++) {
		for (let y = cellY - 1; y <= cellY + 1; y++) {
			if (x >= 0 && x < width && y >= 0 && y < height) {
				if (x !== cellX || y !== cellY) {
					wallCount += map[x][y];
				}
			} else {
				wallCount++;
			}
		}
	}

	return wallCount;
}

function addBorderWalls() {
	const borderSize = MapGeneratorOptions.BORDER_SIZE;
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < borderSize; y++) {
			map[x][y] = 1;
			map[x][height - y - 1] = 1;
		}
	}

	for (let x = 0; x < borderSize; x++) {
		for (let y = 0; y < height; y++) {
			map[x][y] = 1;
			map[width - x - 1][y] = 1;
		}
	}
}

function processMap() {
	const wallRegions = getRegions(1);

	if (!wallRegions) {
		return;
	}

	const wallThresholdSize = threshold;
	for (const wallRegion of wallRegions) {
		if (wallRegion.length < wallThresholdSize) {
			for (const cell of wallRegion) {
				map[cell.x][cell.y] = 0;
			}
		}
	}

	const roomRegions = getRegions(0);

	if (!roomRegions) {
		return;
	}

	const roomThresholdSize = threshold;
	for (const roomRegion of roomRegions) {
		if (roomRegion.length < roomThresholdSize) {
			for (const cell of roomRegion) {
				map[cell.x][cell.y] = 1;
			}
		}
	}
}

function getRegions(cellType: number) {
	const regions: Coord[][] = [];
	const mapFlags = Array.from(Array(width), () => new Array(height).fill(0));

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			if (mapFlags[x][y] === 0 && map[x][y] === cellType) {
				const newRegion = getRegionCells(x, y);

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

function getRegionCells(cellX: number, cellY: number) {
	const cells: Coord[] = [];
	const mapFlags = Array.from(Array(width), () => new Array(height).fill(0));
	const cellType = map[cellX][cellY];

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
					x < width &&
					y >= 0 &&
					y < height &&
					(y === cell.y || x === cell.x)
				) {
					if (mapFlags[x][y] === 0 && map[x][y] === cellType) {
						mapFlags[x][y] = 1;
						queue.push({ x, y });
					}
				}
			}
		}
	}

	return cells;
}
