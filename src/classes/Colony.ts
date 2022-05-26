import { ColonyOptions } from '../constants';
import Ant from './Ant';
import { circle } from './Shapes';
import { random, randomInt } from './Utils';

interface ColonyOptions {
	id: number;
	pos: {
		x: number;
		y: number;
	};
	antColor?: number[];
}

export default class Colony {
	id: number;
	x: number;
	y: number;
	maxAntsCount: number;
	ants: Ant[];
	antColor: number[];
	antIcon: HTMLImageElement | null;
	antId: number;

	food: number;
	maxFood: number;

	constructor(colonyOptions: ColonyOptions) {
		this.id = colonyOptions.id;
		this.x = colonyOptions.pos.x;
		this.y = colonyOptions.pos.y;
		this.maxAntsCount = ColonyOptions.COLONY_MAX_ANTS;
		this.ants = [];
		this.antColor = colonyOptions.antColor || [255, 255, 255];
		this.antIcon = null;
		this.antId = 0;

		this.food = 0;
		this.maxFood = 200;
	}

	initialize(
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
		antIcon: HTMLImageElement,
	) {
		for (let i = 0; i < this.maxAntsCount; i++) {
			let ant = new Ant(ctx, antIcon, {
				id: this.antId + 1,
				pos: {
					x: randomInt(0, width),
					y: random(0, height),
				},
			});
			this.ants.push(ant);
			this.antId++;
		}
	}

	drawColony(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = `rgb(${this.antColor[0]}, ${this.antColor[1]}, ${this.antColor[2]})`;
		circle(ctx, this.x, this.y, ColonyOptions.COLONY_RADIUS);
	}

	addFood(quantity: number) {
		this.food = Math.min(this.food + quantity, this.maxFood);
	}

	useFood(quantity: number) {
		if (this.food >= quantity) {
			this.food -= quantity;
		}
	}
}
