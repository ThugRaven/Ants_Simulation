import Colony from './classes/Colony';
import ImageInstance from './classes/ImageInstance';
import MapGenerator from './classes/MapGenerator';
import PerformanceStats from './classes/PerformanceStats';
import { circle, rect } from './classes/Shapes';
import { toggleButton, togglePanelAndButton } from './classes/Utils';
import { createVector } from './classes/Vector';
import WorldCanvas, { calcWorldSize } from './classes/WorldCanvas';
import WorldGrid from './classes/WorldGrid';
import {
	ANTS_DRAW_PERIOD,
	AntOptions,
	AntStates,
	BrushOptions,
	CAMERA_MOVE_BY,
	CanvasOptions,
	FoodOptions,
	MIDDLE_BUTTON,
	MapGeneratorOptions,
	MarkerOptions,
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

// Map panel
const mapPanel = document.getElementById('mapPanel') as HTMLDivElement;
const btnCloseMap = document.getElementById(
	'btn-close-map',
) as HTMLButtonElement;
const btnCancelMap = document.getElementById(
	'btn-cancel-map',
) as HTMLButtonElement;
const btnMapPanel = document.getElementById(
	'btn-map-panel',
) as HTMLButtonElement;
const btnGenerateSeed = document.getElementById(
	'btn-generate-seed',
) as HTMLButtonElement;
const btnGenerateSaveMap = document.getElementById(
	'btn-generate-save-map',
) as HTMLButtonElement;
const mapForm = document.getElementById('map-form') as HTMLFormElement;
const mapSeedInput = document.getElementById('map-seed') as HTMLInputElement;

// Layers
const btnAntsLayer = document.getElementById(
	'btn-ants-layer',
) as HTMLButtonElement;
const btnDensityLayer = document.getElementById(
	'btn-density-layer',
) as HTMLButtonElement;
const btnDensityAllLayer = document.getElementById(
	'btn-density-all-layer',
) as HTMLButtonElement;
const btnMarkersLayer = document.getElementById(
	'btn-markers-layer',
) as HTMLButtonElement;

let isRunning = false;
let isDrawingMarkers = true;
let isDrawingDensity = false;
let isDrawingAdvancedDensity = false;
let disableDensity = false;
let isDebugMode = false;
let isTracking = false;
let isEditMode = false;
let isHolding = false;
let isErasing = false;
let isWallMode = false;
let isFoodMode = false;
let isPanMode = false;
let isFirstTime = true;
let isInInputField = false;

let isColonyPanelVisible = false;
let isCellPanelVisible = false;
let isAntPanelVisible = false;
let isControlsPanelVisible = false;
let isMapPanelVisible = false;

let lastUpdateTime = 0;
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

export const offsetY = canvasContainer.getBoundingClientRect().top;
let mouseX = 0;
let mouseY = 0;
export let canvasScale = 1;
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
export const cameraCenter = {
	x: 0,
	y: 0,
};
let antsDrawClock = 0;
let scheduleRegularDraw = false;

let brushSize = 5;

// Initialize map seed input with parameter from url or empty string
const url = new URL(window.location.href);
const urlSeed = url.searchParams.get('seed');
let mapSeed = urlSeed ?? '';
mapSeedInput.value = mapSeed;

export let windowWidth = window.innerWidth;
export let windowHeight = window.innerHeight;

window.addEventListener('resize', () => {
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;

	const zoomOffset = {
		x: 0,
		y: 0,
	};

	zoomOffset.x = window.innerWidth / 2 / canvasScale - cameraOffset.x;
	zoomOffset.y = window.innerHeight / 2 / canvasScale - cameraOffset.y;

	cameraOffset.x = window.innerWidth / 2 / canvasScale - zoomOffset.x;
	cameraOffset.y = window.innerHeight / 2 / canvasScale - zoomOffset.y;

	cameraCenter.x =
		(window.innerWidth / 2 - window.innerWidth / 2) / canvasScale -
		zoomOffset.x;
	cameraCenter.y =
		(window.innerHeight / 2 - window.innerHeight / 2) / canvasScale -
		zoomOffset.y;
	cameraCenter.x =
		cameraCenter.x < 0 ? Math.abs(cameraCenter.x) : cameraCenter.x * -1;
	cameraCenter.y =
		cameraCenter.y < 0 ? Math.abs(cameraCenter.y) : cameraCenter.y * -1;

	setCamera();
});

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
	if (isInInputField) {
		return;
	}

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
		case 'Escape':
			if (isControlsPanelVisible) {
				isControlsPanelVisible = togglePanelAndButton(
					isControlsPanelVisible,
					controlsPanel,
				);
			}
			if (isMapPanelVisible) {
				isMapPanelVisible = togglePanelAndButton(isMapPanelVisible, mapPanel);
			}
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

	isMapPanelVisible = true;
	isMapPanelVisible = togglePanelAndButton(isMapPanelVisible, mapPanel);
});

btnCloseControls.addEventListener('click', () => {
	isControlsPanelVisible = true;
	isControlsPanelVisible = togglePanelAndButton(
		isControlsPanelVisible,
		controlsPanel,
	);
});

btnMapPanel.addEventListener('click', () => {
	isMapPanelVisible = togglePanelAndButton(isMapPanelVisible, mapPanel);

	isControlsPanelVisible = true;
	isControlsPanelVisible = togglePanelAndButton(
		isControlsPanelVisible,
		controlsPanel,
	);
});

btnCloseMap.addEventListener('click', () => {
	isMapPanelVisible = true;
	isMapPanelVisible = togglePanelAndButton(isMapPanelVisible, mapPanel);
});

btnCancelMap.addEventListener('click', () => {
	isMapPanelVisible = true;
	isMapPanelVisible = togglePanelAndButton(isMapPanelVisible, mapPanel);
});

btnGenerateSeed.addEventListener('click', () => {
	const seed = Math.random().toString(36).slice(2, 7);
	console.log(seed);
	mapSeedInput.value = seed;
});

btnAntsLayer.addEventListener('click', () => {
	toggleButton(colony.isDrawingAnts, btnAntsLayer);
	toggleAnts();
});

btnDensityLayer.addEventListener('click', () => {
	toggleButton(colony.isDrawingAnts, btnDensityLayer);
	toggleDensity(true, false);
});

btnDensityAllLayer.addEventListener('click', () => {
	toggleButton(colony.isDrawingAnts, btnDensityAllLayer);
	toggleDensity(false, true);
});

btnMarkersLayer.addEventListener('click', () => {
	toggleButton(colony.isDrawingAnts, btnMarkersLayer);
	toggleMarkers();
});

mapSeedInput.addEventListener('focus', () => {
	isInInputField = true;
});

mapSeedInput.addEventListener('blur', () => {
	isInInputField = false;
});

mapForm.addEventListener('submit', (e) => {
	console.log('submit', e);
	mapSeed = mapSeedInput.value;
	console.log(mapSeed);
	isMapPanelVisible = true;
	isMapPanelVisible = togglePanelAndButton(isMapPanelVisible, mapPanel);
	if (ctxWalls && mapSeed) {
		ctxWalls.clearRect(0, 0, worldGrid.width, worldGrid.height);
		mapGenerator.generateMap(worldGrid, false, mapSeed);
		worldGrid.drawWalls(ctxWalls);
	}
	e.preventDefault();
});

btnGenerateSaveMap.addEventListener('click', () => {
	isMapPanelVisible = true;
	isMapPanelVisible = togglePanelAndButton(isMapPanelVisible, mapPanel);
	if (ctxWalls) {
		ctxWalls.clearRect(0, 0, worldGrid.width, worldGrid.height);
		mapGenerator.generateMap(worldGrid, false);
		worldGrid.drawWalls(ctxWalls);
		mapSeedInput.value =
			new URL(window.location.href).searchParams.get('seed') ?? '';
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
			} else if (a > 0 && r < 5 && g < 5 && b < 5) {
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
				// const temp = new ImageInstance({
				// 	width: AntOptions.IMG_WIDTH,
				// 	height: AntOptions.IMG_HEIGHT,
				// });
				// ctx.imageSmoothingEnabled = false;

				// temp.createInstance((tempCtx, tempCanvas) => {
				// 	tempCanvas.width = antImage.width * 0.5;
				// 	tempCanvas.height = antImage.height * 0.5;
				// 	tempCtx.drawImage(
				// 		antImage,
				// 		0,
				// 		0,
				// 		tempCanvas.width,
				// 		tempCanvas.height,
				// 	);
				// 	ctx.drawImage(
				// 		tempCanvas,
				// 		0,
				// 		0,
				// 		tempCanvas.width,
				// 		tempCanvas.height,
				// 		0,
				// 		0,
				// 		canvasAntInstance.width,
				// 		canvasAntInstance.height,
				// 	);
				// });

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
				ctxAnts,
				worldGrid,
			);
		};
	}

	colony.drawColony(ctxColony);

	worldGrid.addBorderWalls();
	worldGrid.drawWalls(ctxWalls);

	mapGenerator.generateMap(worldGrid, true);
	worldGrid.drawWalls(ctxWalls);

	toggleButton(false, btnAntsLayer);
	toggleButton(!isDrawingDensity, btnDensityLayer);
	toggleButton(!isDrawingAdvancedDensity, btnDensityAllLayer);
	toggleButton(!isDrawingMarkers, btnMarkersLayer);
}

function toggleLoop() {
	if (isFirstTime) {
		colony.isDrawingAnts = true;
		isFirstTime = false;
	}

	if (!pauseIndicator) {
		return;
	}

	isRunning = !isRunning;

	colony.isRunning = isRunning;

	pauseIndicator.style.display = isRunning ? 'none' : 'block';
	btnPlay.style.display = isRunning ? 'none' : 'flex';
	btnPause.style.display = isRunning ? 'flex' : 'none';
}

function toggleMarkers() {
	isDrawingMarkers = toggleButton(isDrawingMarkers, btnMarkersLayer);
	if (isDrawingMarkers) {
		isDrawingDensity = false;
		isDrawingAdvancedDensity = false;
		disableDensity = false;
		toggleButton(true, btnDensityLayer);
		toggleButton(true, btnDensityAllLayer);
	}
}

function toggleDensity(normal?: boolean, advanced?: boolean) {
	if (!normal && !advanced) {
		isDrawingAdvancedDensity = isDrawingDensity ? true : false;
		isDrawingDensity =
			isDrawingAdvancedDensity || disableDensity ? false : true;
		disableDensity = !isDrawingDensity && isDrawingAdvancedDensity;
	} else if (normal) {
		isDrawingDensity = !isDrawingDensity;
		isDrawingAdvancedDensity = false;
	} else if (advanced) {
		isDrawingAdvancedDensity = !isDrawingAdvancedDensity;
		isDrawingDensity = false;
	}

	if (isDrawingDensity || isDrawingAdvancedDensity) {
		isDrawingMarkers = false;
		toggleButton(true, btnMarkersLayer);
	}
	console.log(
		isDrawingDensity,
		isDrawingAdvancedDensity,
		disableDensity,
		isDrawingMarkers,
	);
	toggleButton(!isDrawingDensity, btnDensityLayer);
	toggleButton(!isDrawingAdvancedDensity, btnDensityAllLayer);
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
	if (isPanMode) {
		document.body.classList.add('cursor-grabbing');
	} else {
		document.body.classList.remove('cursor-grabbing');
	}

	btnPan.classList.toggle('bg-neutral-600');
}

function toggleAnts() {
	if (isFirstTime) {
		isFirstTime = false;
		colony.isDrawingAnts = false;
		toggleButton(!colony.isDrawingAnts, btnAntsLayer);
		return;
	}

	colony.isDrawingAnts = toggleButton(colony.isDrawingAnts, btnAntsLayer);
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

		isAntPanelVisible = togglePanelAndButton(
			isAntPanelVisible,
			antPanel,
			btnAntPanel,
		);
	}
}

function addAnt() {
	colony.createAnt(true);
}

function updateAntInfo() {
	const selectedAnt = colony.selectedAnt;
	if (!selectedAnt) return;

	if (
		!antId ||
		!antPos ||
		!antVel ||
		!antState ||
		!antLifespanPreview ||
		!antLifespan
	) {
		return;
	}

	antId.textContent = selectedAnt.id.toString();
	antPos.textContent = `${selectedAnt.pos.x.toFixed(
		2,
	)} : ${selectedAnt.pos.y.toFixed(2)}`;
	antVel.textContent = `${selectedAnt.vel.x.toFixed(
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
	antState.textContent = state;

	const refillThreshold = AntOptions.AUTONOMY_REFILL / selectedAnt.maxAutonomy;
	const autonomy = selectedAnt.internalClock / selectedAnt.maxAutonomy;
	antLifespanPreview.style.setProperty('--left', `${refillThreshold * 100}%`);
	antLifespanPreview.style.setProperty('--width', `${autonomy * 100}%`);
	antLifespan.textContent = `${selectedAnt.internalClock.toFixed(
		2,
	)} | ${selectedAnt.maxAutonomy.toFixed(2)}`;
}

function updateCellInfo(x: number, y: number) {
	const cell = worldGrid.getCellFromCoordsSafe(x, y);
	if (!cell) return;

	if (
		!markerIntensityHome ||
		!markerIntensityFood ||
		!cellFood ||
		!cellDensity ||
		!cellPreview
	) {
		return;
	}

	markerIntensityHome.textContent = cell.marker.getToHomeIntensity().toFixed(2);
	markerIntensityFood.textContent = cell.marker.getToFoodIntensity().toFixed(2);
	cellFood.textContent = cell.food.quantity.toString();
	cellDensity.textContent = (
		cell.density[0] +
		cell.density[1] +
		cell.density[2]
	).toFixed(2);
	const color = cell.marker.getMixedColor();
	cellPreview.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function updateColonyInfo() {
	if (!colony) return;

	if (!colonyPopulation || !colonyFood || !colonyPreview) {
		return;
	}

	colonyPopulation.textContent = `${colony.ants.length} | ${colony.totalAnts}`;
	colonyFood.textContent = `${colony.food.toFixed(2)} | ${colony.totalFood}`;
	const color = colony.colonyColor;
	colonyPreview.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
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

	cameraCenter.x =
		(event.clientX - window.innerWidth / 2) / canvasScale - zoomOffset.x;
	cameraCenter.y =
		(event.clientY - offsetY - window.innerHeight / 2) / canvasScale -
		zoomOffset.y;

	cameraCenter.x =
		cameraCenter.x < 0 ? Math.abs(cameraCenter.x) : cameraCenter.x * -1;
	cameraCenter.y =
		cameraCenter.y < 0 ? Math.abs(cameraCenter.y) : cameraCenter.y * -1;

	setCamera();
}

function panCanvas(event: MouseEvent) {
	console.log(event);

	cameraOffset.x = event.clientX / canvasScale - panStart.x;
	cameraOffset.y = (event.clientY - offsetY) / canvasScale - panStart.y;

	const canvasCenter = {
		x: window.innerWidth / 2 - width / 2,
		y: window.innerHeight / 2 - height / 2,
	};
	const cameraOffsetTemp = { x: 0, y: 0 };
	cameraOffsetTemp.x =
		(event.clientX - canvasCenter.x) / canvasScale - panStart.x;
	cameraOffsetTemp.y =
		(event.clientY - offsetY - canvasCenter.y) / canvasScale - panStart.y;
	console.log(`--- START ---`);

	console.log(cameraOffset);
	console.log(canvasCenter);
	console.log(canvasScale);
	console.log(cameraOffsetTemp);

	const zoomOffset = {
		x: 0,
		y: 0,
	};

	zoomOffset.x = event.clientX / canvasScale - cameraOffset.x;
	zoomOffset.y = (event.clientY - offsetY) / canvasScale - cameraOffset.y;

	console.log(zoomOffset);
	console.log(event.clientX, event.clientY);
	cameraCenter.x =
		(event.clientX - window.innerWidth / 2) / canvasScale - panStart.x;
	cameraCenter.y =
		(event.clientY - offsetY - window.innerHeight / 2) / canvasScale -
		panStart.y;
	console.log(cameraCenter);
	console.log(window.innerWidth, window.innerHeight);

	(cameraCenter.x =
		cameraCenter.x < 0 ? Math.abs(cameraCenter.x) : cameraCenter.x * -1),
		(cameraCenter.y =
			cameraCenter.y < 0 ? Math.abs(cameraCenter.y) : cameraCenter.y * -1),
		console.log(`--- END ---`);

	setCamera();
}

function moveCamera(x: number, y: number) {
	cameraOffset.x += x;
	cameraOffset.y += y;

	cameraCenter.x -= x;
	cameraCenter.y -= y;

	setCamera();
}

function zoomCamera(zoomIn: boolean) {
	const zoomOffset = {
		x: 0,
		y: 0,
	};

	zoomOffset.x = window.innerWidth / 2 / canvasScale - cameraOffset.x;
	zoomOffset.y = window.innerHeight / 2 / canvasScale - cameraOffset.y;

	canvasScale *= 0.999 ** (zoomIn ? -100 : 100);
	canvasScale = Math.min(Math.max(0.15, canvasScale), 16);

	cameraOffset.x = window.innerWidth / 2 / canvasScale - zoomOffset.x;
	cameraOffset.y = window.innerHeight / 2 / canvasScale - zoomOffset.y;

	cameraCenter.x =
		(window.innerWidth / 2 - window.innerWidth / 2) / canvasScale -
		zoomOffset.x;
	cameraCenter.y =
		(window.innerHeight / 2 - window.innerHeight / 2) / canvasScale -
		zoomOffset.y;
	cameraCenter.x =
		cameraCenter.x < 0 ? Math.abs(cameraCenter.x) : cameraCenter.x * -1;
	cameraCenter.y =
		cameraCenter.y < 0 ? Math.abs(cameraCenter.y) : cameraCenter.y * -1;

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

	cameraCenter.x = width / 2;
	cameraCenter.y = height / 2;

	setCamera();
}

function trackAntCamera(x: number, y: number) {
	const antCenter = {
		x: window.innerWidth / 2 / canvasScale - x,
		y: window.innerHeight / 2 / canvasScale - y,
	};

	cameraOffset.x = antCenter.x;
	cameraOffset.y = antCenter.y;

	cameraCenter.x = window.innerWidth / 2 / canvasScale - antCenter.x;
	cameraCenter.y = window.innerHeight / 2 / canvasScale - antCenter.y;

	setCamera();
}

function setCamera() {
	cameraContainer.style.transform = `scale(${canvasScale}) translate(${cameraOffset.x}px, ${cameraOffset.y}px)`;
	scheduleRegularDraw = true;
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
	antsDrawClock += deltaTime;

	const readyToDraw =
		((scheduleRegularDraw || isRunning) &&
			antsDrawClock > ANTS_DRAW_PERIOD / canvasScale) ||
		antsDrawClock > (ANTS_DRAW_PERIOD * 10) / canvasScale;

	if (performanceStats.isMeasuring) {
		performanceStats.setPerformance('fps', 1 / deltaTime);
		performanceStats.setPerformance('ms', currentTime - lastUpdateTime);
	}

	performanceStats.startMeasurement('clear');
	if (readyToDraw) {
		ctxAnts.clearRect(0, 0, width, height);
	}
	ctxMarkers.clearRect(0, 0, worldGrid.width, worldGrid.height);
	performanceStats.endMeasurement('clear');

	performanceStats.startMeasurement('grid');
	if (isDrawingMarkers && markersImageData) {
		worldGrid.drawMarkers(ctxMarkers, markersImageData, isRunning);
	} else if (isDrawingDensity && densityImageData) {
		worldGrid.drawDensity(ctxMarkers, densityImageData, isRunning);
	} else if (isDrawingAdvancedDensity && densityImageData) {
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

	const center = createVector(
		cameraCenter.x > 0 ? Math.abs(cameraCenter.x) : cameraCenter.x * -1,
		cameraCenter.y > 0 ? Math.abs(cameraCenter.y) : cameraCenter.y * -1,
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
	if (readyToDraw) {
		colony.updateAndDrawAnts(worldGrid, deltaTime);
	} else {
		colony.updateAndDrawAnts(worldGrid, deltaTime, false);
	}
	performanceStats.endMeasurement('ants');

	performanceStats.startMeasurement('panels');
	updateAntInfo();
	if (isTracking && colony.selectedAnt) {
		trackAntCamera(colony.selectedAnt.pos.x, colony.selectedAnt.pos.y);
	}

	if (isDebugMode && readyToDraw) {
		ctxAnts.fillStyle = 'red';
		circle(ctxAnts, target.x, target.y, 4);
		updateCellInfo(target.x, target.y);

		if (antsDrawClock > ANTS_DRAW_PERIOD / canvasScale) {
			ctxAnts.fillStyle = 'rgb(255, 0, 0, 0.1)';
			const padding = {
				x: AntOptions.IMG_HEIGHT * canvasScale,
				y: AntOptions.IMG_HEIGHT * canvasScale,
			};

			const size = {
				x: (window.innerWidth + padding.x) / canvasScale,
				y: (window.innerHeight - offsetY + padding.y) / canvasScale,
			};
			rect(
				ctxAnts,
				center.x - size.x / 2,
				center.y - offsetY / 2 / canvasScale - size.y / 2,
				size.x,
				size.y,
			);
		}
	}

	updateColonyInfo();
	performanceStats.endMeasurement('panels');

	if (performanceStats.isMeasuring) {
		performanceStats.endMeasurement('all');
		updatePerformanceDisplay();
	}

	if (readyToDraw) {
		scheduleRegularDraw = false;
		antsDrawClock = 0;
	}
	lastUpdateTime = currentTime;
}
