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
	// Image sizing
	IMG_WIDTH: 24,
	IMG_HEIGHT: 34,
	// Wander options
	WANDER_DISPLACE_RANGE: 0.3,
	WANDER_POINT_MAGNITUDE: 100,
	WANDER_POINT_RADIUS: 50,
	// Perception options
	PERCEPTION_RADIUS: 80,
	PERCEPTION_START_ANGLE: (7 / 6) * Math.PI,
	PERCEPTION_END_ANGLE: (11 / 6) * Math.PI,
	// PERCEPTION_START_ANGLE: Math.PI,
	// PERCEPTION_END_ANGLE: 2 * Math.PI,
	PERCEPTION_POINTS_HORIZONTAL: 12,
	PERCEPTION_POINTS_VERTICAL: 5,
	PERCEPTION_POINTS_START: 34,
} as const;

export const FoodOptions = {
	SIZE: 16,
	PICK_AMOUNT: 1,
} as const;

// BUTTONS
export const RIGHT_BUTTON = 2;
export const MIDDLE_BUTTON = 4;