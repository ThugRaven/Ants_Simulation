/**
	Custom implementation of p5.js p5.Vector class to work without global p5 object
	@link https://github.com/processing/p5.js/blob/v1.4.1/src/math/p5.Vector.js
	Typescript types
	@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/p5/src/math/p5.Vector.d.ts
*/
export class Vector {
	x: number;
	y: number;
	z: number;

	constructor(x?: number, y?: number, z?: number) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	}

	set(x?: number | Vector | number[], y?: number, z?: number) {
		if (x instanceof Vector) {
			this.x = x.x || 0;
			this.y = x.y || 0;
			this.z = x.z || 0;
			return this;
		}
		if (x instanceof Array) {
			this.x = x[0] || 0;
			this.y = x[1] || 0;
			this.z = x[2] || 0;
			return this;
		}
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
		return this;
	}

	copy() {
		return new Vector(this.x, this.y, this.z);
	}

	add(value: Vector | number[]): Vector;
	add(x: number, y?: number, z?: number): Vector;
	add(x: number | Vector | number[], y?: number, z?: number) {
		if (x instanceof Vector) {
			this.x += x.x || 0;
			this.y += x.y || 0;
			this.z += x.z || 0;
			return this;
		}
		if (x instanceof Array) {
			this.x += x[0] || 0;
			this.y += x[1] || 0;
			this.z += x[2] || 0;
			return this;
		}
		this.x += x || 0;
		this.y += y || 0;
		this.z += z || 0;
		return this;
	}

	sub(value: Vector | number[]): Vector;
	sub(x: number, y?: number, z?: number): Vector;
	sub(x: number | Vector | number[], y?: number, z?: number) {
		if (x instanceof Vector) {
			this.x -= x.x || 0;
			this.y -= x.y || 0;
			this.z -= x.z || 0;
			return this;
		}
		if (x instanceof Array) {
			this.x -= x[0] || 0;
			this.y -= x[1] || 0;
			this.z -= x[2] || 0;
			return this;
		}
		this.x -= x || 0;
		this.y -= y || 0;
		this.z -= z || 0;
		return this;
	}

	mult(n: number): Vector;
	mult(x: number, y: number, z?: number): Vector;
	mult(arr: number[]): Vector;
	mult(v: Vector): Vector;
	mult(x: number | number[] | Vector, y?: number, z?: number): Vector {
		if (x instanceof Vector) {
			if (
				Number.isFinite(x.x) &&
				Number.isFinite(x.y) &&
				Number.isFinite(x.z) &&
				typeof x.x === 'number' &&
				typeof x.y === 'number' &&
				typeof x.z === 'number'
			) {
				this.x *= x.x;
				this.y *= x.y;
				this.z *= x.z;
			} else {
				console.warn(
					'Vector.mult:',
					'x contains components that are either undefined or not finite numbers',
				);
			}
			return this;
		}
		if (x instanceof Array) {
			if (
				x.every((element) => Number.isFinite(element)) &&
				x.every((element) => typeof element === 'number')
			) {
				if (x.length === 1) {
					this.x *= x[0];
					this.y *= x[0];
					this.z *= x[0];
				} else if (x.length === 2) {
					this.x *= x[0];
					this.y *= x[1];
				} else if (x.length === 3) {
					this.x *= x[0];
					this.y *= x[1];
					this.z *= x[2];
				}
			} else {
				console.warn(
					'Vector.mult:',
					'x contains elements that are either undefined or not finite numbers',
				);
			}
			return this;
		}

		const vectorComponents = [...arguments];
		if (
			vectorComponents.every((element) => Number.isFinite(element)) &&
			vectorComponents.every((element) => typeof element === 'number')
		) {
			if (arguments.length === 1) {
				this.x *= x;
				this.y *= x;
				this.z *= x;
			}
			if (arguments.length === 2) {
				this.x *= x;
				this.y *= y || 0;
			}
			if (arguments.length === 3) {
				this.x *= x;
				this.y *= y || 0;
				this.z *= z || 0;
			}
		} else {
			console.warn(
				'Vector.mult:',
				'x, y, or z arguments are either undefined or not a finite number',
			);
		}

		return this;
	}

	div(n: number): Vector;
	div(x: number, y: number, z?: number): Vector;
	div(arr: number[]): Vector;
	div(v: Vector): Vector;
	div(x: number | number[] | Vector, y?: number, z?: number) {
		if (x instanceof Vector) {
			if (
				Number.isFinite(x.x) &&
				Number.isFinite(x.y) &&
				Number.isFinite(x.z) &&
				typeof x.x === 'number' &&
				typeof x.y === 'number' &&
				typeof x.z === 'number'
			) {
				if (x.x === 0 || x.y === 0 || x.z === 0) {
					console.warn('Vector.div:', 'divide by 0');
					return this;
				}
				this.x /= x.x;
				this.y /= x.y;
				this.z /= x.z;
			} else {
				console.warn(
					'Vector.div:',
					'x contains components that are either undefined or not finite numbers',
				);
			}
			return this;
		}
		if (x instanceof Array) {
			if (
				x.every((element) => Number.isFinite(element)) &&
				x.every((element) => typeof element === 'number')
			) {
				if (x.some((element) => element === 0)) {
					console.warn('Vector.div:', 'divide by 0');
					return this;
				}

				if (x.length === 1) {
					this.x /= x[0];
					this.y /= x[0];
					this.z /= x[0];
				} else if (x.length === 2) {
					this.x /= x[0];
					this.y /= x[1];
				} else if (x.length === 3) {
					this.x /= x[0];
					this.y /= x[1];
					this.z /= x[2];
				}
			} else {
				console.warn(
					'Vector.div:',
					'x contains components that are either undefined or not finite numbers',
				);
			}

			return this;
		}

		const vectorComponents = [...arguments];
		if (
			vectorComponents.every((element) => Number.isFinite(element)) &&
			vectorComponents.every((element) => typeof element === 'number')
		) {
			if (vectorComponents.some((element) => element === 0)) {
				console.warn('Vector.div:', 'divide by 0');
				return this;
			}

			if (arguments.length === 1) {
				this.x /= x;
				this.y /= x;
				this.z /= x;
			}
			if (arguments.length === 2) {
				this.x /= x;
				this.y /= y || 0;
			}
			if (arguments.length === 3) {
				this.x /= x;
				this.y /= y || 0;
				this.z /= z || 0;
			}
		} else {
			console.warn(
				'Vector.div:',
				'x, y, or z arguments are either undefined or not a finite number',
			);
		}

		return this;
	}

	mag() {
		return Math.sqrt(this.magSq());
	}

	magSq() {
		const x = this.x;
		const y = this.y;
		const z = this.z;
		return x * x + y * y + z * z;
	}

	dist(v: Vector) {
		return v.copy().sub(this).mag();
	}

	normalize() {
		const len = this.mag();
		if (len !== 0) {
			this.x *= 1 / len;
			this.y *= 1 / len;
			this.z *= 1 / len;
		}
		return this;
	}

	limit(max: number) {
		const mSq = this.magSq();
		if (mSq > max * max) {
			this.x /= Math.sqrt(mSq);
			this.y /= Math.sqrt(mSq);
			this.z /= Math.sqrt(mSq);

			this.x *= max;
			this.y *= max;
			this.z *= max;
		}
		return this;
	}

	setMag(n: number) {
		const vector = this.normalize();
		vector.x *= n;
		vector.y *= n;
		vector.z *= n;
		return vector;
	}

	heading() {
		const h = Math.atan2(this.y, this.x);
		return h;
	}

	setHeading(a: number) {
		let m = this.mag();
		this.x = m * Math.cos(a);
		this.y = m * Math.sin(a);
		return this;
	}

	rotate(a: number) {
		let newHeading = this.heading() + a;
		const mag = this.mag();
		this.x = Math.cos(newHeading) * mag;
		this.y = Math.sin(newHeading) * mag;
		return this;
	}

	equals(value: Vector | any[]): boolean;
	equals(x?: number, y?: number, z?: number): boolean;
	equals(x?: Vector | any[] | number, y?: number, z?: number) {
		let a, b, c;
		if (x instanceof Vector) {
			a = x.x || 0;
			b = x.y || 0;
			c = x.z || 0;
		} else if (x instanceof Array) {
			a = x[0] || 0;
			b = x[1] || 0;
			c = x[2] || 0;
		} else {
			a = x || 0;
			b = y || 0;
			c = z || 0;
		}
		return this.x === a && this.y === b && this.z === c;
	}
}

export function createVector(x?: number, y?: number, z?: number) {
	return new Vector(x, y, z);
}
