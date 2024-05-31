import seedrandom from 'seedrandom';

export function random(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function seededRandom(min: number, max: number, rng: seedrandom.PRNG) {
	return rng() * (max - min) + min;
}

export function randomInt(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function togglePanelAndButton(
	isVisible: boolean,
	panel: HTMLDivElement,
	button?: HTMLButtonElement,
) {
	isVisible = !isVisible;

	if (!isVisible) {
		panel.style.display = 'none';
		button?.classList.add('border-red-500');
		button?.classList.remove('border-green-500');
	} else {
		panel.style.display = 'block';
		button?.classList.add('border-green-500');
		button?.classList.remove('border-red-500');
	}

	return isVisible;
}

export function toggleButton(isEnabled: boolean, button: HTMLButtonElement) {
	isEnabled = !isEnabled;

	if (!isEnabled) {
		button.classList.add('border-red-500');
		button.classList.remove('border-green-500');
	} else {
		button.classList.add('border-green-500');
		button.classList.remove('border-red-500');
	}

	return isEnabled;
}

export function getSeed(fromSeed = false, seed = '') {
	const url = new URL(window.location.href);
	const urlSeed = url.searchParams.get('seed');

	if (fromSeed && urlSeed != null) {
		return urlSeed;
	} else if (!fromSeed) {
		const generatedSeed = Math.random().toString(36).slice(2, 7);
		return seed != '' ? seed : generatedSeed;
		// url.searchParams.set('seed', seed != '' ? seed : generatedSeed);
	} else return '';
}
