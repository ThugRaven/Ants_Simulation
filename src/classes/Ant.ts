import {
	AntOptions,
	AntStates,
	ColonyOptions,
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
	antImageInstance: HTMLCanvasElement;
	antFoodImageInstance: HTMLCanvasElement;
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
	freedomCoef: number;
	foodAmount: number;
	maxAutonomy: number;

	constructor(
		ctx: CanvasRenderingContext2D,
		antImageInstance: HTMLCanvasElement,
		antFoodImageInstance: HTMLCanvasElement,
		antIcon: HTMLImageElement,
		options: AntOptions,
	) {
		this.ctx = ctx;
		this.antImageInstance = antImageInstance;
		this.antFoodImageInstance = antFoodImageInstance;
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
		this.internalClock = 0;
		this.markerClock = random(0, AntOptions.MARKER_PERIOD);
		this.isDead = false;
		this.freedomCoef = random(0.01, 0.1);
		this.foodAmount = 0;
		this.maxAutonomy = AntOptions.AUTONOMY_MAX - random(0, 50);
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
		steer.limit(this.maxForce);
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

		if (this.internalClock >= this.maxAutonomy) {
			this.isDead = true;
		}

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

		// Draw food
		if (this.state === AntStates.TO_HOME) {
			this.ctx.drawImage(
				this.antFoodImageInstance,
				-AntOptions.FOOD_SIZE / 2,
				verticalOffset - AntOptions.FOOD_SIZE / 2,
			);
		}

		// Draw ant
		// this.ctx.drawImage(
		// 	this.antIcon,
		// 	horizontalOffset,
		// 	verticalOffset,
		// 	AntOptions.IMG_WIDTH,
		// 	AntOptions.IMG_HEIGHT,
		// );
		this.ctx.drawImage(this.antImageInstance, horizontalOffset, verticalOffset);

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

			for (let x = 0; x < AntOptions.PERCEPTION_POINTS_HORIZONTAL; x++) {
				for (let y = 1; y <= AntOptions.PERCEPTION_POINTS_VERTICAL; y++) {
					let theta = angleBetween * x + AntOptions.PERCEPTION_START_ANGLE;

					let perceptionX = distanceBetween * y * Math.cos(theta);
					let perceptionY = distanceBetween * y * Math.sin(theta);

					if (
						this.perceptionDraw.has(
							y * AntOptions.PERCEPTION_POINTS_VERTICAL + x,
						)
					) {
						this.ctx.strokeStyle = 'white';
						this.ctx.fillStyle = 'white';
					} else {
						this.ctx.strokeStyle = 'red';
						this.ctx.fillStyle = 'green';
					}

					circle(this.ctx, perceptionX, perceptionY, 4);
					if (y === AntOptions.PERCEPTION_POINTS_VERTICAL) {
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

	search(worldGrid: WorldGrid, colony: Colony) {
		if (this.debug) {
			this.perceptionDraw = new Set();
		}

		let posAhead = this.vel.copy();
		posAhead.setMag(AntOptions.IMG_HEIGHT / 2);
		posAhead.add(this.pos);
		let cellAhead = worldGrid.getCellFromCoordsSafe(posAhead.x, posAhead.y);
		let cell = worldGrid.getCellFromCoordsSafe(this.pos.x, this.pos.y);
		cell?.addDensity();
		if (
			cellAhead &&
			cellAhead.food.quantity > 0 &&
			(this.state === AntStates.TO_FOOD || this.state === AntStates.REFILL)
		) {
			this.state = AntStates.TO_HOME;
			this.foodAmount = cellAhead.pick();
			this.vel.setHeading(this.vel.heading() + Math.PI);
			this.internalClock = 0;
			return;
		}

		if (
			cell &&
			cell.colony &&
			(this.state === AntStates.REFILL || this.state === AntStates.TO_HOME)
		) {
			if (this.state === AntStates.TO_HOME) {
				this.vel.setHeading(this.vel.heading() + Math.PI);
				colony.addFood(this.foodAmount);
			}
			if (
				this.state === AntStates.REFILL &&
				!colony.useFood(ColonyOptions.ANT_REFILL_FOOD_AMOUNT)
			) {
				return;
			}
			this.state = AntStates.TO_FOOD;
			this.internalClock = 0;
			return;
		}

		if (Math.random() < this.freedomCoef) {
			return;
		}

		let angleBetween =
			(AntOptions.PERCEPTION_END_ANGLE - AntOptions.PERCEPTION_START_ANGLE) /
			(AntOptions.PERCEPTION_POINTS_HORIZONTAL - 1);
		let distanceBetween =
			AntOptions.PERCEPTION_RADIUS / AntOptions.PERCEPTION_POINTS_VERTICAL;

		let closestIndex = AntOptions.PERCEPTION_POINTS_VERTICAL + 1;
		let closestFoodPoint: Vector | null = null;
		let maxIntensity = 0;
		let maxIntensityPoint: Vector | null = null;
		let angle = this.vel.heading();

		let horizontalOffset = -AntOptions.IMG_WIDTH / 2;
		let thetaLeft = Math.PI / 4 + angle + Math.PI;
		let thetaRight = -Math.PI / 4 + angle + Math.PI;
		let perceptionXLeft = horizontalOffset * Math.cos(thetaLeft);
		let perceptionYLeft = horizontalOffset * Math.sin(thetaLeft);
		let perceptionXRight = horizontalOffset * Math.cos(thetaRight);
		let perceptionYRight = horizontalOffset * Math.sin(thetaRight);
		let perceptionPointLeft = this.pos
			.copy()
			.add(perceptionXLeft, perceptionYLeft);
		let perceptionPointRight = this.pos
			.copy()
			.add(perceptionXRight, perceptionYRight);

		let cellPerceptionLeft = worldGrid.getCellFromCoordsSafe(
			perceptionPointLeft.x,
			perceptionPointLeft.y,
		);
		let cellPerceptionRight = worldGrid.getCellFromCoordsSafe(
			perceptionPointRight.x,
			perceptionPointRight.y,
		);
		if (
			(cellPerceptionLeft && cellPerceptionLeft.wall === 1) ||
			(cellPerceptionRight && cellPerceptionRight.wall === 1)
		) {
			let perceptionPointWall = cellPerceptionLeft
				? perceptionPointLeft
				: perceptionPointRight;

			let force = perceptionPointWall.sub(this.pos);

			force.sub(this.vel);
			force.mult(-1);
			this.applyForce(force);
			return;
		}

		for (let x = 0; x < AntOptions.PERCEPTION_POINTS_HORIZONTAL; x++) {
			for (let y = 1; y <= AntOptions.PERCEPTION_POINTS_VERTICAL; y++) {
				let theta =
					angleBetween * x +
					AntOptions.PERCEPTION_START_ANGLE +
					angle +
					Math.PI / 2;

				let perceptionX = distanceBetween * y * Math.cos(theta);
				let perceptionY = distanceBetween * y * Math.sin(theta);
				let perceptionPoint = this.pos.copy().add(perceptionX, perceptionY);

				let cellPerception = worldGrid.getCellFromCoordsSafe(
					perceptionPoint.x,
					perceptionPoint.y,
				);

				if (cellPerception) {
					// Check for walls
					if (cellPerception.wall === 1) {
						// let dist = perceptionPoint.dist(this.pos);

						if (y === 1) {
							// if (dist <= distanceBetween + 10) {
							let force = perceptionPoint.sub(this.pos);

							// let maxForce = 0.002;
							force.setMag(this.maxSpeed);
							force.sub(this.vel);
							force.limit(this.maxForce);
							// force.limit(
							// 	(maxForce / AntOptions.PERCEPTION_POINTS_VERTICAL) *
							// 		Math.pow(
							// 			AntOptions.PERCEPTION_POINTS_VERTICAL - y,
							// 			AntOptions.PERCEPTION_POINTS_VERTICAL - y,
							// 		),
							// );
							if (this.debug) {
								// console.log(
								// 	(maxForce / AntOptions.PERCEPTION_POINTS_VERTICAL) *
								// 		(AntOptions.PERCEPTION_POINTS_VERTICAL - y),
								// );
								// console.log(
								// 	(maxForce / AntOptions.PERCEPTION_POINTS_VERTICAL) *
								// 		Math.pow(
								// 			AntOptions.PERCEPTION_POINTS_VERTICAL - y,
								// 			AntOptions.PERCEPTION_POINTS_VERTICAL - y,
								// 		),
								// );
							}
							force.mult(-1);
							this.applyForce(force);
							break;
						}
					}

					// Check for colony
					if (
						cellPerception.colony &&
						(this.state === AntStates.REFILL ||
							this.state === AntStates.TO_HOME)
					) {
						this.seek(perceptionPoint);
						return;
					}

					// Check for food
					if (
						cellPerception.food.quantity > 0 &&
						(this.state === AntStates.TO_FOOD ||
							this.state === AntStates.REFILL)
					) {
						if (this.debug) {
							this.perceptionDraw.add(
								y * AntOptions.PERCEPTION_POINTS_VERTICAL + x,
							);
							console.log(`food: x:${x}, y:${y}`);
						}

						// this.seek(perceptionPoint);
						if (y < closestIndex) {
							closestIndex = y;
							closestFoodPoint = perceptionPoint;
						}
						break;
					}

					// Check for highest intensity marker
					let intensity = 0;
					if (
						this.state === AntStates.TO_HOME ||
						this.state === AntStates.REFILL
					) {
						intensity = cellPerception.marker.intensity[0];
					} else if (
						this.state === AntStates.TO_FOOD ||
						this.state === AntStates.REFILL
					) {
						intensity = cellPerception.marker.intensity[1];
					}

					if (intensity > maxIntensity) {
						maxIntensity = intensity;
						maxIntensityPoint = perceptionPoint;
					}
				}
			}
		}

		if (closestFoodPoint) {
			this.seek(closestFoodPoint);
			return;
		}

		if (maxIntensityPoint) {
			this.seek(maxIntensityPoint);
			return;
		}

		this.wander();
	}

	addMarker(worldGrid: WorldGrid, dt: number) {
		this.markerClock += dt;
		if (this.markerClock >= AntOptions.MARKER_PERIOD) {
			let [x, y] = worldGrid.getCellCoords(this.pos.x, this.pos.y);
			if (!worldGrid.checkCoords(x, y)) return;

			let intensity =
				AntOptions.MARKER_DEFAULT_INTENSITY *
				Math.exp(-0.15 * this.internalClock);

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
