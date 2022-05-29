import { AntOptions, ColonyOptions } from '../constants';
import Ant from './Ant';
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
	ants: Ant[];
	totalAnts: number;
	colonyColor: number[];
	antIcon: HTMLImageElement | null;
	antId: number;
	isRunning: boolean;
	isDrawingAnts: boolean;
	isDebugMode: boolean;
	colonyClock: number;
	antCtx: CanvasRenderingContext2D | null;
	selectedAnt: Ant | null;

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
		this.antId = 0;
		this.isRunning = false;
		this.isDrawingAnts = true;
		this.isDebugMode = false;
		this.colonyClock = 0;
		this.antCtx = null;
		this.selectedAnt = null;

		this.food = 0;
		this.totalFood = 0;
		this.maxFood = ColonyOptions.COLONY_MAX_FOOD;
	}

	initialize(antIcon: HTMLImageElement, antCtx: CanvasRenderingContext2D) {
		this.antIcon = antIcon;
		this.antCtx = antCtx;

		for (let i = 0; i < this.startingAntsCount; i++) {
			let ant = new Ant(this.antCtx, antIcon, {
				id: this.antId + 1,
				pos: {
					x: this.x,
					y: this.y,
				},
			});
			this.ants.push(ant);
			this.antId++;
			this.totalAnts++;
		}
	}

	updateAndDrawAnts(
		worldGrid: WorldGrid,
		selectedId: number | undefined,
		dt: number,
	) {
		let selectedAnt = null;
		let removeAnt = false;
		for (let i = 0; i < this.ants.length; i++) {
			if (this.isRunning) {
				// Update ants
				this.ants[i].search(worldGrid, this, dt);
				this.ants[i].update(dt);
				this.ants[i].addMarker(worldGrid, dt);
				this.ants[i].checkColony(this);

				// Mark ant for deletion
				if (this.ants[i].isDead) {
					removeAnt = true;
				}
			}

			// Draw ants
			if (this.isDrawingAnts) {
				this.ants[i].draw();
			}

			// Get selected ant
			if (selectedId && this.ants[i].id === selectedId) {
				selectedAnt = this.ants[i];
			}

			// Remove ant
			if (removeAnt) {
				console.log('Removed ant: ', this.ants[i]);
				this.ants.splice(i, 1);
				removeAnt = false;
			}
		}
		return selectedAnt;
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

	createAnt() {
		if (this.ants.length < this.maxAntsCount && this.antIcon && this.antCtx) {
			let ant = new Ant(this.antCtx, this.antIcon, {
				id: this.antId + 1,
				pos: {
					x: this.x,
					y: this.y,
				},
			});
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
		let radius = AntOptions.IMG_HEIGHT / 2;

		// Get ant in mouse radius
		for (const ant of this.ants) {
			let dist = ant.pos.dist(mouseVector);
			if (dist < minDist && dist < radius) {
				minDist = dist;
				newAnt = ant;
			}
		}

		console.log(newAnt);
		this.selectedAnt = newAnt;
		return newAnt;
	}

	removeAnt() {
		if (this.selectedAnt == null || this.ants.length <= 0) {
			return false;
		}

		let index = this.ants.findIndex((ant) => ant.id === this.selectedAnt!.id);
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
		circle(ctx, this.x, this.y, ColonyOptions.COLONY_RADIUS);
	}

	addFood(quantity: number) {
		this.food = Math.min(this.food + quantity, this.maxFood);
		this.totalFood++;
	}

	useFood(quantity: number) {
		if (this.food >= quantity) {
			this.food -= quantity;
			return true;
		}
		return false;
	}
}
