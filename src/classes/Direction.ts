import { Vector, createVector } from './Vector';

export default class Direction {
	angle: number;
	targetAngle: number;
	rotationSpeed: number;
	vector: Vector;
	targetVector: Vector;

	constructor(angle: number, rotationSpeed = 7.5) {
		this.angle = angle;
		this.targetAngle = angle;
		this.rotationSpeed = rotationSpeed;
		this.vector = createVector();
		this.targetVector = createVector();

		this.updateVector();
		this.targetVector = this.vector.copy();
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
		this.targetVector = d.copy();
		this.vector = d.copy();
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
