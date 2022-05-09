export const CanvasOptions = {
	WIDTH: 1600,
	HEIGHT: 1200,
} as const;

export enum MarkerTypes {
	TO_HOME = 0,
	TO_FOOD = 1,
	NO_FOOD = 2,
}

export const EVAPORATE_AMOUNT = 0.001;

export const MarkerOptions = {
	WIDTH: 16,
	HEIGHT: 16,
} as const;
