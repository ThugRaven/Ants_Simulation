import { Vector, createVector } from './Vector';

export default class Direction {
	angle: number;
	targetAngle: number;
	rotationSpeed: number;
	vector: Vector;
	targetVector: Vector;

	constructor(angle: number, targetAngle: number, rotationSpeed = 1) {
		this.angle = angle;
		this.targetAngle = targetAngle;
		this.rotationSpeed = rotationSpeed;
		this.vector = createVector();
		this.targetVector = this.vector;

		this.updateVector();
	}

	update(dt: number) {
		this.updateVector();
		const directionNormalized = createVector(-this.vector.y, this.vector.x);
		const directionDelta = this.targetVector.dot(
			directionNormalized.x,
			directionNormalized.y,
		);
		this.angle += this.rotationSpeed * directionDelta * dt;
	}

	updateVector() {
		this.vector.x = Math.cos(this.angle);
		this.vector.y = Math.sin(this.angle);
	}

	updateTargetVector() {
		this.targetVector.x = Math.cos(this.targetAngle);
		this.targetVector.y = Math.sin(this.targetAngle);
	}
}
