import { FoodOptions } from '../constants';
import { circle } from './Shapes';

export default class Food {
	ctx: CanvasRenderingContext2D;
	x: number;
	y: number;
	centerX: number;
	centerY: number;
	quantity: number;

	constructor(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		quantity: number,
	) {
		this.ctx = ctx;
		this.x = x;
		this.y = y;
		this.centerX = x + FoodOptions.SIZE / 2;
		this.centerY = y + FoodOptions.SIZE / 2;
		this.quantity = quantity;
	}

	draw() {
		this.ctx.fillStyle = `hsl(54, 100%, 50%, ${this.quantity / 100})`;
		this.ctx.strokeStyle = `hsl(54, 100%, 50%, ${this.quantity / 100})`;
		// this.ctx.fillRect(this.x, this.y, FoodOptions.SIZE, FoodOptions.SIZE);

		circle(
			this.ctx,
			this.centerX,
			this.centerY,
			(FoodOptions.SIZE - 1) / 2,
			true,
			true,
		);
	}

	pick() {
		this.quantity -= FoodOptions.PICK_AMOUNT;
	}
}
