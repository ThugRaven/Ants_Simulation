export default class PerformanceStats {
	fpsArray: number[];
	msArray: number[];
	index: number;
	sampleSize: number;

	constructor() {
		this.fpsArray = [];
		this.msArray = [];
		this.index = 0;
		this.sampleSize = 60;
	}

	update(fps: number, ms: number) {
		let fpsAvg = 0;
		let msAvg = 0;

		this.fpsArray[this.index] = Math.round(fps);
		this.msArray[this.index] = Math.round(ms);

		for (let i = 0; i < this.fpsArray.length; i++) {
			fpsAvg += this.fpsArray[i];
			msAvg += this.msArray[i];
		}

		fpsAvg /= this.fpsArray.length;
		msAvg /= this.msArray.length;

		this.index++;
		if (this.index === this.sampleSize) {
			this.index = 0;
		}

		return [fpsAvg, msAvg];
	}
}
