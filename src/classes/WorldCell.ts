import { AntStates } from '../constants';
import Food from './Food';
import Marker from './Marker';

export default class WorldCell {
	marker: Marker;
	food: Food;
	wall: number;
	density: [number, number, number];
	colony: boolean;
	dist: number;
	minIntensity: number;

	constructor() {
		this.marker = new Marker([0, 0]);
		this.food = new Food(0);
		this.wall = 0;
		this.density = [0, 0, 0];
		this.colony = false;
		this.dist = 0;
		this.minIntensity = 0.1;
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

	addDensity(withFood = false, refill = false) {
		if (!withFood && !refill) {
			this.density[0]++;
		} else if (!refill) {
			this.density[1]++;
		} else {
			this.density[2]++;
		}
	}

	getIntensity(antState: AntStates) {
		return Math.max(
			this.minIntensity,
			antState === AntStates.TO_FOOD
				? this.marker.getToFoodIntensity()
				: antState === AntStates.TO_HOME
				? this.marker.getToHomeIntensity()
				: Math.max(
						this.marker.getToFoodIntensity(),
						this.marker.getToHomeIntensity(),
				  ),
		);
	}
}
