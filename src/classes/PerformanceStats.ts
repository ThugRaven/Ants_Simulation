interface PerformanceOptions {
	mode: number;
	stats: PerformanceStatistics[];
}

interface PerformanceStatistics {
	name: string;
	title: string;
}

interface Measurement {
	performanceArray: number[];
	startTime?: number;
	element?: HTMLSpanElement;
	title: string;
	mode: number;
	index: number;
}

export default class PerformanceStats {
	measurementArray: Map<string, Measurement>;
	sampleSize: number;
	isMeasuring: boolean;
	modes: number[];
	mode: number;
	performanceTest: {
		lowestMap: Map<string, number>;
		avgMap: Map<string, number>;
		highestMap: Map<string, number>;
	};
	isPerfTest: boolean;

	constructor(performanceOptions: PerformanceOptions[]) {
		this.measurementArray = new Map();
		this.sampleSize = 60;
		this.isMeasuring = true;
		this.modes = [];
		this.mode = 0;
		this.performanceTest = {
			lowestMap: new Map(),
			avgMap: new Map(),
			highestMap: new Map(),
		};
		this.isPerfTest = false;
		this.getModes(performanceOptions);
		this.createMeasurementArray(performanceOptions);
	}

	getModes(performanceOptions: PerformanceOptions[]) {
		for (const options of performanceOptions) {
			this.modes.push(options.mode);
		}
	}

	changeMode() {
		if (this.mode == this.modes.length - 1) {
			this.isMeasuring = false;
			this.mode = -1;
		} else {
			this.isMeasuring = true;
			this.mode++;
		}

		this.toggleDisplayVisibility();
	}

	setMode(mode: number) {
		if (this.modes.find((v) => v === mode)) {
			this.mode = mode;
			this.toggleDisplayVisibility();
		}
	}

	toggleDisplayVisibility() {
		for (const value of this.measurementArray.values()) {
			if (!value.element) {
				return;
			}

			if (this.isMeasuring && value.mode <= this.mode) {
				value.element.style.display = 'block';
			} else {
				value.element.style.display = 'none';
			}
		}
	}

	createMeasurementArray(performanceOptions: PerformanceOptions[]) {
		for (const options of performanceOptions) {
			for (const stats of options.stats) {
				this.measurementArray.set(stats.name, {
					performanceArray: [],
					title: stats.title,
					mode: options.mode,
					index: 0,
				});
			}
		}
	}

	createPerformanceDisplay(container: HTMLDivElement) {
		const elements = [];

		for (const [key, value] of this.measurementArray) {
			const span = document.createElement('span');
			span.dataset[key.toString()] = '';
			span.title = value.title;

			if (this.isMeasuring && value.mode <= this.mode) {
				span.style.display = 'block';
			} else {
				span.style.display = 'none';
			}

			value.element = container.appendChild(span);
			elements.push(value.element);
		}

		return elements;
	}

	startMeasurement(name: string) {
		const measurement = this.measurementArray.get(name);
		if (measurement && measurement.mode <= this.mode) {
			measurement.startTime = performance.now();
		}
	}

	endMeasurement(name: string) {
		const measurement = this.measurementArray.get(name);
		if (measurement && measurement.startTime && measurement.mode <= this.mode) {
			measurement.performanceArray[measurement.index] =
				performance.now() - measurement.startTime;
		}
	}

	setPerformance(name: string, value: number) {
		const measurement = this.measurementArray.get(name);
		if (measurement && measurement.mode <= this.mode) {
			measurement.performanceArray[measurement.index] = value;
		}
	}

	update() {
		const lowestMap = new Map();
		const highestMap = new Map();
		const avgMap = new Map();

		for (const key of this.measurementArray.keys()) {
			lowestMap.set(key, 0);
			highestMap.set(key, 0);
			avgMap.set(key, 0);
		}

		for (const [key, value] of this.measurementArray) {
			if (value.performanceArray.length === 0) {
				break;
			}

			let lowestValue = Infinity;
			let highestValue = 0;
			let sum = 0;

			for (let i = 0; i < value.performanceArray.length; i++) {
				const performanceValue = value.performanceArray[i];
				if (performanceValue < lowestValue && performanceValue !== 0) {
					lowestValue = performanceValue;
				}

				sum += performanceValue;

				if (performanceValue > highestValue) {
					highestValue = performanceValue;
				}
			}

			lowestMap.set(key, lowestValue);
			highestMap.set(key, highestValue);
			avgMap.set(key, sum / value.performanceArray.length);

			if (this.isPerfTest) {
				this.add(lowestMap, highestMap, avgMap);
			}

			if (value.mode <= this.mode) {
				value.index++;
				if (value.index === this.sampleSize) {
					value.index = 0;
				}
			}
		}

		return avgMap;
	}

	startPerformanceTest() {
		for (const key of this.measurementArray.keys()) {
			this.performanceTest.lowestMap.set(key, Infinity);
			this.performanceTest.highestMap.set(key, 0);
			this.performanceTest.avgMap.set(key, 0);
		}

		this.isPerfTest = true;
	}

	endPerformanceTest() {
		this.isPerfTest = false;

		console.log('--- Performance Test Results ---');
		console.log('--- Average ---');
		this.performanceTest.avgMap.forEach((v, k) =>
			console.log(k, parseFloat(v.toFixed(4))),
		);
		console.log('--- Highest ---');
		this.performanceTest.highestMap.forEach((v, k) =>
			console.log(k, parseFloat(v.toFixed(4))),
		);
		console.log('--- Lowest ---');
		this.performanceTest.lowestMap.forEach((v, k) =>
			console.log(k, parseFloat(v.toFixed(4))),
		);
	}

	add(
		lowestMap: Map<string, number>,
		highestMap: Map<string, number>,
		avgMap: Map<string, number>,
	) {
		for (const key of this.measurementArray.keys()) {
			const lowestValue = this.performanceTest.lowestMap.get(key);
			const newPossibleLowestValue = lowestMap.get(key);

			if (
				lowestValue !== undefined &&
				newPossibleLowestValue !== undefined &&
				newPossibleLowestValue < lowestValue &&
				newPossibleLowestValue !== 0
			) {
				this.performanceTest.lowestMap.set(key, newPossibleLowestValue);
			}

			const highestValue = this.performanceTest.highestMap.get(key);
			const newPossibleHighestValue = highestMap.get(key);

			if (
				highestValue !== undefined &&
				newPossibleHighestValue !== undefined &&
				newPossibleHighestValue > highestValue
			) {
				this.performanceTest.highestMap.set(key, newPossibleHighestValue);
			}

			const averageValue = this.performanceTest.avgMap.get(key);
			const newAverageValue = avgMap.get(key);
			if (averageValue !== undefined && newAverageValue !== undefined) {
				this.performanceTest.avgMap.set(
					key,
					averageValue === 0
						? newAverageValue
						: (averageValue + newAverageValue) / 2,
				);
			}
		}
	}
}
