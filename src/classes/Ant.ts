import { AntOptions, AntStates } from '../constants';

interface AntOptions {
	pos: {
		x: number;
		y: number;
	};
	angle: number;
}

export default class Ant {
	ctx: CanvasRenderingContext2D;
	antIcon: HTMLImageElement;
	x: number;
	y: number;
	direction: number;
	state: number;

	constructor(
		ctx: CanvasRenderingContext2D,
		antIcon: HTMLImageElement,
		options: AntOptions,
	) {
		this.ctx = ctx;
		this.antIcon = antIcon;
		this.x = options.pos.x;
		this.y = options.pos.y;
		this.direction = options.angle;
		this.state = AntStates.TO_FOOD;
	}

	draw() {
		let horizontalCenter = (this.x + this.x + AntOptions.IMG_WIDTH) / 2;
		let verticalCenter = (this.y + this.y + AntOptions.IMG_HEIGHT) / 2;

		this.ctx.translate(horizontalCenter, verticalCenter);
		this.ctx.rotate(this.direction);
		this.ctx.translate(-horizontalCenter, -verticalCenter);

		this.ctx.drawImage(
			this.antIcon,
			this.x,
			this.y,
			AntOptions.IMG_WIDTH,
			AntOptions.IMG_HEIGHT,
		);

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}
}
