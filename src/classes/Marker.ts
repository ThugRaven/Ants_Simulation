import { EVAPORATE_AMOUNT, MarkerTypes } from '../constants';

export default class Marker {
	ctx: CanvasRenderingContext2D;
	x: number;
	y: number;
	type: MarkerTypes;
	intensity: number;

	constructor(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		type: MarkerTypes,
		intensity: number,
	) {
		this.ctx = ctx;
		this.x = x;
		this.y = y;
		this.type = type;
		this.intensity = intensity;
	}

	draw() {
		let hue = 0;
		if (this.type === MarkerTypes.TO_HOME) {
			hue = 0;
		} else if (this.type === MarkerTypes.TO_FOOD) {
			hue = 110;
		} else if (this.type === MarkerTypes.NO_FOOD) {
			hue = 230;
		}

		// let width = 10;
		// let height = 10;
		// let i = this.x - width * 0.5;
		// let j = this.y - height * 0.5;
		// let gradient = this.ctx.createRadialGradient(
		// 	this.x,
		// 	this.y,
		// 	0,
		// 	this.x,
		// 	this.y,
		// 	15,
		// );
		// gradient.addColorStop(0, `hsl(${hue}, 100%, 50%, ${this.intensity})`);
		// gradient.addColorStop(1, 'black');
		// // this.ctx.fillStyle = `hsl(${hue}, 100%, 50%, ${this.intensity})`;
		// this.ctx.fillStyle = gradient;
		// this.ctx.fillRect(i, j, width, height);

		this.ctx.fillStyle = `hsl(${hue}, 100%, 50%, ${this.intensity})`;
		this.ctx.fillRect(this.x, this.y, 4, 4);
	}

	update() {
		// this.intensity = Math.max(0, this.intensity - EVAPORATE_AMOUNT);
		this.intensity = this.intensity < 0 ? 0 : this.intensity - EVAPORATE_AMOUNT;
		// this.intensity -= EVAPORATE_AMOUNT;
	}
}
