import Colony from './classes/Colony';
import ImageInstance from './classes/ImageInstance';
import MapGenerator from './classes/MapGenerator';
import PerformanceStats from './classes/PerformanceStats';
import { circle } from './classes/Shapes';
import { toggleButton, togglePanelAndButton } from './classes/Utils';
import { createVector } from './classes/Vector';
import WorldCanvas, { calcWorldSize } from './classes/WorldCanvas';
import WorldGrid from './classes/WorldGrid';
import {
	AntOptions,
	AntStates,
	BrushOptions,
	CAMERA_MOVE_BY,
	CanvasOptions,
	FoodOptions,
	MapGeneratorOptions,
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
// Canvases
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
const canvasEdit = document.getElementById('canvas-edit') as HTMLCanvasElement;
const canvasEditPreview = document.getElementById(
	'canvas-edit-preview',
) as HTMLCanvasElement;

const antIcon = document.getElementById('antIcon') as SVGElement | null;

// Ant panel
const btnAntPanel = document.getElementById(
	'btn-ant-panel',
) as HTMLButtonElement;
const antPanel = document.getElementById('antPanel') as HTMLDivElement;
const antId = document.querySelector<HTMLSpanElement>('[data-id]');
const antPos = document.querySelector<HTMLSpanElement>('[data-pos]');
const antVel = document.querySelector<HTMLSpanElement>('[data-vel]');
const antState = document.querySelector<HTMLSpanElement>('[data-state]');
const antLifespanPreview = document.querySelector<HTMLDivElement>(
	'[data-lifespan-preview]',
);
const antLifespan = document.querySelector<HTMLSpanElement>('[data-lifespan]');
const btnTrack = document.getElementById('btn-track') as HTMLButtonElement;
const btnRemove = document.getElementById('btn-remove') as HTMLButtonElement;

// Cell panel
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
const cellDensity = document.querySelector<HTMLSpanElement>('[data-density]');

// Colony panel
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

// Time controls
const pauseIndicator = document.querySelector<HTMLDivElement>('[data-pause]');
const btnPlay = document.getElementById('btn-play') as HTMLButtonElement;
const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;

// Edit panel
const btnEditMode = document.getElementById(
	'btn-edit-mode',
) as HTMLButtonElement;
const editPanel = document.getElementById('editPanel') as HTMLDivElement;
const brushSizePreview = document.querySelector(
	'[data-brush-preview]',
) as HTMLDivElement;
const brushSizeText = document.querySelector(
	'[data-brush-size]',
) as HTMLSpanElement;
const brushSizeInput = document.getElementById(
	'brushSizeInput',
) as HTMLInputElement;
const btnWallBrush = document.getElementById(
	'btn-wall-brush',
) as HTMLButtonElement;
const btnFoodBrush = document.getElementById(
	'btn-food-brush',
) as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;

// Controls
const btnControls = document.getElementById(
	'btn-controls',
) as HTMLButtonElement;
const btnCloseControls = document.getElementById(
	'btn-close-controls',
) as HTMLButtonElement;
const controlsPanel = document.getElementById(
	'controlsPanel',
) as HTMLDivElement;

const performanceDisplay = document.querySelector(
	'[data-performance-display]',
) as HTMLDivElement;

const btnGenerateMap = document.getElementById(
	'btn-generate-map',
) as HTMLButtonElement;

let isRunning = false;
let isDrawingMarkers = true;
let isDrawingDensity = false;
let isDrawingAdvancedDensity = false;
let isDebugMode = false;
let isTracking = false;
let isEditMode = false;
let isHolding = false;
let isErasing = false;
let isWallMode = false;
let isFoodMode = false;
let isPanMode = false;
let isFirstTime = true;

let isColonyPanelVisible = false;
let isCellPanelVisible = false;
let isAntPanelVisible = false;
let isControlsPanelVisible = false;

let lastUpdateTime = 0;
// let mainLoopAnimationFrame = -1;
// let performanceStats = new PerformanceStats();
const performanceStats = new PerformanceStats([
	{
		mode: 0,
		stats: [
			{ name: 'fps', title: 'Frames per second' },
			{ name: 'ms', title: 'Milliseconds to render a frame' },
		],
	},
	{
		mode: 1,
		stats: [
			{ name: 'clear', title: 'Milliseconds to clear the screen' },
			{
				name: 'grid',
				title: 'Milliseconds to draw markers/density and update cells',
			},
			{ name: 'food', title: 'Milliseconds to draw food' },
			{ name: 'ants', title: 'Milliseconds to draw and update ants' },
			{ name: 'panels', title: 'Milliseconds to update info panels' },
			{ name: 'all', title: 'Milliseconds needed for main loop' },
		],
	},
]);
const [
	fpsDisplay,
	msDisplay,
	clearDisplay,
	gridDisplay,
	foodDisplay,
	antsDisplay,
	panelsDisplay,
	allDisplay,
] = performanceStats.createPerformanceDisplay(performanceDisplay);

const offsetY = canvasContainer.getBoundingClientRect().top;
let mouseX = 0;
let mouseY = 0;
let canvasScale = 1;
let isPanning = false;
let wasPanning = false;
let panningTimeout = 0;
const panStart = {
	x: 0,
	y: 0,
};
const cameraOffset = {
	x: 0,
	y: 0,
};

let brushSize = 5;

// Grids
const [width, height] = calcWorldSize({
	width: CanvasOptions.WIDTH,
	height: CanvasOptions.HEIGHT,
	cellSize: MarkerOptions.SIZE,
});

const markersGrid = new WorldCanvas(canvasMarkers, {
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});
canvasMarkers.style.transform = `scale(${MarkerOptions.SIZE})`;
const ctxMarkers = markersGrid.create();

const foodGrid = new WorldCanvas(canvasFood, {
	width: width / (MarkerOptions.SIZE / FoodOptions.SIZE),
	height: height / (MarkerOptions.SIZE / FoodOptions.SIZE),
	cellSize: MarkerOptions.SIZE / FoodOptions.SIZE,
});
canvasFood.style.transform = `scale(${MarkerOptions.SIZE / FoodOptions.SIZE})`;
const ctxFood = foodGrid.create();

const antsGrid = new WorldCanvas(canvas, {
	width: width,
	height: height,
	cellSize: MarkerOptions.SIZE,
});
const ctxAnts = antsGrid.create();

const canvasAntInstance = new ImageInstance({
	width: AntOptions.IMG_WIDTH,
	height: AntOptions.IMG_HEIGHT,
});

const canvasAntFoodInstance = new ImageInstance({
	width: AntOptions.FOOD_SIZE,
	height: AntOptions.FOOD_SIZE,
});

const colonyGrid = new WorldCanvas(canvasColony, {
	width: width,
	height: height,
	cellSize: MarkerOptions.SIZE,
});
const ctxColony = colonyGrid.create();

const wallsGrid = new WorldCanvas(canvasWalls, {
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});
canvasWalls.style.transform = `scale(${MarkerOptions.SIZE})`;
const ctxWalls = wallsGrid.create();

const editGrid = new WorldCanvas(canvasEdit, {
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});
canvasEdit.style.transform = `scale(${MarkerOptions.SIZE})`;
const ctxEdit = editGrid.create();

const editPreviewGrid = new WorldCanvas(canvasEditPreview, {
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});
canvasEditPreview.style.transform = `scale(${MarkerOptions.SIZE})`;
const ctxEditPreview = editPreviewGrid.create();

const worldGrid = new WorldGrid({
	width: width / MarkerOptions.SIZE,
	height: height / MarkerOptions.SIZE,
	cellSize: 1,
});

const mapGenerator = new MapGenerator({
	width: worldGrid.width,
	height: worldGrid.height,
	fillRatio: MapGeneratorOptions.FILL_RATIO,
});

// Markers image data
const markersImageData = ctxMarkers?.createImageData(
	worldGrid.width,
	worldGrid.height,
);

// Density image data
const densityImageData = ctxMarkers?.createImageData(
	worldGrid.width,
	worldGrid.height,
);

// Colony
const colony = new Colony({
	id: 1,
	pos: {
		x: width / 2,
		y: height / 2,
	},
});

window.addEventListener('keydown', (e) => {
	console.log(e);

	switch (e.code) {
		case 'Space':
			e.preventDefault();
			toggleLoop();
			break;
		case 'KeyM':
			toggleMarkers();
			break;
		case 'KeyN':
			toggleDensity();
			break;
		case 'KeyA':
			toggleAnts();
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
		case 'Delete':
			removeAnt();
			break;
		case 'Insert':
			for (let i = 0; i < (e.ctrlKey ? 10 : e.shiftKey ? 100 : 1); i++) {
				addAnt();
			}
			break;
		case 'KeyF':
			performanceStats.changeMode();
			break;
		case 'ArrowUp':
			moveCamera(0, CAMERA_MOVE_BY);
			break;
		case 'ArrowDown':
			moveCamera(0, -CAMERA_MOVE_BY);
			break;
		case 'ArrowLeft':
			moveCamera(CAMERA_MOVE_BY, 0);
			break;
		case 'ArrowRight':
			moveCamera(-CAMERA_MOVE_BY, 0);
			break;
		case 'Minus':
			zoomCamera(false);
			break;
		case 'Equal':
			zoomCamera(true);
			break;
		case 'Comma':
			changeBrushSize(-BrushOptions.STEP);
			break;
		case 'Period':
			changeBrushSize(BrushOptions.STEP);
			break;
		default:
			break;
	}
});

canvasContainer.addEventListener('mousemove', (e) => {
	mouseX = e.pageX;
	mouseY = e.pageY - offsetY;
});

canvasContainer.addEventListener('click', () => {
	// Abort click after panning
	if (wasPanning) {
		wasPanning = false;
		return;
	}

	selectAnt();
	if (isDebugMode) {
		toggleAntDebug();
	}
});

canvasContainer.addEventListener('contextmenu', (e) => {
	e.preventDefault();
	if (isEditMode) return;
	const target = createVector(
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

btnRemove.addEventListener('click', () => {
	removeAnt();
});

btnPlay.addEventListener('click', () => {
	toggleLoop();
});

btnPause.addEventListener('click', () => {
	toggleLoop();
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

btnControls.addEventListener('click', () => {
	isControlsPanelVisible = togglePanelAndButton(
		isControlsPanelVisible,
		controlsPanel,
	);
});

btnCloseControls.addEventListener('click', () => {
	isControlsPanelVisible = true;
	isControlsPanelVisible = togglePanelAndButton(
		isControlsPanelVisible,
		controlsPanel,
	);
});

btnGenerateMap.addEventListener('click', () => {
	if (confirm('Are you sure you want to generate a new map?')) {
		if (ctxWalls) {
			ctxWalls.clearRect(0, 0, worldGrid.width, worldGrid.height);
			mapGenerator.generateMap(worldGrid);
			worldGrid.drawWalls(ctxWalls);
		}
	}
});

btnEditMode.addEventListener('click', () => {
	isEditMode = togglePanelAndButton(isEditMode, editPanel, btnEditMode);
	if (isEditMode) {
		canvasEdit.style.display = 'block';
		canvasEditPreview.style.display = 'block';
	} else {
		canvasEdit.style.display = 'none';
		canvasEditPreview.style.display = 'none';
	}
});

btnWallBrush.addEventListener('click', () => {
	isWallMode = toggleButton(isWallMode, btnWallBrush);
	if (isWallMode) {
		isFoodMode = true;
		isFoodMode = toggleButton(isWallMode, btnFoodBrush);
	}
});

btnFoodBrush.addEventListener('click', () => {
	isFoodMode = toggleButton(isFoodMode, btnFoodBrush);
	if (isFoodMode) {
		isWallMode = true;
		isWallMode = toggleButton(isFoodMode, btnWallBrush);
	}
});

btnSave.addEventListener('click', () => {
	if (ctxEdit && ctxWalls) {
		const imageData = ctxEdit.getImageData(
			0,
			0,
			worldGrid.width,
			worldGrid.height,
		);

		ctxWalls.clearRect(0, 0, worldGrid.width, worldGrid.height);

		for (let i = 0; i < imageData.data.length; i += 4) {
			const cell = worldGrid.cells[i / 4];

			// Modify pixel data
			const r = imageData.data[i + 0]; // R value
			const g = imageData.data[i + 1]; // G value
			const b = imageData.data[i + 2]; // B value
			const a = imageData.data[i + 3]; // A value

			if (g <= 160 && g > 0 && g > r && g > b) {
				// Food
				if (cell.wall !== 1) {
					cell.food.quantity = Math.min(
						100,
						Math.round(100 * (a / 255)) + cell.food.quantity,
					);
					cell.food.changed = true;
				} else {
					cell.wall = 1;
				}
			} else if (r > 10 && g > 10 && b > 10 && r === g && g === b) {
				// Wall
				cell.wall = 1;
				cell.food.quantity = 0;
				cell.food.changed = true;
			} else if (a > 0) {
				cell.food.quantity = 0;
				cell.food.changed = true;
				cell.wall = 0;
			}
		}
		worldGrid.addBorderWalls();
		worldGrid.drawWalls(ctxWalls);
		ctxEdit.clearRect(0, 0, worldGrid.width, worldGrid.height);

		// Hide edit panel after save
		isEditMode = togglePanelAndButton(isEditMode, editPanel, btnEditMode);
		canvasEdit.style.display = 'none';
		canvasEditPreview.style.display = 'none';
	}
});

brushSizeInput.addEventListener('input', () => {
	brushSize = parseInt(brushSizeInput.value);
	updateBrushInfo();
});

function setupBrushInput() {
	brushSizeInput.min = BrushOptions.MIN_SIZE.toString();
	brushSizeInput.max = BrushOptions.MAX_SIZE.toString();
	brushSizeInput.step = BrushOptions.STEP.toString();
	brushSizeInput.value = brushSize.toString();
}

function updateBrushInfo() {
	brushSizePreview.style.width = `${brushSize}px`;
	brushSizePreview.style.height = `${brushSize}px`;
	brushSizeText.textContent = `${brushSize} px`;
}

function changeBrushSize(size: number) {
	brushSize = Math.min(
		BrushOptions.MAX_SIZE,
		Math.max(BrushOptions.MIN_SIZE, brushSize + size),
	);
	brushSizeInput.value = brushSize.toString();
	updateBrushInfo();
}

setupBrushInput();
updateBrushInfo();
isWallMode = toggleButton(isWallMode, btnWallBrush);

setup();
setupMousePanning();
alignCamera();

window.requestAnimationFrame(main);

function setup() {
	if (
		ctxMarkers == null ||
		ctxFood == null ||
		ctxAnts == null ||
		ctxColony == null ||
		ctxWalls == null ||
		ctxEdit == null ||
		ctxEditPreview == null
	)
		return;

	if (markersImageData) {
		worldGrid.drawMarkers(ctxMarkers, markersImageData);
		worldGrid.drawFood(ctxFood);
	}

	if (antIcon) {
		const xml = new XMLSerializer().serializeToString(antIcon);

		const svg64 = btoa(xml);
		const b64Start = 'data:image/svg+xml;base64,';
		const image64 = b64Start + svg64;

		const antImage = new Image();
		antImage.src = image64;
		antImage.onload = () => {
			const antImageInstance = canvasAntInstance.createInstance((ctx) => {
				ctx.drawImage(antImage, 0, 0);
			});
			const antFoodImageInstance = canvasAntFoodInstance.createInstance(
				(ctx) => {
					const offset = AntOptions.FOOD_SIZE / 2;
					ctx.fillStyle = `hsl(120, 40%, 43%)`;
					circle(ctx, offset, offset, AntOptions.FOOD_SIZE / 2);
				},
			);

			colony.initialize(
				antImage,
				antImageInstance,
				antFoodImageInstance,
				ctxAnts!,
				worldGrid,
			);
		};
	}

	colony.drawColony(ctxColony);

	worldGrid.addBorderWalls();
	worldGrid.drawWalls(ctxWalls);
}

function toggleLoop() {
	if (isFirstTime) {
		colony.isDrawingAnts = true;
		isFirstTime = false;
	}

	isRunning = !isRunning;

	colony.isRunning = isRunning;

	pauseIndicator!.style.display = isRunning ? 'none' : 'block';
	btnPlay.style.display = isRunning ? 'none' : 'flex';
	btnPause.style.display = isRunning ? 'flex' : 'none';
}

function toggleMarkers() {
	isDrawingMarkers = !isDrawingMarkers;
	if (isDrawingMarkers) {
		isDrawingDensity = false;
		isDrawingAdvancedDensity = false;
	}
}

function toggleDensity() {
	isDrawingAdvancedDensity = isDrawingDensity
		? !isDrawingAdvancedDensity
		: isDrawingAdvancedDensity;
	isDrawingDensity = isDrawingAdvancedDensity
		? isDrawingDensity
		: !isDrawingDensity;

	if (isDrawingDensity || isDrawingAdvancedDensity) {
		isDrawingMarkers = false;
	}
}

function toggleDebug() {
	isDebugMode = !isDebugMode;

	colony.isDebugMode = isDebugMode;
	toggleAntDebug();
	if (isDebugMode) {
		isCellPanelVisible = false;
	}
	isCellPanelVisible = togglePanelAndButton(
		isCellPanelVisible,
		cellPanel,
		btnCellPanel,
	);
}

function toggleAntDebug() {
	colony.toggleAntDebug();
}

function toggleTrack() {
	if (colony.selectedAnt == null) return;
	isTracking = !isTracking;

	if (isTracking) {
		canvasScale = 3;
	}
	btnTrack.classList.toggle('border-green-500');
	btnTrack.classList.toggle('border-red-500');
}

function togglePanMode() {
	isPanMode = !isPanMode;

	btnPan.classList.toggle('bg-neutral-600');
}

function toggleAnts() {
	if (isFirstTime) {
		isFirstTime = false;
		colony.isDrawingAnts = false;
		return;
	}

	colony.isDrawingAnts = !colony.isDrawingAnts;
}

function selectAnt() {
	const mouseVector = createVector(
		mouseX / canvasScale - cameraOffset.x,
		mouseY / canvasScale - cameraOffset.y,
	);

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

function removeAnt() {
	if (colony.removeAnt()) {
		isAntPanelVisible = true;
	} else {
		isAntPanelVisible = false;
	}

	isAntPanelVisible = togglePanelAndButton(
		isAntPanelVisible,
		antPanel,
		btnAntPanel,
	);
}

function addAnt() {
	colony.createAnt(true);
}

function updateAntInfo() {
	const selectedAnt = colony.selectedAnt;
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

	const refillThreshold = AntOptions.AUTONOMY_REFILL / selectedAnt.maxAutonomy;
	const autonomy = selectedAnt.internalClock / selectedAnt.maxAutonomy;
	antLifespanPreview!.style.setProperty('--left', `${refillThreshold * 100}%`);
	antLifespanPreview!.style.setProperty('--width', `${autonomy * 100}%`);
	antLifespan!.textContent = `${selectedAnt.internalClock.toFixed(
		2,
	)} | ${selectedAnt.maxAutonomy.toFixed(2)}`;
}

function updateCellInfo(x: number, y: number) {
	const cell = worldGrid.getCellFromCoordsSafe(x, y);
	if (!cell) return;

	markerIntensityHome!.textContent = cell.marker.intensity[0].toFixed(2);
	markerIntensityFood!.textContent = cell.marker.intensity[1].toFixed(2);
	cellFood!.textContent = cell.food.quantity.toString();
	cellDensity!.textContent = (
		cell.density[0] +
		cell.density[1] +
		cell.density[2]
	).toFixed(2);
	const color = cell.marker.getMixedColor();
	cellPreview!.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function updateColonyInfo() {
	if (!colony) return;

	colonyPopulation!.textContent = `${colony.ants.length} | ${colony.totalAnts}`;
	colonyFood!.textContent = `${colony.food.toFixed(2)} | ${colony.totalFood}`;
	const color = colony.colonyColor;
	colonyPreview!.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function updatePerformanceDisplay() {
	const avgMap = performanceStats.update();
	// console.log(...avgMap);

	fpsDisplay.textContent = `${Math.round(avgMap.get('fps') * 100) / 100} fps`;
	msDisplay.textContent = `${Math.round(avgMap.get('ms') * 100) / 100} ms`;
	clearDisplay.textContent = `${
		Math.round(avgMap.get('clear') * 100) / 100
	} ms`;
	gridDisplay.textContent = `${Math.round(avgMap.get('grid') * 100) / 100} ms`;
	foodDisplay.textContent = `${Math.round(avgMap.get('food') * 100) / 100} ms`;
	antsDisplay.textContent = `${Math.round(avgMap.get('ants') * 100) / 100} ms`;
	panelsDisplay.textContent = `${
		Math.round(avgMap.get('panels') * 100) / 100
	} ms`;
	allDisplay.textContent = `${Math.round(avgMap.get('all') * 100) / 100} ms`;

	if (avgMap.get('ms') > 16.7) {
		msDisplay.classList.add('text-red-500');
	} else {
		msDisplay.classList.remove('text-red-500');
	}
}

function setupMousePanning() {
	canvasContainer.addEventListener('mousedown', (e) => {
		clearTimeout(panningTimeout);
		if (e.buttons == RIGHT_BUTTON && isEditMode) {
			isErasing = true;
		} else if (e.buttons == RIGHT_BUTTON) return;

		// Start panning with middle mouse button immediately
		if (e.buttons == MIDDLE_BUTTON) {
			isPanning = true;
			wasPanning = false;
			togglePanMode();
			document.body.classList.add('cursor-grabbing');

			panStart.x = e.clientX / canvasScale - cameraOffset.x;
			panStart.y = (e.clientY - offsetY) / canvasScale - cameraOffset.y;
		} else {
			if (isEditMode) {
				isHolding = true;
				return;
			}
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
		clearTimeout(panningTimeout);
		isHolding = false;
		isErasing = false;
		if (isPanning) {
			isPanning = false;
			togglePanMode();
			document.body.classList.remove('cursor-grabbing');
		}
	});
}

function zoomCanvas(event: WheelEvent) {
	const zoomOffset = {
		x: 0,
		y: 0,
	};

	zoomOffset.x = event.clientX / canvasScale - cameraOffset.x;
	zoomOffset.y = (event.clientY - offsetY) / canvasScale - cameraOffset.y;

	canvasScale *= 0.999 ** event.deltaY;
	canvasScale = Math.min(Math.max(0.15, canvasScale), 16);

	cameraOffset.x = event.clientX / canvasScale - zoomOffset.x;
	cameraOffset.y = (event.clientY - offsetY) / canvasScale - zoomOffset.y;

	setCamera();
}

function panCanvas(event: MouseEvent) {
	cameraOffset.x = event.clientX / canvasScale - panStart.x;
	cameraOffset.y = (event.clientY - offsetY) / canvasScale - panStart.y;

	setCamera();
}

function moveCamera(x: number, y: number) {
	cameraOffset.x += x;
	cameraOffset.y += y;

	setCamera();
}

function zoomCamera(zoomIn: boolean) {
	const zoomOffset = {
		x: 0,
		y: 0,
	};

	zoomOffset.x = window.innerWidth / 2 / canvasScale - cameraOffset.x;
	zoomOffset.y = window.innerWidth / 2 / canvasScale - cameraOffset.y;

	canvasScale *= 0.999 ** (zoomIn ? -100 : 100);
	canvasScale = Math.min(Math.max(0.15, canvasScale), 16);

	cameraOffset.x = window.innerWidth / 2 / canvasScale - zoomOffset.x;
	cameraOffset.y = window.innerWidth / 2 / canvasScale - zoomOffset.y;

	setCamera();
}

function alignCamera() {
	const canvasCenter = {
		x: window.innerWidth / 2 - width / 2,
		y: window.innerHeight / 2 - height / 2,
	};

	canvasScale = 1;
	cameraOffset.x = canvasCenter.x;
	cameraOffset.y = canvasCenter.y;

	setCamera();
}

function trackAntCamera(x: number, y: number) {
	const antCenter = {
		x: window.innerWidth / 2 / canvasScale - x,
		y: window.innerHeight / 2 / canvasScale - y,
	};

	cameraOffset.x = antCenter.x;
	cameraOffset.y = antCenter.y;

	setCamera();
}

function setCamera() {
	cameraContainer.style.transform = `scale(${canvasScale}) translate(${cameraOffset.x}px, ${cameraOffset.y}px)`;
}

function main(currentTime: number) {
	if (
		ctxMarkers == null ||
		ctxFood == null ||
		ctxAnts == null ||
		ctxColony == null ||
		ctxWalls == null ||
		ctxEdit == null ||
		ctxEditPreview == null
	)
		return;

	window.requestAnimationFrame(main);
	performanceStats.startMeasurement('all');

	const deltaTime = (currentTime - lastUpdateTime) / 1000;

	if (performanceStats.isMeasuring) {
		performanceStats.setPerformance('fps', 1 / deltaTime);
		performanceStats.setPerformance('ms', currentTime - lastUpdateTime);
	}

	performanceStats.startMeasurement('clear');
	ctxAnts.clearRect(0, 0, width, height);
	ctxMarkers.clearRect(0, 0, worldGrid.width, worldGrid.height);
	performanceStats.endMeasurement('clear');

	performanceStats.startMeasurement('grid');
	if (isDrawingMarkers && markersImageData) {
		worldGrid.drawMarkers(ctxMarkers, markersImageData, isRunning);
	} else if (
		isDrawingDensity &&
		!isDrawingAdvancedDensity &&
		densityImageData
	) {
		worldGrid.drawDensity(ctxMarkers, densityImageData, isRunning);
	} else if (isDrawingDensity && isDrawingAdvancedDensity && densityImageData) {
		worldGrid.drawDensity(ctxMarkers, densityImageData, isRunning, true);
	} else if (isRunning) {
		worldGrid.update();
	}
	performanceStats.endMeasurement('grid');

	performanceStats.startMeasurement('food');
	worldGrid.drawFood(ctxFood);
	performanceStats.endMeasurement('food');

	const target = createVector(
		mouseX / canvasScale - cameraOffset.x,
		mouseY / canvasScale - cameraOffset.y,
	);

	if (isEditMode) {
		// Draw brush preview
		ctxEditPreview.clearRect(0, 0, worldGrid.width, worldGrid.height);
		ctxEditPreview.fillStyle = 'grey';
		const pos = worldGrid.getCellCoords(target.x, target.y);
		circle(ctxEditPreview, pos[0], pos[1], brushSize);

		if (isErasing) {
			// Erase
			ctxEdit.fillStyle = 'black';
			circle(ctxEdit, pos[0], pos[1], brushSize);
		} else if (isHolding) {
			// Draw walls/food
			if (isWallMode) {
				ctxEdit.fillStyle = 'rgb(163, 163, 163)';
			} else if (isFoodMode) {
				ctxEdit.fillStyle = 'rgb(66, 153, 66, 0.25)';
			}
			circle(ctxEdit, pos[0], pos[1], brushSize);
		}
	}

	colony.updateColony(deltaTime);
	performanceStats.startMeasurement('ants');
	colony.updateAndDrawAnts(worldGrid, deltaTime);
	performanceStats.endMeasurement('ants');

	performanceStats.startMeasurement('panels');
	updateAntInfo();
	if (isTracking && colony.selectedAnt) {
		trackAntCamera(colony.selectedAnt.pos.x, colony.selectedAnt.pos.y);
	}

	if (isDebugMode) {
		ctxAnts.fillStyle = 'red';
		circle(ctxAnts, target.x, target.y, 4);
		updateCellInfo(target.x, target.y);
	}

	updateColonyInfo();
	performanceStats.endMeasurement('panels');

	if (performanceStats.isMeasuring) {
		performanceStats.endMeasurement('all');
		updatePerformanceDisplay();
	}

	lastUpdateTime = currentTime;
}
