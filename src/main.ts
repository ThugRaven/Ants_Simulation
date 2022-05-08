import { CanvasOptions, MarkerTypes } from './constants';
import Marker from './classes/Marker';
import './style.css';

const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
const ctx = canvas?.getContext('2d');

// if (canvas?.getContext) {
//   return
// }

let markers: Marker[] = [];

if (canvas != null && ctx != null) {
	canvas.width = CanvasOptions.WIDTH;
	canvas.height = CanvasOptions.HEIGHT;
	// canvas.width = window.innerWidth;
	// canvas.height = window.innerHeight;

	let count = 0;

	for (let i = 0; i < canvas.width; i++) {
		for (let j = 0; j < canvas.height; j++) {
			if (i % 4 == 0 && j % 4 == 0) {
				let random = Math.floor(Math.random() * 3) + 1;
				let type = 0;

				if (random == 1) {
					type = MarkerTypes.TO_HOME;
				} else if (random == 2) {
					type = MarkerTypes.TO_FOOD;
				} else {
					type = MarkerTypes.NO_FOOD;
				}
				count++;
				let marker = new Marker(ctx, i, j, type, Math.random());
				markers.push(marker);
				marker.draw();
			}
		}
	}

	let lastUpdateTime = 0;
	const SPEED = 10;

	function main(currentTime: number) {
		window.requestAnimationFrame(main);
		const deltaTime = currentTime - lastUpdateTime;

		if (deltaTime / 1000 < 1 / SPEED) {
			return;
		}
		console.log('update');
		ctx?.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < markers.length; i++) {
			// console.log(markers[i].intensity);
			// console.log(`i: ${i}, x: ${markers[i].x}, y: ${markers[i].y}`);

			markers[i].draw();
			markers[i].update();
		}

		lastUpdateTime = currentTime;
	}

	window.requestAnimationFrame(main);

	console.log(count);
}
