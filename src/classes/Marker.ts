import { EVAPORATE_AMOUNT, MarkerColors } from '../constants';

export default class Marker {
	intensity: number[];

	constructor(intensity: number[]) {
		this.intensity = intensity;
	}

	getToHomeIntensity() {
		return this.intensity[0];
	}

	getToFoodIntensity() {
		return this.intensity[1];
	}

	getMixedColor() {
		if (this.intensity[0] === 0 && this.intensity[1] === 0) {
			return [0, 0, 0];
		}

		// Get default marker colors
		const [rH, gH, bH] = MarkerColors.TO_HOME;
		const [rF, gF, bF] = MarkerColors.TO_FOOD;

		// Multiply colors by intensity
		const toHomeIntensity = [
			this.intensity[0] * rH,
			this.intensity[0] * gH,
			this.intensity[0] * bH,
		];
		if (this.intensity[1] === 0) {
			return [
				Math.round(toHomeIntensity[0]),
				Math.round(toHomeIntensity[1]),
				Math.round(toHomeIntensity[2]),
			];
		}

		const toFoodIntensity = [
			this.intensity[1] * rF,
			this.intensity[1] * gF,
			this.intensity[1] * bF,
		];
		if (this.intensity[0] === 0) {
			return [
				Math.round(toFoodIntensity[0]),
				Math.round(toFoodIntensity[1]),
				Math.round(toFoodIntensity[2]),
			];
		}

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
