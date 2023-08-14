import { FoodOptions } from '../constants';
import { circle } from './Shapes';

export default class Food {
	quantity: number;
	changed: boolean;

	constructor(quantity: number) {
		this.quantity = quantity;
		this.changed = true;
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
		ctx.clearRect(
			x * FoodOptions.SIZE,
			y * FoodOptions.SIZE,
			FoodOptions.SIZE,
			FoodOptions.SIZE,
		);

		const centerX = x * FoodOptions.SIZE + FoodOptions.SIZE / 2;
		const centerY = y * FoodOptions.SIZE + FoodOptions.SIZE / 2;

		ctx.fillStyle = `hsl(120, 40%, 43%, ${this.quantity / 100})`;
		circle(ctx, centerX, centerY, FoodOptions.SIZE / 2, true);
		this.changed = false;
	}

	pick() {
		this.changed = true;
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
