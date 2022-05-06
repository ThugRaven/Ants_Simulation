import { CanvasOptions, MarkerTypes } from './constants';
import Marker from './classes/Marker';
import './style.css';

const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
const ctx = canvas?.getContext('2d');

// if (canvas?.getContext) {
//   return
// }

if (canvas != null && ctx != null) {
	canvas.width = CanvasOptions.WIDTH;
	canvas.height = CanvasOptions.HEIGHT;

	let count = 0;
	for (let i = 0; i < CanvasOptions.WIDTH; i++) {
		for (let j = 0; j < CanvasOptions.HEIGHT; j++) {
			if (i % 10 == 0 && j % 10 == 0) {
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
				marker.draw();
			}
		}
	}

	console.log(count);
}
