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

	constructor(performanceOptions: PerformanceOptions[]) {
		this.measurementArray = new Map();
		this.sampleSize = 60;
		this.isMeasuring = true;
		this.modes = [];
		this.mode = 0;
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
		let elements = [];

		for (const [key, value] of this.measurementArray) {
			let span = document.createElement('span');
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
		let measurement = this.measurementArray.get(name);
		if (measurement && measurement.mode <= this.mode) {
			measurement.startTime = performance.now();
		}
	}

	endMeasurement(name: string) {
		let measurement = this.measurementArray.get(name);
		if (measurement && measurement.startTime && measurement.mode <= this.mode) {
			measurement.performanceArray[measurement.index] =
				performance.now() - measurement.startTime;
		}
	}

	setPerformance(name: string, value: number) {
		let measurement = this.measurementArray.get(name);
		if (measurement && measurement.mode <= this.mode) {
			measurement.performanceArray[measurement.index] = value;
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
			if (value.performanceArray.length === 0) {
				break;
			}

			avgMap.set(key, avgMap.get(key) / value.performanceArray.length);

			if (value.mode <= this.mode) {
				value.index++;
				if (value.index === this.sampleSize) {
					value.index = 0;
				}
			}
		}

		return avgMap;
	}
}
