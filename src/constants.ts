// CANVAS

export const CanvasOptions = {
	WIDTH: 1600,
	HEIGHT: 1200,
} as const;

// MARKERS

export enum MarkerTypes {
	TO_HOME = 0,
	TO_FOOD = 1,
	NO_FOOD = 2,
}

export const MarkerOptions = {
	WIDTH: 16,
	HEIGHT: 16,
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
} as const;
