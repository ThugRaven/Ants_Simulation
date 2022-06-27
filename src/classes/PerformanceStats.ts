interface PerformanceOptions {
	name: string;
	title: string;
}

interface Measurement {
	performanceArray: number[];
	startTime?: number;
	element?: HTMLSpanElement;
	title: string;
}

export default class PerformanceStats {
	measurementArray: Map<string, Measurement>;
	index: number;
	sampleSize: number;
	isMeasuring: boolean;

	constructor(performanceOptions: PerformanceOptions[]) {
		this.measurementArray = new Map();
		this.index = 0;
		this.sampleSize = 60;
		this.isMeasuring = true;
		this.createMeasurementArray(performanceOptions);
	}

	toggleMeasuring() {
		return this.isMeasuring != this.isMeasuring;
	}

	createMeasurementArray(performanceOptions: PerformanceOptions[]) {
		for (const options of performanceOptions) {
			this.measurementArray.set(options.name, {
				performanceArray: [],
				title: options.title,
			});
		}
	}

	createPerformanceDisplay(container: HTMLDivElement) {
		let elements = [];

		for (const [key, value] of this.measurementArray) {
			let span = document.createElement('span');
			span.dataset[key.toString()] = '';
			span.title = value.title;
			value.element = container.appendChild(span);
			elements.push(value.element);
		}

		return elements;
	}

	startMeasurement(name: string) {
		let measurement = this.measurementArray.get(name);
		if (measurement) {
			measurement.startTime = performance.now();
		}
	}

	endMeasurement(name: string) {
		let measurement = this.measurementArray.get(name);
		if (measurement && measurement.startTime) {
			measurement.performanceArray[this.index] =
				performance.now() - measurement.startTime;
		}
	}

	setPerformance(name: string, value: number) {
		let measurement = this.measurementArray.get(name);
		if (measurement) {
			measurement.performanceArray[this.index] = value;
		}
	}

	update() {
		let avgMap = new Map();

		for (const key of this.measurementArray.keys()) {
			avgMap.set(key, 0);
		}

		for (const [key, value] of this.measurementArray) {
			for (let i = 0; i < value.performanceArray.length; i++) {
				avgMap.set(key, avgMap.get(key) + value.performanceArray[i]);
			}
		}

		for (const [key, value] of this.measurementArray) {
			avgMap.set(key, avgMap.get(key) / value.performanceArray.length);
		}

		this.index++;
		if (this.index === this.sampleSize) {
			this.index = 0;
		}

		return avgMap;
	}
}
