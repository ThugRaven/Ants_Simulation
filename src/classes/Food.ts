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

		ctx.fillStyle = `hsl(120, 40%, 43%, ${this.quantity / 100})`;
		circle(ctx, centerX, centerY, FoodOptions.SIZE / 2, true);
	}

	pick() {
		if (this.quantity === 0) {
			return 0;
		}

		let pickAmount = 0;
		if (this.quantity < FoodOptions.PICK_AMOUNT) {
			pickAmount = this.quantity;
		} else {
			pickAmount = FoodOptions.PICK_AMOUNT;
		}

		this.quantity = Math.max(this.quantity - FoodOptions.PICK_AMOUNT, 0);
		return pickAmount;
	}
}
