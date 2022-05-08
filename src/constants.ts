export const CanvasOptions = {
	WIDTH: 500,
	HEIGHT: 500,
} as const;

export enum MarkerTypes {
	TO_HOME = 1,
	TO_FOOD = 2,
	NO_FOOD = 3,
}

export const EVAPORATE_AMOUNT = 0.001;
