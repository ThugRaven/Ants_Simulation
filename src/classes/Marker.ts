import { EVAPORATE_AMOUNT, MarkerColors } from '../constants';
import { Vector } from './Vector';

export default class Marker {
	intensity: number[];

	constructor(intensity: number[]) {
		this.intensity = intensity;
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
		// Get default marker colors
		let toHomeColor = new Vector().set(MarkerColors.TO_HOME.slice());
		let toFoodColor = new Vector().set(MarkerColors.TO_FOOD.slice());
		// Multiply colors by intensity
		let toHomeIntensity = toHomeColor.mult(this.intensity[0]);
		let toFoodIntensity = toFoodColor.mult(this.intensity[1]);

		// Mix different marker types colors, red + green = yellow
		let mixedColor = toHomeIntensity.add(toFoodIntensity);
		mixedColor = new Vector().set(
			Math.round(Math.min(mixedColor.x, 255)),
			Math.round(Math.min(mixedColor.y, 255)),
			Math.round(Math.min(mixedColor.z, 255)),
		);

		// this.ctx.fillStyle = `hsl(${hue}, 100%, 50%, ${this.intensity})`;
		ctx.fillStyle = `rgb(${mixedColor.x}, ${mixedColor.y}, ${mixedColor.z})`;
		ctx.fillRect(x, y, 1, 1);
	}

	getMixedColor() {
		// Get default marker colors
		let [rH, gH, bH] = MarkerColors.TO_HOME;
		let [rF, gF, bF] = MarkerColors.TO_FOOD;
		// Multiply colors by intensity
		let toHomeIntensity = [
			this.intensity[0] * rH,
			this.intensity[0] * gH,
			this.intensity[0] * bH,
		];
		let toFoodIntensity = [
			this.intensity[1] * rF,
			this.intensity[1] * gF,
			this.intensity[1] * bF,
		];

		// Mix different marker types colors, red + green = yellow
		let mixedColor = [
			toHomeIntensity[0] + toFoodIntensity[0],
			toHomeIntensity[1] + toFoodIntensity[1],
			toHomeIntensity[2] + toFoodIntensity[2],
		];
		mixedColor = [
			Math.round(Math.min(mixedColor[0], 255)),
			Math.round(Math.min(mixedColor[1], 255)),
			Math.round(Math.min(mixedColor[2], 255)),
		];

		return mixedColor;
	}

	update() {
		if (this.intensity[0] > 0.01) {
			this.intensity[0] -= EVAPORATE_AMOUNT;
		} else this.intensity[0] = 0;

		if (this.intensity[1] > 0.01) {
			this.intensity[1] -= EVAPORATE_AMOUNT;
		} else this.intensity[1] = 0;
	}
}