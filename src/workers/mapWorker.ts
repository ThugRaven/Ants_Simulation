import MapGenerator, { MapGeneratorOptions } from '../classes/MapGenerator';
import { MapOptions } from '../constants';

const mapGenerator = new MapGenerator({
	width: 0,
	height: 0,
	fillRatio: MapOptions.FILL_RATIO,
});

self.onmessage = (
	e: MessageEvent<{
		action: 'SETUP' | 'GENERATE';
		setup?: boolean;
		seed: string;
		mapGeneratorOptions: MapGeneratorOptions;
	}>,
) => {
	if (e.data.action === 'SETUP') {
		mapGenerator.initialize(e.data.mapGeneratorOptions);
	}

	console.log('MapWorker message', e.data);

	if (e.data.action === 'GENERATE') {
		console.log('generate map');

		if (e.data.setup) {
			console.log('setup');

			const map = mapGenerator.generateMap(e.data.seed);
			postMessage({
				action: 'GENERATE',
				map,
				seed: e.data.seed,
			});
		} else {
			console.log('normal');

			mapGenerator.generateMapSteps(e.data.seed, (map, last) => {
				postMessage({
					action: last ? 'GENERATE' : 'GENERATE_PARTIAL',
					map,
					seed: e.data.seed,
				});
			});
		}
	}
};