import MapGenerator, { MapGeneratorOptions } from '../classes/MapGenerator';
import { MapOptions } from '../constants';

const mapGenerator = new MapGenerator({
	width: 0,
	height: 0,
	fillRatio: MapOptions.FILL_RATIO,
	fillRatioFood: MapOptions.FILL_RATIO_FOOD,
});
export interface MapWorkerSetupMessage {
	action: 'SETUP';
	seed?: string;
	mapGeneratorOptions: MapGeneratorOptions;
}

export interface MapWorkerGenerateMessage {
	action: 'GENERATE';
	setup?: boolean;
	seed: string;
}

export type MapWorkerMessage = MapWorkerSetupMessage | MapWorkerGenerateMessage;

self.onmessage = (e: MessageEvent<MapWorkerMessage>) => {
	console.log('MapWorker message', e.data);

	if (e.data.action === 'SETUP') {
		mapGenerator.initialize(e.data.mapGeneratorOptions);
	}

	if (e.data.action === 'GENERATE') {
		console.log('generate map');

		if (e.data.setup) {
			console.log('setup');
			const { map, foodMap } = mapGenerator.generateMap(e.data.seed);
			postMessage({
				action: 'GENERATE',
				map,
				foodMap,
				seed: e.data.seed,
			});
		} else {
			console.log('normal');
			mapGenerator.generateMapSteps(e.data.seed, (map, foodMap, last) => {
				postMessage({
					action: last ? 'GENERATE' : 'GENERATE_PARTIAL',
					map,
					foodMap,
					seed: e.data.seed,
				});
			});
		}
	}
};
