import { FoodOptions } from '../constants';
import { circle } from './Shapes';

export default class Food {
	quantity: number;

	constructor(quantity: number) {
		this.quantity = quantity;
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
		let centerX = x * FoodOptions.SIZE + FoodOptions.SIZE / 2;
		let centerY = y * FoodOptions.SIZE + FoodOptions.SIZE / 2;

		ctx.fillStyle = `hsl(54, 100%, 50%, ${this.quantity / 100})`;
		circle(ctx, centerX, centerY, FoodOptions.SIZE / 2, true);
	}

	pick() {
		this.quantity -= FoodOptions.PICK_AMOUNT;
	}
}
