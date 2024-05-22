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
		const directionDelta = this.targetVector
			.copy()
			.dot(directionNormalized.x, directionNormalized.y);

		this.angle += this.rotationSpeed * directionDelta * dt;
	}

	setDirectionImmediate(d: Vector) {
		this.targetVector = d;
		this.vector = d;
		this.angle = d.heading();
		this.targetAngle = this.angle;
	}

	setDirectionAngle(a: number) {
		this.targetAngle = a;
		this.updateTargetVector();
	}

	setAndAddDirectionAngle(a: number) {
		this.targetAngle += a;
		this.updateTargetVector();
	}

	addImmediate(a: number) {
		this.setAndAddDirectionAngle(a);
		this.angle = this.targetAngle;
		this.updateVector();
	}

	getVec() {
		return this.vector;
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
