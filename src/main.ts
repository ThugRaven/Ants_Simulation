import { CanvasOptions, MarkerOptions, MarkerTypes } from './constants';
import Marker from './classes/Marker';
import './style.css';
import Ant from './classes/Ant';
import { createVector } from './classes/Vector';
import { circle, line } from './classes/Shapes';

const canvasContainer = document.getElementById(
	'canvas-container',
) as HTMLElement;
const cameraContainer = document.getElementById(
	'camera-container',
) as HTMLDivElement;
const btnFullscreen = document.getElementById(
	'btn-fullscreen',
) as HTMLButtonElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const antIcon = document.getElementById('antIcon') as SVGElement | null;

const antId = document.querySelector<HTMLSpanElement>('[data-id]');
const antPos = document.querySelector<HTMLSpanElement>('[data-pos]');
const antVel = document.querySelector<HTMLSpanElement>('[data-vel]');
const antState = document.querySelector<HTMLSpanElement>('[data-state]');

let isRunning = false;
let isDrawingMarkers = true;
let isDebugMode = false;

let lastUpdateTime = 0;
const SPEED = 10;
let frames = 0;
let markers: Marker[] = [];
let ants: Ant[] = [];
let mainLoopAnimationFrame = -1;
let ant: Ant | null = null;
let selectedAnt: Ant | null = null;

let mouseX = 0;
let mouseY = 0;
let canvasScale = 1;
let isPanning = false;
let panStart = {
	x: 0,
	y: 0,
};
let cameraOffset = {
	x: 0,
	y: 0,
};

window.addEventListener('keydown', (e) => {
	switch (e.code) {
		case 'Space':
			toggleLoop();
			break;
		case 'KeyM':
			toggleMarkers();
			break;
		case 'KeyD':
			toggleDebug();
		default:
			break;
	}
});

window.addEventListener('mousemove', (e) => {
	mouseX = e.pageX;
	mouseY = e.pageY;
});

window.addEventListener('click', () => {
	selectedAnt = selectAnt();
});

window.addEventListener('wheel', (e) => {
	zoomCanvas(e);
});

btnFullscreen.addEventListener('click', () => {
	alignCamera();
});

setupCamera();
setup();

function setup() {
	if (ctx == null) return;

	canvas.width = CanvasOptions.WIDTH;
	canvas.height = CanvasOptions.HEIGHT;
	// canvas.width = window.innerWidth;
	// canvas.height = window.innerHeight;

	let count = 0;

	for (let i = 0; i < Math.floor(canvas.width / MarkerOptions.WIDTH); i++) {
		for (let j = 0; j < Math.floor(canvas.height / MarkerOptions.HEIGHT); j++) {
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
			let marker = new Marker(
				ctx,
				i * MarkerOptions.WIDTH,
				j * MarkerOptions.HEIGHT,
				type,
				Math.random(),
			);
			markers.push(marker);
			marker.draw();
		}
	}

	ctx.translate(0, 0);
	let ant3 = new Path2D(
		'm 95.622276,163.1294 v 5.26257 l 2.944768,2.07434 -0.97677,1.07966 0.0045,4.21225 2.291972,1.56002 v 0.49978 l -1.099034,0.42216 -3.162998,-2.15442 -0.01589,-2.62243 -4.904581,-3.26317 v 0.74725 l 4.264005,3.04289 v 2.52634 l 3.607365,2.39706 v 1.16695 l -1.563396,0.8346 -3.51128,-2.36551 h -4.476611 l 0.40638,0.6575 3.733553,0.002 3.913626,2.60228 1.49741,-0.97774 v 2.38976 l -1.461511,-0.97046 -4.101838,2.69278 -0.01362,2.73451 -2.294165,1.4193 v 0.60411 h 0.502454 l 2.448252,-1.66435 v -2.5227 l 3.497295,-2.33638 1.52727,1.08692 1.527258,1.08449 -3.599373,2.38974 v 5.41105 l 4.101843,2.78231 h 0.16258 0.16008 l 4.1018,-2.78231 v -5.41105 l -3.59934,-2.38974 1.52727,-1.08449 1.52727,-1.08692 3.49729,2.33638 v 2.5227 l 2.4483,1.66435 h 0.50245 v -0.60411 l -2.29416,-1.4193 -0.0136,-2.73451 -4.10179,-2.69278 -1.46151,0.97046 v -2.38976 l 1.49741,0.97774 3.91362,-2.60228 3.73354,-0.002 0.40638,-0.6575 h -4.47636 l -3.51131,2.36551 -1.56342,-0.8346 v -1.16695 l 3.60738,-2.39706 v -2.52634 l 4.26396,-3.04289 v -0.74725 l -4.90458,3.26317 -0.0159,2.62243 -3.16296,2.15442 -1.09904,-0.42216 v -0.49978 l 2.29198,-1.56002 0.005,-4.21225 -0.97677,-1.07966 2.94473,-2.07434 v -5.26257 h -0.65627 v 4.88846 l -3.01684,2.07677 -1.57337,-0.84187 -1.57554,0.84187 -3.016767,-2.07677 v -4.88846 z',
	);
	ctx.save();
	ctx.fillStyle = 'white';
	ctx.stroke();
	ctx.fill(ant3);
	ctx.restore();

	if (antIcon) {
		let xml = new XMLSerializer().serializeToString(antIcon);

		let svg64 = btoa(xml);
		let b64Start = 'data:image/svg+xml;base64,';
		let image64 = b64Start + svg64;

		let ant4 = new Image();
		ant4.src = image64;
		ant4.onload = () => {
			ctx.drawImage(ant4, 100, 50, 24, 34);

			// ant = new Ant(ctx, ant4, {
			// 	id: 1,
			// 	pos: {
			// 		x: 16,
			// 		y: 16,
			// 		// x: canvas.width / 2,
			// 		// y: canvas.height / 2,
			// 	},
			// });
			for (let i = 0; i < 10; i++) {
				ant = new Ant(ctx, ant4, {
					id: i + 1,
					pos: {
						x: Math.floor(Math.random() * canvas.width),
						y: Math.floor(Math.random() * canvas.height),
					},
				});
				ant.draw();
				ants.push(ant);
			}
		};
	}

	console.time('perf');
	console.log(count);
}

function toggleLoop() {
	isRunning = !isRunning;

	if (isRunning) {
		console.log('Play');
		mainLoopAnimationFrame = window.requestAnimationFrame(main);
	} else {
		console.log('Pause');
		cancelAnimationFrame(mainLoopAnimationFrame);
	}
}

function toggleMarkers() {
	isDrawingMarkers = !isDrawingMarkers;
}

function toggleDebug() {
	isDebugMode = !isDebugMode;

	if (ants.length > 0 && selectedAnt) {
		for (const ant of ants) {
			if (ant.id === selectedAnt.id) {
				ant.debug = isDebugMode;
			} else {
				ant.debug = false;
			}
		}
	}
}

function selectAnt() {
	if (ants.length <= 0) return null;

	let newAnt = selectedAnt;
	let minDist = Infinity;
	let mouseVector = createVector(
		mouseX / canvasScale - cameraOffset.x,
		mouseY / canvasScale - cameraOffset.y,
	);
	let radius = 25;

	for (const ant of ants) {
		let dist = ant.pos.dist(mouseVector);
		if (dist < minDist && dist < radius) {
			minDist = dist;
			newAnt = ant;
		}
	}

	console.log(newAnt);
	return newAnt;
}

function updateAntInfo() {
	if (!selectedAnt) return;

	antId!.textContent = selectedAnt.id.toString();
	antPos!.textContent = `${selectedAnt.pos.x.toFixed(
		2,
	)} : ${selectedAnt.pos.y.toFixed(2)}`;
	antVel!.textContent = `${selectedAnt.vel.x.toFixed(
		2,
	)} : ${selectedAnt.vel.y.toFixed(2)}`;
	antState!.textContent = selectedAnt.state.toString();
}

function setupCamera() {
	window.addEventListener('mousedown', (e) => {
		isPanning = true;

		panStart.x = e.clientX / canvasScale - cameraOffset.x;
		panStart.y = e.clientY / canvasScale - cameraOffset.y;
	});

	window.addEventListener('mousemove', (e) => {
		if (!isPanning) return;

		panCanvas(e);
	});

	window.addEventListener('mouseup', () => {
		isPanning = false;
	});
}

function zoomCanvas(event: WheelEvent) {
	let zoomOffset = {
		x: 0,
		y: 0,
	};

	zoomOffset.x = event.clientX / canvasScale - cameraOffset.x;
	zoomOffset.y = event.clientY / canvasScale - cameraOffset.y;

	canvasScale += event.deltaY * -0.0025;
	canvasScale = Math.min(Math.max(0.5, canvasScale), 16);

	cameraOffset.x = event.clientX / canvasScale - zoomOffset.x;
	cameraOffset.y = event.clientY / canvasScale - zoomOffset.y;

	setCamera();
}

function panCanvas(event: MouseEvent) {
	cameraOffset.x = event.clientX / canvasScale - panStart.x;
	cameraOffset.y = event.clientY / canvasScale - panStart.y;

	console.log(cameraOffset);

	setCamera();
}

function setCamera() {
	cameraContainer.style.transform = `scale(${canvasScale}) translate(${cameraOffset.x}px, ${cameraOffset.y}px)`;
}

function alignCamera() {
	let canvasCenter = {
		x: window.innerWidth / 2 - canvas.width / 2,
		y: window.innerHeight / 2 - canvas.height / 2,
	};

	canvasScale = 1;
	cameraOffset.x = canvasCenter.x;
	cameraOffset.y = canvasCenter.y;

	setCamera();
}

function main(currentTime: number) {
	if (ctx == null) return;

	mainLoopAnimationFrame = window.requestAnimationFrame(main);

	const deltaTime = (currentTime - lastUpdateTime) / 1000;

	// if (deltaTime < 1 / SPEED) {
	// 	return;
	// }
	console.log('update');
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (let i = 0; i < markers.length; i++) {
		// console.log(markers[i].intensity);
		// console.log(`i: ${i}, x: ${markers[i].x}, y: ${markers[i].y}`);
		markers[i].update();
		if (isDrawingMarkers) {
			markers[i].draw();
		}
	}

	console.log(mouseX);
	console.log(cameraOffset.x);
	console.log(canvasScale);

	let target = createVector(
		// (mouseX - cameraOffset.x * canvasScale) / canvasScale,
		// (mouseY - cameraOffset.y * canvasScale) / canvasScale,
		mouseX / canvasScale - cameraOffset.x,
		mouseY / canvasScale - cameraOffset.y,
	);

	console.log(target.x);

	for (const ant of ants) {
		// console.log(ant);

		if (isDebugMode) {
			ctx.fillStyle = 'red';
			circle(ctx, target.x, target.y, 4);
		}
		ant.seek(target);
		ant.update();
		ant.draw();

		if (ant.id === selectedAnt?.id) {
			updateAntInfo();
		}
	}

	// if (ant) {
	// 	let target = createVector(mouseX, mouseY);
	// 	if (isDebugMode) {
	// 		ctx.fillStyle = 'red';
	// 		circle(ctx, target.x, target.y, 4);
	// 	}
	// 	ant.seek(target);
	// 	ant.update();
	// 	ant.draw();
	// }

	frames++;
	if (frames == 100) {
		console.timeEnd('perf');
	}
	lastUpdateTime = currentTime;
}
