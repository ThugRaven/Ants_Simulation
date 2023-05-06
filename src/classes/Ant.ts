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
	directionClock: number;
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
		this.maxSpeed = 3;
		this.maxForce = 0.25;
		this.state = AntStates.TO_FOOD;
		this.debug = options.debug || false;
		this.wanderTheta = random(0, Math.PI * 2);
		this.perceptionDraw = new Set();
		this.internalClock = 0;
		this.markerClock = random(0, AntOptions.MARKER_PERIOD);
		this.directionClock = 0;
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

		const force = target.copy().sub(this.pos);
		force.setMag(this.maxSpeed);
		force.sub(this.vel);
		force.limit(this.maxForce);
		this.applyForce(force);
	}

	wander() {
		const wanderPoint = this.vel.copy();
		wanderPoint.setMag(AntOptions.WANDER_POINT_MAGNITUDE);
		wanderPoint.add(this.pos);

		const wanderRadius = AntOptions.WANDER_POINT_RADIUS;

		if (this.debug) {
			this.ctx.fillStyle = 'red';
			circle(this.ctx, wanderPoint.x, wanderPoint.y, 4);

			this.ctx.strokeStyle = 'white';
			circle(this.ctx, wanderPoint.x, wanderPoint.y, wanderRadius, false, true);

			line(this.ctx, this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
		}

		const theta = this.wanderTheta + this.vel.heading();
		const x = wanderRadius * Math.cos(theta);
		const y = wanderRadius * Math.sin(theta);
		wanderPoint.add(x, y);

		if (this.debug) {
			this.ctx.fillStyle = 'green';
			circle(this.ctx, wanderPoint.x, wanderPoint.y, 8);
			line(this.ctx, this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
		}

		const steer = wanderPoint.sub(this.pos);
		steer.setMag(this.maxForce);
		steer.limit(this.maxForce);
		this.applyForce(steer);

		const displaceRange = AntOptions.WANDER_DISPLACE_RANGE;
		this.wanderTheta += random(-displaceRange, displaceRange);
	}

	applyForce(force: Vector) {
		this.acc.add(force);
	}

	update(dt: number) {
		this.internalClock += dt;
		this.directionClock += dt;
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

		const horizontalOffset = -AntOptions.IMG_WIDTH / 2;
		const verticalOffset = -AntOptions.IMG_HEIGHT / 2;

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
			const thetaLeft = AntOptions.PERCEPTION_START_ANGLE;
			const thetaRight = AntOptions.PERCEPTION_END_ANGLE;
			const xLeft = AntOptions.PERCEPTION_RADIUS * Math.cos(thetaLeft);
			const yLeft = AntOptions.PERCEPTION_RADIUS * Math.sin(thetaLeft);
			const xRight = AntOptions.PERCEPTION_RADIUS * Math.cos(thetaRight);
			const yRight = AntOptions.PERCEPTION_RADIUS * Math.sin(thetaRight);
			this.ctx.strokeStyle = 'red';
			line(this.ctx, 0, 0, xLeft, yLeft);
			line(this.ctx, 0, 0, xRight, yRight);
			// Calculate perception points and draw them
			const angleBetween =
				(AntOptions.PERCEPTION_END_ANGLE - AntOptions.PERCEPTION_START_ANGLE) /
				(AntOptions.PERCEPTION_POINTS_HORIZONTAL - 1);
			const distanceBetween =
				AntOptions.PERCEPTION_RADIUS / AntOptions.PERCEPTION_POINTS_VERTICAL;

			for (let x = 0; x < AntOptions.PERCEPTION_POINTS_HORIZONTAL; x++) {
				for (let y = 1; y <= AntOptions.PERCEPTION_POINTS_VERTICAL; y++) {
					const theta = angleBetween * x + AntOptions.PERCEPTION_START_ANGLE;

					const perceptionX = distanceBetween * y * Math.cos(theta);
					const perceptionY = distanceBetween * y * Math.sin(theta);

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

		const posAhead = this.vel.copy();
		posAhead.setMag(AntOptions.IMG_HEIGHT / 2);
		posAhead.add(this.pos);
		const cellAhead = worldGrid.getCellFromCoordsSafe(posAhead.x, posAhead.y);
		const cell = worldGrid.getCellFromCoordsSafe(this.pos.x, this.pos.y);
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

		const angleBetween =
			(AntOptions.PERCEPTION_END_ANGLE - AntOptions.PERCEPTION_START_ANGLE) /
			(AntOptions.PERCEPTION_POINTS_HORIZONTAL - 1);
		const distanceBetween =
			AntOptions.PERCEPTION_RADIUS / AntOptions.PERCEPTION_POINTS_VERTICAL;

		let closestIndex = AntOptions.PERCEPTION_POINTS_VERTICAL + 1;
		let closestFoodPoint: Vector | null = null;
		let maxIntensity = 0;
		let maxIntensityPoint: Vector | null = null;
		const angle = this.vel.heading();

		const horizontalOffset = -AntOptions.IMG_WIDTH / 2;
		const thetaLeft = Math.PI / 4 + angle + Math.PI;
		const thetaRight = -Math.PI / 4 + angle + Math.PI;
		const perceptionXLeft = horizontalOffset * Math.cos(thetaLeft);
		const perceptionYLeft = horizontalOffset * Math.sin(thetaLeft);
		const perceptionXRight = horizontalOffset * Math.cos(thetaRight);
		const perceptionYRight = horizontalOffset * Math.sin(thetaRight);
		const perceptionPointLeft = this.pos
			.copy()
			.add(perceptionXLeft, perceptionYLeft);
		const perceptionPointRight = this.pos
			.copy()
			.add(perceptionXRight, perceptionYRight);

		const cellPerceptionLeft = worldGrid.getCellFromCoordsSafe(
			perceptionPointLeft.x,
			perceptionPointLeft.y,
		);
		const cellPerceptionRight = worldGrid.getCellFromCoordsSafe(
			perceptionPointRight.x,
			perceptionPointRight.y,
		);
		if (
			(cellPerceptionLeft && cellPerceptionLeft.wall === 1) ||
			(cellPerceptionRight && cellPerceptionRight.wall === 1)
		) {
			const perceptionPointWall = cellPerceptionLeft
				? perceptionPointLeft
				: perceptionPointRight;

			const force = perceptionPointWall.sub(this.pos);

			force.sub(this.vel);
			force.mult(-1);
			this.applyForce(force);
			return;
		}

		if (this.directionClock >= AntOptions.DIRECTION_PERIOD) {
			for (let x = 0; x < AntOptions.PERCEPTION_POINTS_HORIZONTAL; x++) {
				for (let y = 1; y <= AntOptions.PERCEPTION_POINTS_VERTICAL; y++) {
					const theta =
						angleBetween * x +
						AntOptions.PERCEPTION_START_ANGLE +
						angle +
						Math.PI / 2;

					const perceptionX = distanceBetween * y * Math.cos(theta);
					const perceptionY = distanceBetween * y * Math.sin(theta);
					const perceptionPoint = this.pos.copy().add(perceptionX, perceptionY);

					const cellPerception = worldGrid.getCellFromCoordsSafe(
						perceptionPoint.x,
						perceptionPoint.y,
					);

					if (cellPerception) {
						// Check for walls
						if (cellPerception.wall === 1 && (y === 1 || y === 2)) {
							const force = perceptionPoint.sub(this.pos);

							const forceMultiplier =
								x + 1 > AntOptions.PERCEPTION_POINTS_HORIZONTAL / 2
									? AntOptions.PERCEPTION_POINTS_HORIZONTAL - x
									: x + 1;

							force.setMag(this.maxSpeed);
							force.sub(this.vel);

							if (y === 1) {
								force.limit(this.maxForce * forceMultiplier);
							} else if (y === 2) {
								force.limit(this.maxForce * 0.5 * forceMultiplier);
							}

							force.mult(-1);
							this.applyForce(force);
							break;
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

			this.directionClock = 0;
		}

		this.wander();
	}

	searchSimple(worldGrid: WorldGrid, colony: Colony) {
		if (this.debug) {
			this.perceptionDraw = new Set();
		}

		const cell = worldGrid.getCellFromCoordsSafe(this.pos.x, this.pos.y);
		cell?.addDensity();
		if (
			cell &&
			cell.food.quantity > 0 &&
			(this.state === AntStates.TO_FOOD || this.state === AntStates.REFILL)
		) {
			this.state = AntStates.TO_HOME;
			this.foodAmount = cell.pick();
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

		const angleBetween =
			(AntOptions.PERCEPTION_END_ANGLE - AntOptions.PERCEPTION_START_ANGLE) /
			(AntOptions.PERCEPTION_POINTS_HORIZONTAL - 1);
		const distanceBetween =
			AntOptions.PERCEPTION_RADIUS / AntOptions.PERCEPTION_POINTS_VERTICAL;

		let closestIndex = AntOptions.PERCEPTION_POINTS_VERTICAL + 1;
		let closestFoodPoint: Vector | null = null;
		let maxIntensity = 0;
		let maxIntensityPoint: Vector | null = null;
		const angle = this.vel.heading();

		const wallForce = this.vel.copy().add(this.acc).limit(this.maxSpeed);
		const perceptionAheadPosition = this.pos.copy().add(wallForce);
		const cellPerceptionAhead = worldGrid.getCellFromCoordsSafe(
			perceptionAheadPosition.x,
			perceptionAheadPosition.y,
		);

		if (cellPerceptionAhead?.wall === 1) {
			const force = perceptionAheadPosition.sub(this.pos);
			if (this.debug) {
				console.log(force);
			}

			force.x *= force.x != 0 ? -1 : 1;
			force.y *= force.y != 0 ? -1 : 1;

			force.sub(this.vel);
			this.applyForce(force);
			return;
		}

		if (this.directionClock >= AntOptions.DIRECTION_PERIOD) {
			for (let x = 0; x < AntOptions.PERCEPTION_POINTS_HORIZONTAL; x++) {
				for (let y = 1; y <= AntOptions.PERCEPTION_POINTS_VERTICAL; y++) {
					const theta =
						angleBetween * x +
						AntOptions.PERCEPTION_START_ANGLE +
						angle +
						Math.PI / 2;

					const perceptionX = distanceBetween * y * Math.cos(theta);
					const perceptionY = distanceBetween * y * Math.sin(theta);
					const perceptionPoint = this.pos.copy().add(perceptionX, perceptionY);

					const cellPerception = worldGrid.getCellFromCoordsSafe(
						perceptionPoint.x,
						perceptionPoint.y,
					);

					if (cellPerception) {
						// Check for walls
						if (cellPerception.wall === 1 && (y === 1 || y === 2)) {
							const force = perceptionPoint.sub(this.pos);

							const forceMultiplier =
								x + 1 > AntOptions.PERCEPTION_POINTS_HORIZONTAL / 2
									? AntOptions.PERCEPTION_POINTS_HORIZONTAL - x
									: x + 1;

							force.setMag(this.maxSpeed);
							force.sub(this.vel);

							if (y === 1) {
								force.limit(this.maxForce * forceMultiplier);
							} else if (y === 2) {
								force.limit(this.maxForce * 0.5 * forceMultiplier);
							}

							force.mult(-1);
							this.applyForce(force);
							break;
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

			this.directionClock = 0;
		}

		this.wander();
	}

	addMarker(worldGrid: WorldGrid, dt: number) {
		this.markerClock += dt;
		if (this.markerClock >= AntOptions.MARKER_PERIOD) {
			const [x, y] = worldGrid.getCellCoords(this.pos.x, this.pos.y);
			if (!worldGrid.checkCoords(x, y)) return;

			const intensity =
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
