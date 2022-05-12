import { AntOptions, AntStates } from '../constants';
import { circle, line } from './Shapes';
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
		this.ctx = ctx;
		this.antIcon = antIcon;
		this.pos = createVector(options.pos.x, options.pos.y);
		this.vel = createVector(0, 0);
		this.acc = createVector(0, 0);
		this.maxSpeed = 4;
		this.maxForce = 0.25;
		this.state = AntStates.TO_FOOD;
	}

	seek(target: Vector) {
		line(this.ctx, target.x, target.y, this.pos.x, this.pos.y);
		let force = target.sub(this.pos);
		force.setMag(this.maxSpeed);
		force.sub(this.vel);
		force.limit(this.maxForce);
		this.ctx.strokeStyle = 'white';
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
		let antCenter = 0 - AntOptions.IMG_WIDTH / 2;

		this.ctx.fillStyle = 'white';
		circle(this.ctx, this.pos.x, this.pos.y, 3);

		this.ctx.save();
		this.ctx.translate(this.pos.x, this.pos.y);
		// this.ctx.translate(this.pos.x, this.pos.y);
		this.ctx.rotate(this.vel.heading() + Math.PI / 2);
		// this.ctx.rotate(this.vel.heading());
		// this.ctx.translate(-horizontalCenter, -verticalCenter);

		this.ctx.strokeStyle = '#FF0000';
		this.ctx.lineWidth = 2;
		this.ctx.strokeRect(
			antCenter,
			0,
			AntOptions.IMG_WIDTH,
			AntOptions.IMG_HEIGHT,
		);

		this.ctx.fillStyle = 'red';
		circle(this.ctx, antCenter, 0, 3);

		this.ctx.drawImage(
			this.antIcon,
			antCenter,
			0,
			AntOptions.IMG_WIDTH,
			AntOptions.IMG_HEIGHT,
		);

		this.ctx.restore();
	}
}
