interface ImageInstanceOptions {
	width: number;
	height: number;
}
export default class ImageInstance {
	width: number;
	height: number;

	constructor(imageInstanceOptions: ImageInstanceOptions) {
		this.width = imageInstanceOptions.width;
		this.height = imageInstanceOptions.height;
	}

	createInstance(callback: (ctx: CanvasRenderingContext2D) => void) {
		let canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;

		console.log(
			`Created canvas image instance with size: ${this.width} x ${this.height}`,
		);

		let ctx = canvas.getContext('2d');
		if (ctx) {
			callback(ctx);
		}

		return canvas;
	}
}
