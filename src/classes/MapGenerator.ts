import seedrandom from 'seedrandom';
import { ColonyOptions, MapOptions } from '../constants';
import { seededRandom } from './Utils';

export interface MapGeneratorOptions {
	width: number;
	height: number;
	fillRatio: number;
	fillRatioFood: number;
	threshold: number;
	thresholdFood: number;
}

interface Coord {
	x: number;
	y: number;
}

export default class MapGenerator {
	width: number;
	height: number;
	map: number[][];
	foodMap: number[][];
	fillRatio: number;
	fillRatioFood: number;
	threshold: number;
	thresholdFood: number;

	constructor(mapGeneratorOptions: MapGeneratorOptions) {
		this.width = mapGeneratorOptions.width;
		this.height = mapGeneratorOptions.height;
		this.map = Array.from(Array(this.width), () => new Array(this.height));
		this.foodMap = Array.from(Array(this.width), () => new Array(this.height));
		this.fillRatio = mapGeneratorOptions.fillRatio;
		this.fillRatioFood = mapGeneratorOptions.fillRatioFood;
		this.threshold = mapGeneratorOptions.threshold;
		this.thresholdFood = mapGeneratorOptions.thresholdFood;
	}

	initialize(mapGeneratorOptions: MapGeneratorOptions) {
		this.width = mapGeneratorOptions.width;
		this.height = mapGeneratorOptions.height;
		this.map = Array.from(Array(this.width), () => new Array(this.height));
		this.foodMap = Array.from(Array(this.width), () => new Array(this.height));
		this.fillRatio = mapGeneratorOptions.fillRatio;
		this.fillRatioFood = mapGeneratorOptions.fillRatioFood;
		this.threshold = mapGeneratorOptions.threshold;
		this.thresholdFood = mapGeneratorOptions.thresholdFood;
	}

	generateMap(seed: string) {
		console.log('Generate Map');
		console.log(seed);
		if (!seed) {
			this.addBorderWalls();
			return { map: this.map, foodMap: this.foodMap };
		}

		const rng = seedrandom(seed);

		this.map = this.randomFillMap(rng, this.fillRatio, 1);
		this.clearColonySpace();

		for (let i = 0; i < 20; i++) {
			this.map = this.smoothMap(this.map, 1);
		}

		this.addBorderWalls();
		const rooms = this.processMap();
		for (let i = 0; i < 5; i++) {
			this.map = this.smoothMap(this.map, 1);
		}
		this.foodMap = this.generateFoodMap(seed, rooms);

		return { map: this.map, foodMap: this.foodMap };
	}

	generateMapSteps(
		seed: string,
		generate: (map: number[][], foodMap: number[][], last: boolean) => void,
	) {
		console.log('Generate Map Steps');
		let step = 0;
		const rng = seedrandom(seed);
		let rooms: Room[] | undefined;

		if (!seed) {
			this.addBorderWalls();
			return generate(this.map, this.foodMap, true);
		}

		const generateStep = () => {
			if (step == 0) {
				this.map = this.randomFillMap(rng, this.fillRatio, 1);
				generate(this.map, this.foodMap, false);
			}

			if (step == 1) {
				this.clearColonySpace();
				generate(this.map, this.foodMap, false);
			}

			if (step == 2) {
				for (let i = 0; i < 20; i++) {
					this.map = this.smoothMap(this.map, 1);
					generate(this.map, this.foodMap, false);
				}
			}

			if (step == 3) {
				this.addBorderWalls();
				generate(this.map, this.foodMap, false);
			}

			if (step == 4) {
				rooms = this.processMap();
				generate(this.map, this.foodMap, false);
			}

			if (step == 5) {
				for (let i = 0; i < 5; i++) {
					this.map = this.smoothMap(this.map, 1);
					generate(this.map, this.foodMap, false);
				}
			}

			if (step == 6) {
				this.foodMap = this.generateFoodMap(seed, rooms);
				generate(this.map, this.foodMap, true);
			}

			if (step == 7) {
				return;
			}

			step++;

			generateStep();
		};

		generateStep();
	}

	generateFoodMap(seed: string, rooms?: Room[]) {
		console.log('Generate Food Map');
		console.log(seed);
		if (!seed) {
			return this.foodMap;
		}

		for (let x = 0; x < this.foodMap.length; x++) {
			for (let y = 0; y < this.foodMap[x].length; y++) {
				this.foodMap[x][y] = 0;
			}
		}

		const rng = seedrandom(seed);

		this.randomFillRegions(rng, 0.5, 100, rooms);
		for (let i = 0; i < 5; i++) {
			this.foodMap = this.smoothMap(this.foodMap, 100, true);
		}

		this.foodMap = this.randomFillMap(
			rng,
			this.fillRatioFood,
			100,
			this.foodMap,
		);
		for (let i = 0; i < 20; i++) {
			this.foodMap = this.smoothMap(this.foodMap, 100, false);
		}

		const foodRegions = this.getRegions(this.foodMap, 100);

		if (!foodRegions) {
			return this.foodMap;
		}

		const foodThresholdSize = this.thresholdFood;
		for (const foodRegion of foodRegions) {
			if (foodRegion.length < foodThresholdSize) {
				for (const cell of foodRegion) {
					this.foodMap[cell.x][cell.y] = 0;
				}
			}
		}

		return this.foodMap;
	}

	randomFillMap(
		rng: seedrandom.PRNG,
		fillRatio: number,
		cellType: number,
		foodMap?: number[][],
	) {
		const map = foodMap
			? foodMap
			: Array.from(Array(this.width), () => new Array(this.height));

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				if (
					cellType === 1 &&
					((x >= 0 && x <= MapOptions.BORDER_SIZE) ||
						(x >= this.width - MapOptions.BORDER_SIZE && x <= this.width) ||
						(y >= 0 && y <= MapOptions.BORDER_SIZE) ||
						(y >= this.height - MapOptions.BORDER_SIZE && y <= this.height))
				) {
					map[x][y] = 1;
					continue;
				}

				if (cellType === 100 && this.map[x][y]) {
					map[x][y] = 0;
				} else if (cellType === 100 && map[x][y] === 100) {
					map[x][y] = 100;
				} else {
					map[x][y] =
						seededRandom(0, 1, rng) < fillRatio
							? cellType === 100
								? 100
								: 1
							: 0;
				}
			}
		}

		return map;
	}

	randomFillRegions(
		rng: seedrandom.PRNG,
		fillRatio: number,
		cellType: number,
		rooms?: Room[],
	) {
		if (!rooms) {
			return;
		}

		for (const room of rooms) {
			if (room.roomSize < 1000) {
				for (let i = 0; i < room.tiles.length; i++) {
					const cell = room.tiles[i];
					this.foodMap[cell.x][cell.y] =
						seededRandom(0, 1, rng) <
						(room.roomSize < 500 ? 1 : room.roomSize < 1000 ? 0.75 : fillRatio)
							? cellType === 100
								? 100
								: 1
							: 0;
				}
			}
		}
	}

	smoothMap(map: number[][], cellType: number, food = false) {
		const mapCopy = [];
		for (let i = 0; i < map.length; i++) {
			mapCopy[i] = map[i].slice();
		}

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				const count = this.getNeighbourCount(map, x, y, food);
				if (count > 4) {
					if (food) {
						if (!this.map[x][y]) {
							mapCopy[x][y] = 100;
						}
					} else {
						mapCopy[x][y] = cellType === 100 ? 100 : 1;
					}
				} else if (count < 4) {
					mapCopy[x][y] = 0;
				}
			}
		}

		map = mapCopy;
		return map;
	}

	getNeighbourCount(
		map: number[][],
		cellX: number,
		cellY: number,
		food = false,
	) {
		let count = 0;
		for (let x = cellX - 1; x <= cellX + 1; x++) {
			for (let y = cellY - 1; y <= cellY + 1; y++) {
				if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
					if (x !== cellX || y !== cellY) {
						if (food) {
							count += this.map[x][y] == 1 || map[x][y] == 100 ? 1 : 0;
						} else {
							count += map[x][y] == 1 || map[x][y] == 100 ? 1 : 0;
						}
					}
				} else {
					count++;
				}
			}
		}

		return count;
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
		const wallRegions = this.getRegions(this.map, 1);

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

		const roomRegions = this.getRegions(this.map, 0);

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

		const rooms = survivingRooms;
		survivingRooms.sort((roomA, roomB) => roomB.roomSize - roomA.roomSize);
		survivingRooms[0].isMainRoom = true;
		survivingRooms[0].isAccessibleFromMainRoom = true;
		this.connectClosestRooms(survivingRooms);
		return rooms;
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

	clearColonySpace() {
		this.drawCircle(
			{ x: Math.round(this.width / 2), y: Math.round(this.height / 2) },
			ColonyOptions.COLONY_RADIUS * 3,
		);
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

	getRegions(map: number[][], cellType: number) {
		const regions: Coord[][] = [];
		const mapFlags = Array.from(Array(this.width), () =>
			new Array(this.height).fill(0),
		);

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				if (mapFlags[x][y] === 0 && map[x][y] === cellType) {
					const newRegion = this.getRegionCells(map, x, y, cellType === 100);

					if (!newRegion) {
						return;
					}

					regions.push(newRegion);

					for (const cell of newRegion) {
						mapFlags[cell.x][cell.y] = cellType === 100 ? 100 : 1;
					}
				}
			}
		}

		return regions;
	}

	getRegionCells(map: number[][], cellX: number, cellY: number, food: boolean) {
		const cells: Coord[] = [];
		const mapFlags = Array.from(Array(this.width), () =>
			new Array(this.height).fill(0),
		);
		const cellType = map[cellX][cellY];

		const queue: Coord[] = [];
		queue.push({ x: cellX, y: cellY });
		mapFlags[cellX][cellY] = food ? 100 : 1;

		while (queue.length > 0) {
			const cell = queue.shift();
			if (!cell) {
				return;
			}

			cells.push(cell);

			for (let x = cell.x - 1; x <= cell.x + 1; x++) {
				for (let y = cell.y - 1; y <= cell.y + 1; y++) {
					if (this.isInMapRange(x, y) && (y === cell.y || x === cell.x)) {
						if (mapFlags[x][y] === 0 && map[x][y] === cellType) {
							mapFlags[x][y] = food ? 100 : 1;
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
