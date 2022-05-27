// CANVAS

export const CanvasOptions = {
	WIDTH: 1600 * 4,
	HEIGHT: 1200 * 4,
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

export const EVAPORATE_AMOUNT = 0.0005;

// COLONY
export const ColonyOptions = {
	COLONY_RADIUS: 50,
	COLONY_STARTING_ANTS: 25,
	COLONY_MAX_ANTS: 250,
	ANT_CREATION_PERIOD: 0.15,
	ANT_COST: 5,
};

// ANTS
export const ANT_AMOUNT = 250;

export enum AntStates {
	TO_HOME = 0,
	TO_FOOD = 1,
	REFILL = 3,
}

export const AntOptions = {
	// Image sizing
	IMG_WIDTH: 24,
	IMG_HEIGHT: 34,
	// Wander options
	WANDER_DISPLACE_RANGE: 0.5,
	WANDER_POINT_MAGNITUDE: 100,
	WANDER_POINT_RADIUS: 50,
	// Perception options
	PERCEPTION_RADIUS: 150,
	PERCEPTION_START_ANGLE: (7 / 6) * Math.PI,
	PERCEPTION_END_ANGLE: (11 / 6) * Math.PI,
	// PERCEPTION_START_ANGLE: Math.PI,
	// PERCEPTION_END_ANGLE: 2 * Math.PI,
	PERCEPTION_POINTS_HORIZONTAL: 12,
	PERCEPTION_POINTS_VERTICAL: 5,
	PERCEPTION_POINTS_START: 34,
	// Marker
	MARKER_PERIOD: 0.15,
	MARKER_DEFAULT_INTENSITY: 1,
	// Other
	AUTONOMY_MAX: 300,
	AUTONOMY_REFILL: 100,
} as const;

// FOOD
export const FoodOptions = {
	SIZE: 16,
	PICK_AMOUNT: 1,
} as const;

// BUTTONS
export const RIGHT_BUTTON = 2;
export const MIDDLE_BUTTON = 4;
