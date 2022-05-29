import Ant from './classes/Ant';
import Colony from './classes/Colony';
import Food from './classes/Food';
import Marker from './classes/Marker';
import { circle } from './classes/Shapes';
import { createVector } from './classes/Vector';
import WorldCanvas, { calcWorldSize } from './classes/WorldCanvas';
import WorldGrid from './classes/WorldGrid';
import {
	AntStates,
	CanvasOptions,
	FoodOptions,
	MarkerOptions,
	MIDDLE_BUTTON,
	RIGHT_BUTTON,
} from './constants';
import './style.css';

const canvasContainer = document.getElementById(
	'canvas-container',
) as HTMLDivElement;
const cameraContainer = document.getElementById(
	'camera-container',
) as HTMLDivElement;
const btnFullscreen = document.getElementById(
	'btn-fullscreen',
) as HTMLButtonElement;
const btnPan = document.getElementById('btn-pan') as HTMLButtonElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const canvasMarkers = document.getElementById(
	'canvas-markers',
) as HTMLCanvasElement;
const canvasFood = document.getElementById('canvas-food') as HTMLCanvasElement;
const canvasColony = document.getElementById(
	'canvas-colony',
) as HTMLCanvasElement;
const canvasWalls = document.getElementById(
	'canvas-walls',
) as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const antIcon = document.getElementById('antIcon') as SVGElement | null;

const btnAntPanel = document.getElementById(
	'btn-ant-panel',
) as HTMLButtonElement;
const antPanel = document.getElementById('antPanel') as HTMLDivElement;
const antId = document.querySelector<HTMLSpanElement>('[data-id]');
const antPos = document.querySelector<HTMLSpanElement>('[data-pos]');
const antVel = document.querySelector<HTMLSpanElement>('[data-vel]');
const antState = document.querySelector<HTMLSpanElement>('[data-state]');
const btnTrack = document.getElementById('btn-track') as HTMLButtonElement;

const btnCellPanel = document.getElementById(
	'btn-cell-panel',
) as HTMLButtonElement;
const cellPanel = document.getElementById('cellPanel') as HTMLDivElement;
const cellPreview = document.querySelector<HTMLDivElement>(
	'[data-cell-preview]',
);
const markerIntensityHome = document.querySelector<HTMLSpanElement>(
	'[data-intensity-home]',
);
const markerIntensityFood = document.querySelector<HTMLSpanElement>(
	'[data-intensity-food]',
);
const cellFood = document.querySelector<HTMLSpanElement>('[data-cell-food]');

const btnColonyPanel = document.getElementById(
	'btn-colony-panel',
) as HTMLButtonElement;
const colonyPanel = document.getElementById('colonyPanel') as HTMLDivElement;
const colonyPreview = document.querySelector<HTMLDivElement>(
	'[data-colony-preview]',
);
const colonyPopulation =
	document.querySelector<HTMLSpanElement>('[data-colony-pop]');
const colonyFood =
	document.querySelector<HTMLSpanElement>('[data-colony-food]');

const pauseIndicator = document.querySelector<HTMLDivElement>('[data-pause]');

let isRunning = false;
let isDrawingMarkers = true;
let isDebugMode = false;
let isTracking = false;
let isFoodMode = false;
let isPanMode = false;

let isColonyPanelVisible = false;
let isCellPanelVisible = false;
let isAntPanelVisible = false;

let lastUpdateTime = 0;
const SPEED = 10;
let frames = 0;
let mainLoopAnimationFrame = -1;
let selectedAnt: Ant | null = null;

let offsetY = canvasContainer.getBoundingClientRect().top;
let mouseX = 0;
let mouseY = 0;
let canvasScale = 1;
let isPanning = false;
let wasPanning = false;
let panningTimeout = 0;
let panStart = {
	x: 0,
	y: 0,
};
let cameraOffset = {
	x: 0,
	y: 0,
};

// Grids
let [width, height] = calcWorldSize({
	width: CanvasOptions.WIDTH,
	height: CanvasOptions.HEIGHT,
	cellSize: MarkerOptions.SIZE,
});

let markersGrid = new WorldCanvas(canvasMarkers, {
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});
canvasMarkers.style.transform = `scale(${MarkerOptions.SIZE})`;
let ctxMarkers = markersGrid.create();

let foodGrid = new WorldCanvas(canvasFood, {
	width: width / (MarkerOptions.SIZE / FoodOptions.SIZE),
	height: height / (MarkerOptions.SIZE / FoodOptions.SIZE),
	cellSize: MarkerOptions.SIZE / FoodOptions.SIZE,
});
canvasFood.style.transform = `scale(${MarkerOptions.SIZE / FoodOptions.SIZE})`;
let ctxFood = foodGrid.create();

let antGrid = new WorldCanvas(canvas, {
	width: width,
	height: height,
	cellSize: MarkerOptions.SIZE,
});
let ctxAnt = antGrid.create();

let colonyGrid = new WorldCanvas(canvasColony, {
	width: width,
	height: height,
	cellSize: MarkerOptions.SIZE,
});
let ctxColony = colonyGrid.create();

let wallsGrid = new WorldCanvas(canvasWalls, {
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});
canvasWalls.style.transform = `scale(${MarkerOptions.SIZE})`;
let ctxWalls = wallsGrid.create();

let worldGrid = new WorldGrid({
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});

let markersImageData = ctxMarkers?.createImageData(
	worldGrid.width,
	worldGrid.height,
);

let colony = new Colony({
	id: 1,
	pos: {
		x: canvas.width / 2,
		y: canvas.height / 2,
	},
});

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
			break;
		case 'KeyT':
			toggleTrack();
			break;
		case 'KeyC':
			alignCamera();
			break;
		case 'KeyF':
			toggleFoodMode();
		case 'KeyA':
			toggleAnts();
		default:
			break;
	}
});

canvasContainer.addEventListener('mousemove', (e) => {
	mouseX = e.pageX;
	mouseY = e.pageY - offsetY;
});

canvasContainer.addEventListener('click', (e) => {
	// Abort click after panning
	if (wasPanning) {
		wasPanning = false;
		return;
	}
	console.log('click');
	console.log(e);

	selectAnt();
	if (isDebugMode) {
		toggleAntDebug();
	}
});

canvasContainer.addEventListener('contextmenu', (e) => {
	e.preventDefault();
	console.log(e);
	let target = createVector(
		// (mouseX - cameraOffset.x * canvasScale) / canvasScale,
		// (mouseY - cameraOffset.y * canvasScale) / canvasScale,
		Math.floor((mouseX / canvasScale - cameraOffset.x) / MarkerOptions.SIZE),
		Math.floor((mouseY / canvasScale - cameraOffset.y) / MarkerOptions.SIZE),
	);

	if (isDebugMode) {
		console.log(`Placed food at: ${target.x}:${target.y}`);
	}
	worldGrid.addFood(target.x, target.y, 10);
});

canvasContainer.addEventListener('wheel', (e) => {
	zoomCanvas(e);
});

btnFullscreen.addEventListener('click', () => {
	alignCamera();
});

btnTrack.addEventListener('click', () => {
	toggleTrack();
});

btnPan.addEventListener('click', () => {
	togglePanMode();
});

btnColonyPanel.addEventListener('click', () => {
	isColonyPanelVisible = togglePanelAndButton(
		isColonyPanelVisible,
		colonyPanel,
		btnColonyPanel,
	);
});

isColonyPanelVisible = togglePanelAndButton(
	isColonyPanelVisible,
	colonyPanel,
	btnColonyPanel,
);

btnCellPanel.addEventListener('click', () => {
	isCellPanelVisible = togglePanelAndButton(
		isCellPanelVisible,
		cellPanel,
		btnCellPanel,
	);
});

btnAntPanel.addEventListener('click', () => {
	isAntPanelVisible = togglePanelAndButton(
		isAntPanelVisible,
		antPanel,
		btnAntPanel,
	);
});

function togglePanelAndButton(
	isVisible: boolean,
	panel: HTMLDivElement,
	button: HTMLButtonElement,
) {
	isVisible = !isVisible;

	if (!isVisible) {
		panel.style.display = 'none';
		button.classList.add('border-red-500');
		button.classList.remove('border-green-500');
	} else {
		panel.style.display = 'block';
		button.classList.add('border-green-500');
		button.classList.remove('border-red-500');
	}

	return isVisible;
}

setup();
setupCamera();
alignCamera();

function setup() {
	if (
		ctxMarkers == null ||
		ctxFood == null ||
		ctx == null ||
		ctxColony == null ||
		ctxWalls == null
	)
		return;

	canvas.width = CanvasOptions.WIDTH;
	canvas.height = CanvasOptions.HEIGHT;
	// canvas.width = window.innerWidth;
	// canvas.height = window.innerHeight;

	let count = 0;

	// for (let i = 0; i < Math.floor(canvas.width / MarkerOptions.WIDTH); i++) {
	// 	for (let j = 0; j < Math.floor(canvas.height / MarkerOptions.HEIGHT); j++) {
	// 		let random = Math.floor(Math.random() * 3) + 1;
	// 		let type = 0;

	// 		if (random == 1) {
	// 			type = MarkerTypes.TO_HOME;
	// 		} else if (random == 2) {
	// 			type = MarkerTypes.TO_FOOD;
	// 		} else {
	// 			type = MarkerTypes.NO_FOOD;
	// 		}

	// 		count++;
	// 		let marker = new Marker(
	// 			ctx,
	// 			i * MarkerOptions.WIDTH,
	// 			j * MarkerOptions.HEIGHT,
	// 			type,
	// 			Math.random(),
	// 		);
	// 		markers.push(marker);
	// 		marker.draw();
	// 	}
	// }

	// for (let x = 0; x < canvasMarkers.height; x++) {
	// 	for (let y = 0; y < canvasMarkers.width; y++) {
	// 		let random = Math.floor(Math.random() * 3) + 1;
	// 		let type = 0;

	// 		if (random == 1) {
	// 			type = MarkerTypes.TO_HOME;
	// 		} else if (random == 2) {
	// 			type = MarkerTypes.TO_FOOD;
	// 		}

	// 		count++;
	// 		let marker = new Marker(ctxMarkers, y, x, [Math.random(), Math.random()]);
	// 		markers.push(marker);
	// 		marker.draw();
	// 	}
	// }

	// for (let x = 0; x < canvasMarkers.height; x++) {
	// 	for (let y = 0; y < canvasMarkers.width; y++) {
	// 		if (Math.random() < 0.05) {
	// 			let food = new Food(ctxFood, y * 8, x * 8, 100);
	// 			foods.push(food);
	// 			food.draw();
	// 		}
	// 	}
	// }

	// for (let x = 0; x < worldGrid.width; x++) {
	// 	for (let y = 0; y < worldGrid.height; y++) {
	// 		let random = Math.floor(Math.random() * 2) + 1;
	// 		let type = 0;

	// 		if (random == 1) {
	// 			type = MarkerTypes.TO_HOME;
	// 		} else if (random == 2) {
	// 			type = MarkerTypes.TO_FOOD;
	// 		}

	// 		worldGrid.addMarker(x, y, type, Math.random());

	// 		if (Math.random() < 0.05) {
	// 			// worldGrid.addFood(x, y, randomInt(0, 100));
	// 		}
	// 	}
	// }

	if (markersImageData) {
		worldGrid.drawMarkers(ctxMarkers, markersImageData);
		worldGrid.drawFood(ctxFood);
	}
	console.log(worldGrid);

	// let food = new Food(ctxFood, 800 - 8, 600 - 8, 100);
	// food.draw();

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

			// for (let i = 0; i < ANT_AMOUNT; i++) {
			// 	ant = new Ant(ctx, ant4, {
			// 		id: i + 1,
			// 		pos: {
			// 			x: Math.floor(Math.random() * canvas.width),
			// 			y: Math.floor(Math.random() * canvas.height),
			// 		},
			// 	});
			// 	ant.draw();
			// 	ants.push(ant);
			// }

			colony.initialize(ant4, ctx);
		};
	}

	console.time('perf');
	console.log(count);

	colony.drawColony(ctxColony);

	worldGrid.initializeBorderWalls();
	worldGrid.drawBorderWalls(ctxWalls);
}

function toggleLoop() {
	isRunning = !isRunning;

	colony.isRunning = isRunning;

	pauseIndicator!.style.display = isRunning ? 'none' : 'block';
	if (isRunning) {
		console.log('Play');
		// mainLoopAnimationFrame = window.requestAnimationFrame(main);
	} else {
		console.log('Pause');
		// cancelAnimationFrame(mainLoopAnimationFrame);
	}
}

mainLoopAnimationFrame = window.requestAnimationFrame(main);

function toggleMarkers() {
	isDrawingMarkers = !isDrawingMarkers;
}

function toggleDebug() {
	isDebugMode = !isDebugMode;

	colony.isDebugMode = isDebugMode;
	toggleAntDebug();
	isCellPanelVisible = togglePanelAndButton(
		isCellPanelVisible,
		cellPanel,
		btnCellPanel,
	);
}

function toggleAntDebug() {
	colony.toggleAntDebug();

	// if (ants.length > 0 && selectedAnt) {
	// 	for (const ant of ants) {
	// 		if (ant.id === selectedAnt.id) {
	// 			ant.debug = isDebugMode;
	// 		} else {
	// 			ant.debug = false;
	// 		}
	// 	}
	// }
}

function toggleTrack() {
	isTracking = !isTracking;

	if (isTracking) {
		canvasScale = 3;
	}
	btnTrack.classList.toggle('border-green-500');
	btnTrack.classList.toggle('border-red-500');
}

function toggleFoodMode() {
	isFoodMode = !isFoodMode;
}

function togglePanMode() {
	isPanMode = !isPanMode;

	btnPan.classList.toggle('bg-neutral-600');
}

function toggleAnts() {
	colony.isDrawingAnts = !colony.isDrawingAnts;
}

function selectAnt() {
	// if (ants.length <= 0) return null;

	// let newAnt = selectedAnt;
	// let minDist = Infinity;
	let mouseVector = createVector(
		mouseX / canvasScale - cameraOffset.x,
		mouseY / canvasScale - cameraOffset.y,
	);
	// let radius = AntOptions.IMG_HEIGHT / 2;

	// for (const ant of ants) {
	// 	let dist = ant.pos.dist(mouseVector);
	// 	if (dist < minDist && dist < radius) {
	// 		minDist = dist;
	// 		newAnt = ant;
	// 	}
	// }

	// console.log(newAnt);
	// return newAnt;

	colony.selectAnt(mouseVector);
	if (colony.selectedAnt) {
		isAntPanelVisible = false;
	} else {
		isAntPanelVisible = true;
	}
	isAntPanelVisible = togglePanelAndButton(
		isAntPanelVisible,
		antPanel,
		btnAntPanel,
	);
}

function updateAntInfo() {
	let selectedAnt = colony.selectedAnt;
	if (!selectedAnt) return;

	antId!.textContent = selectedAnt.id.toString();
	antPos!.textContent = `${selectedAnt.pos.x.toFixed(
		2,
	)} : ${selectedAnt.pos.y.toFixed(2)}`;
	antVel!.textContent = `${selectedAnt.vel.x.toFixed(
		2,
	)} : ${selectedAnt.vel.y.toFixed(2)}`;
	let state = '';
	switch (selectedAnt.state) {
		case AntStates.TO_HOME:
			state = 'To Home';
			break;
		case AntStates.TO_FOOD:
			state = 'To Food';
			break;
		case AntStates.REFILL:
			state = 'Refill';
			break;
		default:
			break;
	}
	antState!.textContent = state;
}

function updateCellInfo(x: number, y: number) {
	let cell = worldGrid.getCellFromCoordsSafe(x, y);
	if (!cell) return;

	markerIntensityHome!.textContent = cell.marker.intensity[0].toFixed(2);
	markerIntensityFood!.textContent = cell.marker.intensity[1].toFixed(2);
	cellFood!.textContent = cell.food.quantity.toString();
	let color = cell.marker.getMixedColor();
	cellPreview!.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function updateColonyInfo() {
	if (!colony) return;

	colonyPopulation!.textContent = `${colony.ants.length} | ${colony.totalAnts}`;
	colonyFood!.textContent = `${colony.food} | ${colony.totalFood}`;
	let color = colony.colonyColor;
	colonyPreview!.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function setupCamera() {
	canvasContainer.addEventListener('mousedown', (e) => {
		clearTimeout(panningTimeout);
		if (e.buttons == RIGHT_BUTTON) return;

		// Start panning with middle mouse button immediately
		if (e.buttons == MIDDLE_BUTTON) {
			isPanning = true;
			wasPanning = false;
			togglePanMode();
			document.body.classList.add('cursor-grabbing');

			panStart.x = e.clientX / canvasScale - cameraOffset.x;
			panStart.y = (e.clientY - offsetY) / canvasScale - cameraOffset.y;
		} else {
			// Start panning with every other button except right one after set timeout
			isPanning = false;
			panningTimeout = setTimeout(() => {
				isPanning = true;
				wasPanning = true;
				togglePanMode();
				document.body.classList.add('cursor-grabbing');

				panStart.x = e.clientX / canvasScale - cameraOffset.x;
				panStart.y = (e.clientY - offsetY) / canvasScale - cameraOffset.y;
			}, 100);
		}
	});

	canvasContainer.addEventListener('mousemove', (e) => {
		if (!isPanning || e.buttons == RIGHT_BUTTON) return;

		panCanvas(e);
	});

	canvasContainer.addEventListener('mouseup', () => {
		console.log('mouse up');

		clearTimeout(panningTimeout);
		if (isPanning) {
			isPanning = false;
			togglePanMode();
			document.body.classList.remove('cursor-grabbing');
		}
	});
}

function zoomCanvas(event: WheelEvent) {
	let zoomOffset = {
		x: 0,
		y: 0,
	};

	zoomOffset.x = event.clientX / canvasScale - cameraOffset.x;
	zoomOffset.y = (event.clientY - offsetY) / canvasScale - cameraOffset.y;

	canvasScale *= 0.999 ** event.deltaY;
	canvasScale = Math.min(Math.max(0.25, canvasScale), 16);

	cameraOffset.x = event.clientX / canvasScale - zoomOffset.x;
	cameraOffset.y = (event.clientY - offsetY) / canvasScale - zoomOffset.y;

	setCamera();
}

function panCanvas(event: MouseEvent) {
	cameraOffset.x = event.clientX / canvasScale - panStart.x;
	cameraOffset.y = (event.clientY - offsetY) / canvasScale - panStart.y;

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

function trackAntCamera(x: number, y: number) {
	let antCenter = {
		x: window.innerWidth / 2 / canvasScale - x,
		y: window.innerHeight / 2 / canvasScale - y,
	};

	cameraOffset.x = antCenter.x;
	cameraOffset.y = antCenter.y;

	setCamera();
}

function main(currentTime: number) {
	if (
		ctxMarkers == null ||
		ctxFood == null ||
		ctx == null ||
		ctxColony == null ||
		ctxWalls == null
	)
		return;

	mainLoopAnimationFrame = window.requestAnimationFrame(main);

	const deltaTime = (currentTime - lastUpdateTime) / 1000;

	// console.time('Frame time: ');

	// if (deltaTime < 1 / 25) {
	// 	return;
	// }
	// console.log('update');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctxMarkers.clearRect(0, 0, canvas.width, canvas.height);
	ctxFood.clearRect(0, 0, canvas.width, canvas.height);

	// for (let i = 0; i < markers.length; i++) {
	// 	// console.log(markers[i].intensity);
	// 	// console.log(`i: ${i}, x: ${markers[i].x}, y: ${markers[i].y}`);
	// 	markers[i].update();
	// 	if (isDrawingMarkers) {
	// 		markers[i].draw();
	// 	}
	// }

	// if (isDebugMode) {
	// 	console.time('Time to draw markers');
	// }

	// worldGrid.update();
	if (isDrawingMarkers && markersImageData) {
		worldGrid.drawMarkers(ctxMarkers, markersImageData, isRunning);
	} else if (isRunning) {
		worldGrid.update();
	}
	worldGrid.drawFood(ctxFood);
	// if (isDrawingMarkers) {
	// 	let markersImageData = ctxMarkers.createImageData(
	// 		canvasMarkers.width,
	// 		canvasMarkers.height,
	// 	);

	// 	for (let i = 0; i < markersImageData.data.length; i += 4) {
	// 		let [r, g, b] = MarkerColors[markers[i / 4].type];
	// 		// Modify pixel data
	// 		markersImageData.data[i + 0] = r; // R value
	// 		markersImageData.data[i + 1] = g; // G value
	// 		markersImageData.data[i + 2] = b; // B value
	// 		markersImageData.data[i + 3] = 255 * markers[i / 4].intensity; // A value

	// 		markers[i / 4].update();
	// 	}
	// 	ctxMarkers.putImageData(markersImageData, 0, 0);
	// } else {
	// 	for (let i = 0; i < markers.length; i++) {
	// 		markers[i].update();
	// 	}
	// }
	// if (isDebugMode) {
	// 	console.timeEnd('Time to draw markers');
	// }

	let target = createVector(
		// (mouseX - cameraOffset.x * canvasScale) / canvasScale,
		// (mouseY - cameraOffset.y * canvasScale) / canvasScale,
		mouseX / canvasScale - cameraOffset.x,
		mouseY / canvasScale - cameraOffset.y,
	);

	// for (const ant of ants) {
	// 	// console.log(ant);

	// 	// ant.seek(target);
	// 	if (isRunning) {
	// 		ant.search(worldGrid, colony, deltaTime);
	// 		ant.update(deltaTime);
	// 		ant.addMarker(worldGrid, deltaTime);
	// 		ant.checkColony(colony, deltaTime);
	// 	}
	// 	ant.draw();

	// 	if (ant.id === selectedAnt?.id) {
	// 		updateAntInfo();
	// 		if (isTracking) {
	// 			trackAntCamera(ant.pos.x, ant.pos.y);
	// 		}
	// 	}
	// }

	colony.updateColony(deltaTime);
	colony.updateAndDrawAnts(worldGrid, selectedAnt?.id, deltaTime);
	updateAntInfo();
	if (isTracking && colony.selectedAnt) {
		trackAntCamera(colony.selectedAnt.pos.x, colony.selectedAnt.pos.y);
	}

	if (isDebugMode) {
		ctx.fillStyle = 'red';
		circle(ctx, target.x, target.y, 4);
		updateCellInfo(target.x, target.y);
	}

	updateColonyInfo();

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

	// console.timeEnd('Frame time: ');

	frames++;
	if (frames == 100) {
		console.timeEnd('perf');
	}
	lastUpdateTime = currentTime;
}
