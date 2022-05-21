// CANVAS

export const CanvasOptions = {
	WIDTH: 1600,
	HEIGHT: 1200,
} as const;

// MARKERS

export enum MarkerTypes {
	TO_HOME = 0,
	TO_FOOD = 1,
	// NO_FOOD = 2,
}

export const MarkerColors = {
	TO_HOME: [255, 0, 0],
	TO_FOOD: [43, 255, 0],
	// 2: [0, 42, 255],
} as const;

export const MarkerOptions = {
	WIDTH: 16,
	HEIGHT: 16,
	SIZE: 16,
} as const;

export const EVAPORATE_AMOUNT = 0.001;

// ANTS

export enum AntStates {
	TO_HOME = 0,
	TO_FOOD = 1,
}

export const AntOptions = {
	IMG_WIDTH: 24,
	IMG_HEIGHT: 34,
	WANDER_DISPLACE_RANGE: 0.3,
	WANDER_POINT_MAGNITUDE: 100,
	WANDER_POINT_RADIUS: 50,
	PERCEPTION_RADIUS: 100,
	PERCEPTION_START_ANGLE: (7 / 6) * Math.PI,
	PERCEPTION_END_ANGLE: (11 / 6) * Math.PI,
} as const;

export const FoodOptions = {
	SIZE: 16,
	PICK_AMOUNT: 1,
} as const;

// BUTTONS
export const MIDDLE_BUTTON = 4;
