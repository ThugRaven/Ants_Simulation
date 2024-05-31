import seedrandom from 'seedrandom';
import { MapOptions } from '../constants';
import { seededRandom } from './Utils';

export interface MapGeneratorOptions {
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
		// this.threshold = (this.width + this.height) / 2;
		this.threshold = 50;
	}

	initialize(mapGeneratorOptions: MapGeneratorOptions) {
		this.width = mapGeneratorOptions.width;
		this.height = mapGeneratorOptions.height;
		this.map = Array.from(Array(this.width), () => new Array(this.height));
		this.fillRatio = mapGeneratorOptions.fillRatio;
		// this.threshold = (this.width + this.height) / 2;
		this.threshold = 50;
	}

	generateMap(seed: string) {
		console.log('Generate Map');
		console.log(seed);
		if (!seed) {
			this.addBorderWalls();
			return this.map;
		}

		const rng = seedrandom(seed);

		this.randomFillMap(rng);

		for (let i = 0; i < 20; i++) {
			this.smoothMap();
		}

		this.addBorderWalls();
		this.processMap();
		for (let i = 0; i < 5; i++) {
			this.smoothMap();
		}

		return this.map;
	}

	generateMapSteps(
		seed: string,
		generate: (map: number[][], last: boolean) => void,
	) {
		console.log('Generate Map Steps');
		let step = 0;
		const rng = seedrandom(seed);

		const generateStep = () => {
			if (step == 0) {
				this.randomFillMap(rng);
				generate(this.map, false);
			}

			if (step == 1) {
				for (let i = 0; i < 20; i++) {
					this.smoothMap();
					generate(this.map, false);
				}
			}

			if (step == 2) {
				this.addBorderWalls();
				generate(this.map, false);
			}

			if (step == 3) {
				this.processMap();
				generate(this.map, false);
			}

			if (step == 4) {
				for (let i = 0; i < 5; i++) {
					this.smoothMap();
					generate(this.map, i == 4 ? true : false);
				}
			}

			if (step == 5) {
				return;
			}

			step++;

			generateStep();
		};

		generateStep();
	}

	randomFillMap(rng: seedrandom.PRNG) {
		for (
			let x = MapOptions.BORDER_SIZE;
			x < this.width - MapOptions.BORDER_SIZE;
			x++
		) {
			for (
				let y = MapOptions.BORDER_SIZE;
				y < this.height - MapOptions.BORDER_SIZE;
				y++
			) {
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
		const borderSize = MapOptions.BORDER_SIZE;
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
		const survivingRooms: Room[] = [];
		for (const roomRegion of roomRegions) {
			if (roomRegion.length < roomThresholdSize) {
				for (const cell of roomRegion) {
					this.map[cell.x][cell.y] = 1;
				}
			} else {
				survivingRooms.push(new Room(roomRegion, this.map));
			}
		}

		survivingRooms.sort((roomA, roomB) => roomB.roomSize - roomA.roomSize);
		survivingRooms[0].isMainRoom = true;
		survivingRooms[0].isAccessibleFromMainRoom = true;
		this.connectClosestRooms(survivingRooms);
	}

	connectClosestRooms(
		allRooms: Room[],
		forceAccessibilityFromMainRoom = false,
	) {
		let roomListA: Room[] = [];
		let roomListB: Room[] = [];

		if (forceAccessibilityFromMainRoom) {
			for (const room of allRooms) {
				if (room.isAccessibleFromMainRoom) {
					roomListB.push(room);
				} else {
					roomListA.push(room);
				}
			}
		} else {
			roomListA = allRooms;
			roomListB = allRooms;
		}

		let bestDistance = 0;
		let bestTileA: Coord = { x: 0, y: 0 };
		let bestTileB: Coord = { x: 0, y: 0 };
		let bestRoomA: Room = new Room();
		let bestRoomB: Room = new Room();
		let possibleConnectionFound = false;

		for (const roomA of roomListA) {
			if (!forceAccessibilityFromMainRoom) {
				possibleConnectionFound = false;
				if (roomA.connectedRooms.length > 0) {
					continue;
				}
			}

			for (const roomB of roomListB) {
				if (roomA == roomB || roomA.isConnected(roomB)) {
					continue;
				}

				for (
					let tileIndexA = 0;
					tileIndexA < roomA.edgeTiles.length;
					tileIndexA++
				) {
					for (
						let tileIndexB = 0;
						tileIndexB < roomB.edgeTiles.length;
						tileIndexB++
					) {
						const tileA = roomA.edgeTiles[tileIndexA];
						const tileB = roomB.edgeTiles[tileIndexB];
						const distanceBetweenRooms =
							Math.pow(tileA.x - tileB.x, 2) + Math.pow(tileA.y - tileB.y, 2);

						if (
							distanceBetweenRooms < bestDistance ||
							!possibleConnectionFound
						) {
							bestDistance = distanceBetweenRooms;
							possibleConnectionFound = true;
							bestTileA = tileA;
							bestTileB = tileB;
							bestRoomA = roomA;
							bestRoomB = roomB;
						}
					}
				}
			}

			if (possibleConnectionFound && !forceAccessibilityFromMainRoom) {
				this.createPassage(bestRoomA, bestRoomB, bestTileA, bestTileB);
			}
		}

		if (possibleConnectionFound && forceAccessibilityFromMainRoom) {
			this.createPassage(bestRoomA, bestRoomB, bestTileA, bestTileB);
			this.connectClosestRooms(allRooms, true);
		}

		if (!forceAccessibilityFromMainRoom) {
			this.connectClosestRooms(allRooms, true);
		}
	}

	createPassage(roomA: Room, roomB: Room, tileA: Coord, tileB: Coord) {
		roomA.connectRooms(roomA, roomB);

		const line = this.getLine(tileA, tileB);

		for (const c of line) {
			this.drawCircle(c, 2);
		}
	}

	drawCircle(c: Coord, r: number) {
		for (let x = -r; x <= r; x++) {
			for (let y = -r; y <= r; y++) {
				if (x * x + y * y <= r * r) {
					const drawX = c.x + x;
					const drawY = c.y + y;

					if (this.isInMapRange(drawX, drawY)) {
						this.map[drawX][drawY] = 0;
					}
				}
			}
		}
	}

	getLine(from: Coord, to: Coord) {
		const line: Coord[] = [];

		let x = from.x;
		let y = from.y;

		const dx = to.x - from.x;
		const dy = to.y - from.y;

		let inverted = false;
		let step = Math.sign(dx);
		let gradientStep = Math.sign(dy);

		let longest = Math.abs(dx);
		let shortest = Math.abs(dy);

		if (longest < shortest) {
			inverted = true;
			longest = Math.abs(dy);
			shortest = Math.abs(dx);

			step = Math.sign(dy);
			gradientStep = Math.sign(dx);
		}

		let gradientAccumulation = longest / 2;
		for (let i = 0; i < longest; i++) {
			line.push({ x, y });

			if (inverted) {
				y += step;
			} else {
				x += step;
			}

			gradientAccumulation += shortest;
			if (gradientAccumulation >= longest) {
				if (inverted) {
					x += gradientStep;
				} else {
					y += gradientStep;
				}

				gradientAccumulation -= longest;
			}
		}

		return line;
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
					if (this.isInMapRange(x, y) && (y === cell.y || x === cell.x)) {
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

	isInMapRange(x: number, y: number) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}
}

class Room {
	tiles: Coord[];
	edgeTiles: Coord[];
	connectedRooms: Room[];
	roomSize: number;
	isAccessibleFromMainRoom = false;
	isMainRoom = false;

	constructor(roomTiles?: Coord[], map?: number[][]) {
		this.tiles = roomTiles ?? [];
		this.roomSize = this.tiles.length;
		this.connectedRooms = [];

		this.edgeTiles = [];
		if (!map) {
			return;
		}

		for (const tile of this.tiles) {
			for (let x = tile.x - 1; x <= tile.x + 1; x++) {
				for (let y = tile.y - 1; y <= tile.y + 1; y++) {
					if (x == tile.x || y == tile.y) {
						if (map[x][y] == 1) {
							this.edgeTiles.push(tile);
						}
					}
				}
			}
		}
	}

	setAccessibleFromMainRoom() {
		if (!this.isAccessibleFromMainRoom) {
			this.isAccessibleFromMainRoom = true;
			for (const connectedRoom of this.connectedRooms) {
				connectedRoom.setAccessibleFromMainRoom();
			}
		}
	}

	connectRooms(roomA: Room, roomB: Room) {
		if (roomA.isAccessibleFromMainRoom) {
			roomB.setAccessibleFromMainRoom();
		} else if (roomB.isAccessibleFromMainRoom) {
			roomA.setAccessibleFromMainRoom();
		}

		roomA.connectedRooms.push(roomB);
		roomB.connectedRooms.push(roomA);
	}

	isConnected(otherRoom: Room) {
		return this.connectedRooms.find((room) => room == otherRoom);
	}
}
