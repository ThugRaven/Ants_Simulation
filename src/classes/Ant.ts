import { AntOptions, AntStates, MarkerOptions } from '../constants';
import { circle, line } from './Shapes';
import { random } from './Utils';
import { createVector, Vector } from './Vector';
import WorldGrid from './WorldGrid';

interface AntOptions {
	id: number;
	pos: {
		x: number;
		y: number;
	};
	debug?: boolean;
}

export default class Ant {
	ctx: CanvasRenderingContext2D;
	antIcon: HTMLImageElement;
	id: number;
	pos: Vector;
	vel: Vector;
	acc: Vector;
	maxSpeed: number;
	maxForce: number;
	state: number;
	debug: boolean;
	wanderTheta: number;
	perceptionDraw: Set<number>;

	constructor(
		ctx: CanvasRenderingContext2D,
		antIcon: HTMLImageElement,
		options: AntOptions,
	) {
		this.ctx = ctx;
		this.antIcon = antIcon;
		this.id = options.id;
		this.pos = createVector(options.pos.x, options.pos.y);
		this.vel = createVector(0, 0);
		this.acc = createVector(0, 0);
		this.maxSpeed = 4;
		this.maxForce = 0.25;
		this.state = AntStates.TO_FOOD;
		this.debug = options.debug || false;
		this.wanderTheta = random(0, Math.PI * 2);
		this.perceptionDraw = new Set();
	}

	seek(target: Vector) {
		if (this.debug) {
			this.ctx.strokeStyle = 'white';
			line(this.ctx, target.x, target.y, this.pos.x, this.pos.y);
		}

		let force = target.copy().sub(this.pos);
		force.setMag(this.maxSpeed);
		force.sub(this.vel);
		force.limit(this.maxForce);
		this.applyForce(force);
	}

	wander() {
		let wanderPoint = this.vel.copy();
		wanderPoint.setMag(AntOptions.WANDER_POINT_MAGNITUDE);
		wanderPoint.add(this.pos);

		let wanderRadius = AntOptions.WANDER_POINT_RADIUS;

		if (this.debug) {
			this.ctx.fillStyle = 'red';
			circle(this.ctx, wanderPoint.x, wanderPoint.y, 4);

			this.ctx.strokeStyle = 'white';
			circle(this.ctx, wanderPoint.x, wanderPoint.y, wanderRadius, false, true);

			line(this.ctx, this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
		}

		let theta = this.wanderTheta + this.vel.heading();
		let x = wanderRadius * Math.cos(theta);
		let y = wanderRadius * Math.sin(theta);
		wanderPoint.add(x, y);
		this.ctx.fillStyle = 'green';

		if (this.debug) {
			circle(this.ctx, wanderPoint.x, wanderPoint.y, 8);
			line(this.ctx, this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
		}

		let steer = wanderPoint.sub(this.pos);
		steer.setMag(this.maxForce);
		this.applyForce(steer);

		let displaceRange = AntOptions.WANDER_DISPLACE_RANGE;
		this.wanderTheta += random(-displaceRange, displaceRange);
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
		this.ctx.save();
		this.ctx.translate(this.pos.x, this.pos.y);
		this.ctx.rotate(this.vel.heading() + Math.PI / 2);

		let horizontalOffset = -AntOptions.IMG_WIDTH / 2;
		let verticalOffset = -AntOptions.IMG_HEIGHT / 2;

		this.ctx.drawImage(
			this.antIcon,
			horizontalOffset,
			verticalOffset,
			AntOptions.IMG_WIDTH,
			AntOptions.IMG_HEIGHT,
		);

		if (this.debug) {
			this.ctx.strokeStyle = '#FF0000';
			this.ctx.lineWidth = 2;
			this.ctx.strokeRect(
				horizontalOffset,
				verticalOffset,
				AntOptions.IMG_WIDTH,
				AntOptions.IMG_HEIGHT,
			);

			this.ctx.fillStyle = 'red';
			circle(this.ctx, 0, 0, 4);

			// FOV
			this.ctx.beginPath();
			this.ctx.arc(
				0,
				0,
				AntOptions.PERCEPTION_RADIUS,
				AntOptions.PERCEPTION_START_ANGLE,
				AntOptions.PERCEPTION_END_ANGLE,
			);
			this.ctx.stroke();
			this.ctx.strokeStyle = 'white';
			this.ctx.beginPath();
			this.ctx.arc(
				0,
				0,
				AntOptions.PERCEPTION_RADIUS,
				AntOptions.PERCEPTION_END_ANGLE,
				AntOptions.PERCEPTION_START_ANGLE,
			);
			this.ctx.stroke();
			let thetaLeft = AntOptions.PERCEPTION_START_ANGLE;
			let thetaRight = AntOptions.PERCEPTION_END_ANGLE;
			let xLeft = AntOptions.PERCEPTION_RADIUS * Math.cos(thetaLeft);
			let yLeft = AntOptions.PERCEPTION_RADIUS * Math.sin(thetaLeft);
			let xRight = AntOptions.PERCEPTION_RADIUS * Math.cos(thetaRight);
			let yRight = AntOptions.PERCEPTION_RADIUS * Math.sin(thetaRight);
			this.ctx.strokeStyle = 'red';
			line(this.ctx, 0, 0, xLeft, yLeft);
			line(this.ctx, 0, 0, xRight, yRight);
			// Calculate perception points and draw them
			let angleBetween =
				(AntOptions.PERCEPTION_END_ANGLE - AntOptions.PERCEPTION_START_ANGLE) /
				(AntOptions.PERCEPTION_POINTS_HORIZONTAL - 1);
			let distanceBetween =
				AntOptions.PERCEPTION_RADIUS / AntOptions.PERCEPTION_POINTS_VERTICAL;

			for (let x = 1; x <= AntOptions.PERCEPTION_POINTS_VERTICAL; x++) {
				for (let y = 0; y < AntOptions.PERCEPTION_POINTS_HORIZONTAL; y++) {
					let theta = angleBetween * y + AntOptions.PERCEPTION_START_ANGLE;

					let perceptionX = distanceBetween * x * Math.cos(theta);
					let perceptionY = distanceBetween * x * Math.sin(theta);

					if (
						this.perceptionDraw.has(
							x * AntOptions.PERCEPTION_POINTS_VERTICAL + y,
						)
					) {
						this.ctx.strokeStyle = 'white';
						this.ctx.fillStyle = 'white';
					} else {
						this.ctx.strokeStyle = 'red';
						this.ctx.fillStyle = 'green';
					}

					circle(this.ctx, perceptionX, perceptionY, 4);
					if (x === AntOptions.PERCEPTION_POINTS_VERTICAL) {
						line(this.ctx, 0, 0, perceptionX, perceptionY);
					}
				}
			}
		}

		this.ctx.restore();

		if (this.debug) {
			this.ctx.fillStyle = 'white';
			circle(this.ctx, this.pos.x, this.pos.y, 3);
		}
	}

	search(worldGrid: WorldGrid) {
		if (this.debug) {
			this.perceptionDraw = new Set();
		}

		if (
			// worldGrid.isOnFood(
			// 	Math.floor(this.pos.x / MarkerOptions.SIZE),
			// 	Math.floor(this.pos.y / MarkerOptions.SIZE),
			// )
			true
		) {
		}

		let foundFood = false;
		let angleBetween =
			(AntOptions.PERCEPTION_END_ANGLE - AntOptions.PERCEPTION_START_ANGLE) /
			(AntOptions.PERCEPTION_POINTS_HORIZONTAL - 1);
		let distanceBetween =
			AntOptions.PERCEPTION_RADIUS / AntOptions.PERCEPTION_POINTS_VERTICAL;

		for (let x = 1; x <= AntOptions.PERCEPTION_POINTS_VERTICAL; x++) {
			for (let y = 0; y < AntOptions.PERCEPTION_POINTS_HORIZONTAL; y++) {
				let theta = angleBetween * y + AntOptions.PERCEPTION_START_ANGLE;

				let perceptionX = distanceBetween * x * Math.cos(theta);
				let perceptionY = distanceBetween * x * Math.sin(theta);
				let perceptionPoint = this.pos.copy().add(perceptionX, perceptionY);

				let cell = worldGrid.getCellFromCoordsSafe(
					perceptionPoint.x,
					perceptionPoint.y,
				);

				if (cell) {
					if (cell.food.quantity > 0) {
						if (this.debug) {
							this.perceptionDraw.add(
								x * AntOptions.PERCEPTION_POINTS_VERTICAL + y,
							);
						}

						foundFood = true;
						this.seek(perceptionPoint);
						break;
					}
				}
			}
		}

		if (!foundFood) {
			this.wander();
		}
	}
}