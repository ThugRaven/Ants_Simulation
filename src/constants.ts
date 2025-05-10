// CANVAS
export const CanvasOptions = {
	WIDTH: 1600 * 3,
	HEIGHT: 1200 * 3,
} as const;

// MAP GENERATION
export const MapOptions = {
	FILL_RATIO: 0.47,
	FILL_RATIO_FOOD: 0.37,
	THRESHOLD: 50,
	THRESHOLD_FOOD: 20,
	BORDER_SIZE: 5,
};

// MARKERS
export enum MarkerTypes {
	TO_HOME = 0,
	TO_FOOD = 1,
}

export const MarkerColors = {
	TO_HOME: [255, 0, 0],
	TO_FOOD: [43, 255, 0],
} as const;

export const MarkerOptions = {
	WIDTH: 16,
	HEIGHT: 16,
	SIZE: 16,
} as const;

export const EVAPORATE_AMOUNT = 0.0002 / 10;

// COLONY
export const ColonyOptions = {
	COLONY_RADIUS: 3,
	COLONY_STARTING_ANTS: 50,
	COLONY_MAX_ANTS: 5000,
	COLONY_MAX_FOOD: 300000,
	ANT_CREATION_PERIOD: 0.15,
	ANT_COST: 30,
	ANT_REFILL_FOOD_AMOUNT: 0.25,
};

// PERFORMANCE TESTING
export const PerfTestOptions = {
	COLONY_ANTS: 5000,
	// 10 seconds
	TEST_DURATION: 10 * 1000,
};

export enum SimulationType {
	ADVANCED = 0,
	SIMPLE = 1,
}

// ANTS
export enum AntStates {
	TO_HOME = 0,
	TO_FOOD = 1,
	REFILL = 2,
}

export const AntOptions = {
	// Image sizing
	IMG_WIDTH: 24,
	IMG_HEIGHT: 34,
	// Wander options
	DIRECTION_NOISE_RANGE: Math.PI * 0.05,
	WANDER_DISPLACE_RANGE: 0.5,
	WANDER_POINT_MAGNITUDE: 100,
	WANDER_POINT_RADIUS: 50,
	// Perception options
	// (Vertical points) * Marker size
	PERCEPTION_RADIUS: 80,
	PERCEPTION_START_ANGLE: (7 / 6) * Math.PI,
	PERCEPTION_END_ANGLE: (11 / 6) * Math.PI,
	// PERCEPTION_START_ANGLE: Math.PI,
	// PERCEPTION_END_ANGLE: 2 * Math.PI,
	PERCEPTION_POINTS_HORIZONTAL: 8,
	PERCEPTION_POINTS_VERTICAL: 5,
	DIRECTION_PERIOD: 0.25,
	// Marker
	MARKER_PERIOD: 0.15,
	MARKER_DEFAULT_INTENSITY: 1,
	// Other
	AUTONOMY_MAX: 300,
	AUTONOMY_REFILL: 150,
	FOOD_SIZE: 16,
} as const;

export const ANTS_DRAW_PERIOD = 0.005;

// FOOD
export const FoodOptions = {
	SIZE: 15,
	PICK_AMOUNT: 2,
} as const;

// BUTTONS
export const RIGHT_BUTTON = 2;
export const MIDDLE_BUTTON = 4;
export const CAMERA_MOVE_BY = MarkerOptions.SIZE;

// BRUSH
export const BrushOptions = {
	MIN_SIZE: 1,
	MAX_SIZE: 75,
	STEP: 1,
};
