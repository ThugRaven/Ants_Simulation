import {
	AntOptions,
	AntStates,
	ColonyOptions,
	FoodOptions,
	MarkerTypes,
} from '../constants';
import Colony from './Colony';
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
	internalClock: number;
	markerClock: number;
	isDead: boolean;

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
		this.maxSpeed = 4 * 85;
		this.maxForce = 0.25 * 85;
		this.state = AntStates.TO_FOOD;
		this.debug = options.debug || false;
		this.wanderTheta = random(0, Math.PI * 2);
		this.perceptionDraw = new Set();
		this.internalClock = 0;
		this.markerClock = random(0, AntOptions.MARKER_PERIOD);
		this.isDead = false;
	}

	seek(target: Vector, dt: number) {
		if (this.debug) {
			this.ctx.strokeStyle = 'white';
			line(this.ctx, target.x, target.y, this.pos.x, this.pos.y);
		}

		let force = target.copy().sub(this.pos);
		force.setMag(this.maxSpeed * dt);
		force.sub(this.vel);
		force.limit(this.maxForce * dt);
		this.applyForce(force);
	}

	wander(dt: number) {
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
		steer.setMag(this.maxForce * dt);
		this.applyForce(steer);

		let displaceRange = AntOptions.WANDER_DISPLACE_RANGE;
		this.wanderTheta += random(-displaceRange, displaceRange);
	}

	applyForce(force: Vector) {
		this.acc.add(force);
	}

	update(dt: number) {
		this.internalClock += dt;
		if (
			this.internalClock >= AntOptions.AUTONOMY_REFILL &&
			this.state === AntStates.TO_FOOD
		) {
			this.state = AntStates.REFILL;
		}

		if (this.internalClock >= AntOptions.AUTONOMY_MAX) {
			this.isDead = true;
		}

		this.vel.add(this.acc);
		this.vel.limit(this.maxSpeed * dt);
		this.pos.add(this.vel);
		this.acc.set(0, 0);
	}

	draw() {
		this.ctx.save();
		this.ctx.translate(this.pos.x, this.pos.y);
		this.ctx.rotate(this.vel.heading() + Math.PI / 2);

		let horizontalOffset = -AntOptions.IMG_WIDTH / 2;
		let verticalOffset = -AntOptions.IMG_HEIGHT / 2;

		// Draw food
		if (this.state === AntStates.TO_HOME) {
			this.ctx.fillStyle = 'green';
			circle(this.ctx, 0, verticalOffset, 10);
		}

		// Draw ant
		this.ctx.drawImage(
			this.antIcon,
			horizontalOffset,
			verticalOffset,
			AntOptions.IMG_WIDTH,
			AntOptions.IMG_HEIGHT,
		);

		// Draw debug shapes
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

	search(worldGrid: WorldGrid, colony: Colony, dt: number) {
		if (this.debug) {
			this.perceptionDraw = new Set();
		}

		let foundFood = false;

		// if (this.state === AntStates.TO_HOME) {
		// 	this.wander();
		// 	return;
		// }

		let cell = worldGrid.getCellFromCoordsSafe(this.pos.x, this.pos.y);
		if (cell && cell.food.quantity > 0 && this.state === AntStates.TO_FOOD) {
			this.state = AntStates.TO_HOME;
			worldGrid.getCellFromCoordsSafe(this.pos.x, this.pos.y)?.pick();
			this.vel.setHeading(this.vel.heading() + Math.PI);
			this.internalClock = 0;
			return;
		}

		let angleBetween =
			(AntOptions.PERCEPTION_END_ANGLE - AntOptions.PERCEPTION_START_ANGLE) /
			(AntOptions.PERCEPTION_POINTS_HORIZONTAL - 1);
		let distanceBetween =
			AntOptions.PERCEPTION_RADIUS / AntOptions.PERCEPTION_POINTS_VERTICAL;

		let maxIntensity = 0;
		let maxIntensityPoint: Vector | null = null;
		let angle = this.vel.heading();
		let colonyPos = createVector(colony.x, colony.y);

		for (let x = 1; x <= AntOptions.PERCEPTION_POINTS_VERTICAL; x++) {
			for (let y = 0; y < AntOptions.PERCEPTION_POINTS_HORIZONTAL; y++) {
				let theta =
					angleBetween * y +
					AntOptions.PERCEPTION_START_ANGLE +
					angle +
					Math.PI / 2;

				let perceptionX = distanceBetween * x * Math.cos(theta);
				let perceptionY = distanceBetween * x * Math.sin(theta);
				let perceptionPoint = this.pos.copy().add(perceptionX, perceptionY);

				let cellPerception = worldGrid.getCellFromCoordsSafe(
					perceptionPoint.x,
					perceptionPoint.y,
				);

				if (cellPerception) {
					// Check for colony
					if (
						perceptionPoint.dist(colonyPos) <= ColonyOptions.COLONY_RADIUS &&
						(this.state === AntStates.REFILL ||
							this.state === AntStates.TO_HOME)
					) {
						this.seek(perceptionPoint, dt);
						return;
					}

					// Check for food
					if (
						cellPerception.food.quantity > 0 &&
						this.state === AntStates.TO_FOOD
					) {
						if (this.debug) {
							this.perceptionDraw.add(
								x * AntOptions.PERCEPTION_POINTS_VERTICAL + y,
							);
						}

						foundFood = true;
						this.seek(perceptionPoint, dt);
						return;
					}

					// Check for highest intensity marker
					let intensity = 0;
					if (
						this.state === AntStates.TO_HOME ||
						this.state === AntStates.REFILL
					) {
						intensity = cellPerception.marker.intensity[0];
					} else if (this.state === AntStates.TO_FOOD) {
						intensity = cellPerception.marker.intensity[1];
					}

					if (intensity > maxIntensity) {
						maxIntensity = intensity;
						maxIntensityPoint = perceptionPoint;
					}

					// Check for walls
					if (cellPerception.wall === 1) {
						let dist = perceptionPoint.dist(this.pos);

						if (dist <= distanceBetween + 10) {
							let force = perceptionPoint.sub(this.pos);

							force.setMag(this.maxSpeed * dt);
							force.sub(this.vel);
							// force.limit(this.maxForce * dt);
							force.mult(-1);
							this.applyForce(force);
						}
					}
				}
			}
		}

		if (maxIntensityPoint) {
			this.seek(maxIntensityPoint, dt);
			return;
		}

		if (!foundFood) {
			this.wander(dt);
		}
	}

	checkColony(colony: Colony) {
		let colonyPos = createVector(colony.x, colony.y);
		if (
			this.pos.dist(colonyPos) <= ColonyOptions.COLONY_RADIUS &&
			(this.state === AntStates.REFILL || this.state === AntStates.TO_HOME)
		) {
			if (this.state === AntStates.TO_HOME) {
				this.vel.setHeading(this.vel.heading() + Math.PI);
			}
			this.state = AntStates.TO_FOOD;
			colony.addFood(FoodOptions.PICK_AMOUNT);
			this.internalClock = 0;
		}
	}

	addMarker(worldGrid: WorldGrid, dt: number) {
		this.markerClock += dt;
		if (this.markerClock >= AntOptions.MARKER_PERIOD) {
			let [x, y] = worldGrid.getCellCoords(this.pos.x, this.pos.y);
			if (!worldGrid.checkCoords(x, y)) return;

			let intensity =
				AntOptions.MARKER_DEFAULT_INTENSITY *
				Math.exp(-0.05 * this.internalClock);

			let state = -1;
			switch (this.state) {
				case AntStates.TO_HOME:
					state = MarkerTypes.TO_FOOD;
					break;
				case AntStates.TO_FOOD:
					state = MarkerTypes.TO_HOME;
					break;
				case AntStates.REFILL:
					state = MarkerTypes.TO_HOME;
					break;
				default:
					break;
			}

			worldGrid.addMarker(x, y, state, intensity);
			this.markerClock = 0;
		}
	}
}
