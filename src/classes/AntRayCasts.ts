import {
	AntOptions,
	AntStates,
	ColonyOptions,
	MarkerOptions,
	MarkerTypes,
} from '../constants';
import Colony from './Colony';
import Direction from './Direction';
import { circle } from './Shapes';
import { random } from './Utils';
import { Vector, createVector } from './Vector';
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
	direction: Direction;
	maxSpeed: number;
	state: number;
	debug: boolean;
	internalClock: number;
	markerPeriod: number;
	markerClock: number;
	markerIntensityClock: number;
	directionPeriod: number;
	directionClock: number;
	isDead: boolean;
	freedomCoef: number;
	foodAmount: number;
	maxAutonomy: number;
	hits: number;
	foundCell: boolean;

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
		this.direction = new Direction(random(-Math.PI * 2, Math.PI * 2));
		this.maxSpeed = 2;
		this.state = AntStates.TO_FOOD;
		this.debug = options.debug || false;
		this.internalClock = 0;
		this.markerPeriod =
			AntOptions.MARKER_PERIOD +
			random(-AntOptions.MARKER_PERIOD * 0.25, AntOptions.MARKER_PERIOD * 0.25);
		this.markerClock = random(0, AntOptions.MARKER_PERIOD);
		this.markerIntensityClock = 0;
		this.directionPeriod =
			AntOptions.DIRECTION_PERIOD +
			random(
				-AntOptions.DIRECTION_PERIOD * 0.25,
				AntOptions.DIRECTION_PERIOD * 0.25,
			);
		this.directionClock = random(0, AntOptions.DIRECTION_PERIOD);
		this.isDead = false;
		this.freedomCoef = random(0.01, 0.1);
		this.foodAmount = 0;
		this.maxAutonomy = AntOptions.AUTONOMY_MAX - random(0, 50);
		this.hits = 0;
		this.foundCell = false;
	}

	updatePosition(worldGrid: WorldGrid) {
		const v = this.direction.getVec();

		const rayCast = worldGrid.rayCast(
			this.pos.copy(),
			this.direction.vector.heading(),
			AntOptions.IMG_HEIGHT / 2 + this.maxSpeed,
		);

		if (rayCast?.cell) {
			// circle(
			// 	this.ctx,
			// 	rayCast.intersection.x,
			// 	rayCast.intersection.y,
			// 	30,
			// 	true,
			// );
			const vec = v.copy();

			if (this.hits > 16) {
				vec.setHeading(vec.heading() + Math.PI / 2);
			} else if (this.hits > 8) {
				vec.x *= rayCast.normal.x != 0 ? 1 : -1;
				vec.y *= rayCast.normal.y != 0 ? 1 : -1;
			} else {
				vec.x *= rayCast.normal.x != 0 ? -1 : 1;
				vec.y *= rayCast.normal.y != 0 ? -1 : 1;
			}

			this.hits += 4;
			this.direction.setDirectionImmediate(vec);
		} else {
			this.hits = Math.max(0, this.hits - 1);
			this.pos.add(v.multSimple(this.maxSpeed));
		}
	}

	find(worldGrid: WorldGrid) {
		if (this.directionClock >= this.directionPeriod) {
			this.directionClock = 0;

			let maxIntensity = 0;
			let minIntensity = 1;
			let maxDirection = this.direction.getVec();
			let maxCell = null;
			// const angle = (Math.PI * (1 / 3) * 2) / 32;
			for (let i = 0; i < 32; i++) {
				const randAngle = random(-Math.PI * (1 / 3), Math.PI * (1 / 3));
				// const randAngle = -Math.PI * (1 / 3) + angle * i;
				// const distance = random(0, this.maxSpeed);
				const distance = random(0, MarkerOptions.SIZE * 12);
				// const distance = MarkerOptions.SIZE * 12;
				const currentAngle = maxDirection.heading();
				const sampleAngle = currentAngle + randAngle;
				const angleToCell = createVector(
					Math.cos(sampleAngle),
					Math.sin(sampleAngle),
				);

				const rayCast = worldGrid.rayCast(
					this.pos.copy(),
					sampleAngle,
					distance,
				);

				if (rayCast?.cell) {
					continue;
				}

				const cellVector = this.pos
					.copy()
					.add(angleToCell.multSimple(distance));
				const cell = worldGrid.getCellFromCoordsSafe(
					cellVector.x,
					cellVector.y,
				);

				if (cell && this.debug) {
					cell.density = [cell.density[0], cell.density[1], 100];
				}

				if (!cell) {
					continue;
				}

				if (
					(cell.food.quantity > 0 && this.state === AntStates.TO_FOOD) ||
					(this.state === AntStates.TO_HOME && cell.colony)
				) {
					maxDirection = angleToCell;
					this.direction.setDirectionAngle(maxDirection.heading());
					this.foundCell = true;
					return;
				}

				const wallRepellent = cell.dist * cell.dist;
				const markerIntensity = cell.getIntensity(this.state) * wallRepellent;

				if (markerIntensity > maxIntensity) {
					maxIntensity = markerIntensity;
					maxDirection = angleToCell;
					maxCell = cell;
				}

				if (markerIntensity < minIntensity) {
					minIntensity = markerIntensity;
				}
			}

			if (maxIntensity == minIntensity) {
				this.foundCell = false;
				return;
			}

			if (maxIntensity) {
				if (maxCell && this.debug) {
					maxCell.density = [0, 100, 0];
				}
				this.direction.setDirectionAngle(maxDirection.heading());
				this.foundCell = true;
			} else {
				this.foundCell = false;
			}
		}
	}

	update(worldGrid: WorldGrid, dt: number, colony: Colony) {
		this.internalClock += dt;
		this.markerIntensityClock += dt;
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

		this.direction.update(dt);
		if (!this.foundCell) {
			this.direction.setAndAddDirectionAngle(
				random(
					-AntOptions.DIRECTION_NOISE_RANGE,
					AntOptions.DIRECTION_NOISE_RANGE,
				),
			);
		} else {
			this.direction.setAndAddDirectionAngle(
				random(
					-AntOptions.DIRECTION_NOISE_RANGE / 5,
					AntOptions.DIRECTION_NOISE_RANGE / 5,
				),
			);
		}
		this.updatePosition(worldGrid);

		const cell = worldGrid.getCellFromCoordsSafe(this.pos.x, this.pos.y);

		cell?.addDensity(
			this.state === AntStates.TO_HOME,
			this.state === AntStates.REFILL,
		);

		if (
			cell &&
			cell.food.quantity > 0 &&
			(this.state === AntStates.TO_FOOD || this.state === AntStates.REFILL)
		) {
			this.state = AntStates.TO_HOME;
			this.foodAmount = cell.pick();
			this.direction.addImmediate(Math.PI);
			this.internalClock = 0;
			this.markerIntensityClock = 0;
			return;
		}

		if (cell && cell.food.quantity > 0 && this.state === AntStates.TO_HOME) {
			this.markerIntensityClock = 0;
		}

		if (cell && cell.colony && this.state === AntStates.TO_FOOD) {
			this.markerIntensityClock = 0;
		}

		if (
			cell &&
			cell.colony &&
			(this.state === AntStates.REFILL || this.state === AntStates.TO_HOME)
		) {
			if (this.state === AntStates.TO_HOME) {
				this.direction.addImmediate(Math.PI);
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
			this.markerIntensityClock = 0;
			return;
		}
	}

	draw() {
		this.ctx.translate(this.pos.x, this.pos.y);
		this.ctx.rotate(this.direction.vector.heading() + Math.PI / 2);

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
		}

		if (this.debug) {
			this.ctx.fillStyle = 'white';
			circle(this.ctx, this.pos.x, this.pos.y, 3);
		}

		this.ctx.resetTransform();
	}

	addMarker(worldGrid: WorldGrid, dt: number) {
		this.markerClock += dt;
		if (this.markerClock >= this.markerPeriod) {
			const [x, y] = worldGrid.getCellCoords(this.pos.x, this.pos.y);
			if (!worldGrid.checkCoords(x, y)) return;

			const intensity =
				AntOptions.MARKER_DEFAULT_INTENSITY *
				Math.exp(-0.15 * this.markerIntensityClock);

			if (intensity < 0.01) {
				this.markerClock = 0;
				return;
			}

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
