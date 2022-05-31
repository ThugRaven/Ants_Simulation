import Food from './Food';
import Marker from './Marker';

export default class WorldCell {
	marker: Marker;
	food: Food;
	wall: number;

	constructor() {
		this.marker = new Marker([0, 0]);
		this.food = new Food(0);
		this.wall = 0;
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
}
