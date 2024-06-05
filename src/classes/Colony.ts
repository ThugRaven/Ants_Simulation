import { AntOptions, ColonyOptions, MarkerOptions } from '../constants';
import {
	cameraCenter,
	canvasScale,
	offsetY,
	windowHeight,
	windowWidth,
} from '../main';
import AntRayCasts from './AntRayCasts';
import { circle } from './Shapes';
import { Vector } from './Vector';
import WorldGrid from './WorldGrid';

interface ColonyOptions {
	id: number;
	pos: {
		x: number;
		y: number;
	};
	colonyColor?: number[];
}

export default class Colony {
	id: number;
	x: number;
	y: number;
	startingAntsCount: number;
	maxAntsCount: number;
	ants: AntRayCasts[];
	totalAnts: number;
	colonyColor: number[];
	antIcon: HTMLImageElement | null;
	antImageInstance: HTMLCanvasElement | null;
	antFoodImageInstance: HTMLCanvasElement | null;
	antId: number;
	isRunning: boolean;
	isDrawingAnts: boolean;
	isDebugMode: boolean;
	colonyClock: number;
	antsCtx: CanvasRenderingContext2D | null;
	selectedAnt: AntRayCasts | null;

	food: number;
	totalFood: number;
	maxFood: number;

	constructor(colonyOptions: ColonyOptions) {
		this.id = colonyOptions.id;
		this.x = colonyOptions.pos.x;
		this.y = colonyOptions.pos.y;
		this.startingAntsCount = ColonyOptions.COLONY_STARTING_ANTS;
		this.maxAntsCount = ColonyOptions.COLONY_MAX_ANTS;
		this.ants = [];
		this.totalAnts = 0;
		this.colonyColor = colonyOptions.colonyColor || [255, 255, 255];
		this.antIcon = null;
		this.antImageInstance = null;
		this.antFoodImageInstance = null;
		this.antId = 0;
		this.isRunning = false;
		this.isDrawingAnts = false;
		this.isDebugMode = false;
		this.colonyClock = 0;
		this.antsCtx = null;
		this.selectedAnt = null;

		this.food = 0;
		this.totalFood = 0;
		this.maxFood = ColonyOptions.COLONY_MAX_FOOD;
	}

	initialize(
		antIcon: HTMLImageElement,
		antImageInstance: HTMLCanvasElement,
		antFoodImageInstance: HTMLCanvasElement,
		antsCtx: CanvasRenderingContext2D,
		worldGrid: WorldGrid,
	) {
		this.antIcon = antIcon;
		this.antImageInstance = antImageInstance;
		this.antFoodImageInstance = antFoodImageInstance;
		this.antsCtx = antsCtx;

		for (let i = 0; i < this.startingAntsCount; i++) {
			const ant = new AntRayCasts(
				antsCtx,
				antImageInstance,
				antFoodImageInstance,
				antIcon,
				{
					id: this.antId + 1,
					pos: {
						x: this.x,
						y: this.y,
					},
				},
			);
			this.ants.push(ant);
			this.antId++;
			this.totalAnts++;
		}

		this.drawAndFillMidpointCircle(
			worldGrid,
			this.x,
			this.y,
			ColonyOptions.COLONY_RADIUS,
		);
	}

	reset(worldGrid: WorldGrid) {
		if (
			!this.antsCtx ||
			!this.antImageInstance ||
			!this.antFoodImageInstance ||
			!this.antIcon
		) {
			return;
		}

		this.ants = [];
		this.antId = 0;
		this.totalAnts = 0;
		this.colonyClock = 0;
		this.food = 0;
		this.totalFood = 0;

		for (let i = 0; i < this.startingAntsCount; i++) {
			const ant = new AntRayCasts(
				this.antsCtx,
				this.antImageInstance,
				this.antFoodImageInstance,
				this.antIcon,
				{
					id: this.antId + 1,
					pos: {
						x: this.x,
						y: this.y,
					},
				},
			);
			this.ants.push(ant);
			this.antId++;
			this.totalAnts++;
		}

		this.drawAndFillMidpointCircle(
			worldGrid,
			this.x,
			this.y,
			ColonyOptions.COLONY_RADIUS,
		);
	}

	drawMidpointCircle(
		worldGrid: WorldGrid,
		centerX: number,
		centerY: number,
		radius: number,
	) {
		let x = radius;
		let y = 0;
		let p = 1 - radius;

		this.drawSymmetricPoints(worldGrid, centerX, centerY, x, y);

		if (radius > 0) {
			while (x > y) {
				y++;

				if (p <= 0) {
					p = p + 2 * y + 1;
				} else {
					x--;
					p = p + 2 * y - 2 * x + 1;
				}

				this.drawSymmetricPoints(worldGrid, centerX, centerY, x, y);
			}
		}
	}

	drawSymmetricPoints(
		worldGrid: WorldGrid,
		cx: number,
		cy: number,
		x: number,
		y: number,
	) {
		x *= MarkerOptions.SIZE;
		y *= MarkerOptions.SIZE;

		const q1 = worldGrid.getCellFromCoordsSafe(cx + x, cy + y);
		if (q1) {
			q1.colony = true;
		}
		const q2 = worldGrid.getCellFromCoordsSafe(cx - x, cy + y);
		if (q2) {
			q2.colony = true;
		}
		const q3 = worldGrid.getCellFromCoordsSafe(cx + x, cy - y);
		if (q3) {
			q3.colony = true;
		}
		const q4 = worldGrid.getCellFromCoordsSafe(cx - x, cy - y);
		if (q4) {
			q4.colony = true;
		}
		const q5 = worldGrid.getCellFromCoordsSafe(cx + y, cy + x);
		if (q5) {
			q5.colony = true;
		}
		const q6 = worldGrid.getCellFromCoordsSafe(cx - y, cy + x);
		if (q6) {
			q6.colony = true;
		}
		const q7 = worldGrid.getCellFromCoordsSafe(cx + y, cy - x);
		if (q7) {
			q7.colony = true;
		}
		const q8 = worldGrid.getCellFromCoordsSafe(cx - y, cy - x);
		if (q8) {
			q8.colony = true;
		}
	}

	drawAndFillMidpointCircle(
		worldGrid: WorldGrid,
		centerX: number,
		centerY: number,
		radius: number,
	) {
		let x = radius;
		let y = 0;
		let p = 1 - radius;

		this.drawAndFillSymmetricLines(worldGrid, centerX, centerY, x, y);

		if (radius > 0) {
			while (x > y) {
				y++;

				if (p <= 0) {
					p = p + 2 * y + 1;
				} else {
					x--;
					p = p + 2 * y - 2 * x + 1;
				}

				this.drawAndFillSymmetricLines(worldGrid, centerX, centerY, x, y);
			}
		}
	}

	drawAndFillSymmetricLines(
		worldGrid: WorldGrid,
		cx: number,
		cy: number,
		x: number,
		y: number,
	) {
		x *= MarkerOptions.SIZE;
		y *= MarkerOptions.SIZE;
		this.drawHorizontalLine(worldGrid, cx - x, cx + x, cy + y);
		this.drawHorizontalLine(worldGrid, cx - x, cx + x, cy - y);
		this.drawHorizontalLine(worldGrid, cx - y, cx + y, cy + x);
		this.drawHorizontalLine(worldGrid, cx - y, cx + y, cy - x);
	}

	drawHorizontalLine(
		worldGrid: WorldGrid,
		xStart: number,
		xEnd: number,
		y: number,
	) {
		for (let x = xStart; x <= xEnd; x++) {
			const cell = worldGrid.getCellFromCoordsSafe(x, y);
			if (cell) {
				cell.colony = true;
			}
		}
	}

	updateAndDrawAnts(worldGrid: WorldGrid, dt: number, draw = true) {
		let removeAnt = false;
		for (let i = 0; i < this.ants.length; i++) {
			if (this.isRunning) {
				// Update ants
				this.ants[i].find(worldGrid);
				this.ants[i].update(worldGrid, dt, this);
				this.ants[i].addMarker(worldGrid, dt);

				// Mark ant for deletion
				if (this.ants[i].isDead) {
					removeAnt = true;
				}
			}

			// Draw ants
			let isVisible = false;

			if (draw) {
				const padding = {
					x: AntOptions.IMG_HEIGHT * canvasScale,
					y: AntOptions.IMG_HEIGHT * canvasScale,
				};

				const width = (windowWidth + padding.x) / canvasScale;
				const height = (windowHeight - offsetY + padding.y) / canvasScale;

				const x = cameraCenter.x - width / 2;
				const y = cameraCenter.y - offsetY / 2 / canvasScale - height / 2;

				if (
					this.ants[i].pos.x >= x &&
					this.ants[i].pos.x <= x + width &&
					this.ants[i].pos.y >= y &&
					this.ants[i].pos.y <= y + height
				) {
					isVisible = true;
				}

				if (this.isDrawingAnts && isVisible) {
					this.ants[i].draw();
				}
			}

			// Remove ant
			if (removeAnt) {
				console.log('Removed ant: ', this.ants[i]);
				this.ants.splice(i, 1);
				removeAnt = false;
			}
		}
	}

	updateColony(dt: number) {
		if (!this.isRunning) return;

		this.colonyClock += dt;
		if (
			this.colonyClock >= ColonyOptions.ANT_CREATION_PERIOD &&
			this.ants.length < this.maxAntsCount &&
			this.useFood(ColonyOptions.ANT_COST)
		) {
			this.createAnt();
			this.colonyClock = 0;
		}
	}

	createAnt(override = false) {
		if (
			(this.ants.length < this.maxAntsCount || override) &&
			this.antIcon &&
			this.antImageInstance &&
			this.antFoodImageInstance &&
			this.antsCtx
		) {
			const ant = new AntRayCasts(
				this.antsCtx,
				this.antImageInstance,
				this.antFoodImageInstance,
				this.antIcon,
				{
					id: this.antId + 1,
					pos: {
						x: this.x,
						y: this.y,
					},
				},
			);
			this.ants.push(ant);
			this.antId++;
			this.totalAnts++;

			if (this.isDebugMode) {
				console.log('Created ant: ', ant);
			}
		} else {
			if (this.isDebugMode) {
				console.log("Can't create new ant - max count reached");
			}
		}
	}

	selectAnt(mouseVector: Vector) {
		if (this.ants.length <= 0) return null;

		let newAnt = null;
		let minDist = Infinity;
		const radius = AntOptions.IMG_HEIGHT / 2;

		// Get ant in mouse radius
		for (const ant of this.ants) {
			const dist = ant.pos.dist(mouseVector);
			if (dist < minDist && dist < radius) {
				minDist = dist;
				newAnt = ant;
			}
		}

		this.selectedAnt = newAnt;
		return newAnt;
	}

	removeAnt() {
		if (this.selectedAnt == null || this.ants.length <= 0) {
			return false;
		}

		const index = this.ants.findIndex((ant) => ant.id === this.selectedAnt?.id);
		if (index != -1) {
			this.ants.splice(index, 1);
			this.selectedAnt = null;
			return true;
		} else {
			return false;
		}
	}

	toggleAntDebug() {
		if (this.ants.length > 0) {
			for (const ant of this.ants) {
				if (this.selectedAnt && ant.id === this.selectedAnt.id) {
					ant.debug = this.isDebugMode;
				} else {
					ant.debug = false;
				}
			}
		}
	}

	drawColony(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = `rgb(${this.colonyColor[0]}, ${this.colonyColor[1]}, ${this.colonyColor[2]})`;
		circle(
			ctx,
			this.x,
			this.y,
			ColonyOptions.COLONY_RADIUS * MarkerOptions.SIZE + MarkerOptions.SIZE / 2,
		);
	}

	addFood(quantity: number) {
		this.food = Math.min(this.food + quantity, this.maxFood);
		this.totalFood += quantity;
	}

	useFood(quantity: number) {
		if (this.food >= quantity) {
			this.food -= quantity;
			return true;
		}
		return false;
	}
}
