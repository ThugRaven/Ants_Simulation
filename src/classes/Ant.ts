import { AntOptions, AntStates } from '../constants';
import { createVector, Vector } from './Vector';

interface AntOptions {
	pos: {
		x: number;
		y: number;
	};
}

export default class Ant {
	ctx: CanvasRenderingContext2D;
	antIcon: HTMLImageElement;
	pos: Vector;
	vel: Vector;
	acc: Vector;
	maxSpeed: number;
	maxForce: number;
	state: number;

	constructor(
		ctx: CanvasRenderingContext2D,
		antIcon: HTMLImageElement,
		options: AntOptions,
	) {
		let horizontalCenter =
			(options.pos.x + options.pos.x + AntOptions.IMG_WIDTH) / 2;
		let verticalCenter =
			(options.pos.y + options.pos.y + AntOptions.IMG_HEIGHT) / 2;

		this.ctx = ctx;
		this.antIcon = antIcon;
		// this.pos = createVector(horizontalCenter, verticalCenter);
		this.pos = createVector(options.pos.x, options.pos.y);
		this.vel = createVector(0, 0);
		this.acc = createVector(0, 0);
		this.maxSpeed = 4;
		this.maxForce = 0.25;
		this.state = AntStates.TO_FOOD;
	}

	seek(target: Vector) {
		let force = target.sub(this.pos);
		force.setMag(this.maxSpeed);
		force.sub(this.vel);
		force.limit(this.maxForce);
		this.applyForce(force);
	}

	applyForce(force: Vector) {
		this.acc.add(force);
	}

	update() {
		this.vel.add(this.acc);
		this.vel.limit(this.maxSpeed);
		this.pos.add(this.vel);
		this.acc.set(0, 0);
	}

	draw() {
		let horizontalCenter = (this.pos.x + this.pos.x + AntOptions.IMG_WIDTH) / 2;
		let verticalCenter = (this.pos.y + this.pos.y + AntOptions.IMG_HEIGHT) / 2;

		this.ctx.save();
		this.ctx.translate(horizontalCenter, verticalCenter);
		// this.ctx.translate(this.pos.x, this.pos.y);
		this.ctx.rotate(this.vel.heading() + Math.PI / 2);
		this.ctx.translate(-horizontalCenter, -verticalCenter);

		this.ctx.drawImage(
			this.antIcon,
			this.pos.x,
			this.pos.y,
			AntOptions.IMG_WIDTH,
			AntOptions.IMG_HEIGHT,
		);

		this.ctx.restore();

		// this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}
}
