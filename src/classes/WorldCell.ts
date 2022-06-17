import Food from './Food';
import Marker from './Marker';

export default class WorldCell {
	marker: Marker;
	food: Food;
	wall: number;
	density: number;
	colony: boolean;

	constructor() {
		this.marker = new Marker([0, 0]);
		this.food = new Food(0);
		this.wall = 0;
		this.density = 0;
		this.colony = false;
	}

	update() {
		this.marker.update();
	}

	pick() {
		return this.food.pick();
	}

	drawWall(ctx: CanvasRenderingContext2D, x: number, y: number) {
		ctx.fillRect(x, y, 1, 1);
	}

	addDensity() {
		this.density++;
	}
}
