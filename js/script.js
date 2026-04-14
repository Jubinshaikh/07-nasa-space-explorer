// Paste your NASA API key here.
// You can get a key from: https://api.nasa.gov/
const API_KEY = 'sh14rlq2uD9BYKJtKkS8nkUngtycqb5re2JKt45a';

// NASA APOD endpoint
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// Find the main elements on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const spaceFactText = document.getElementById('spaceFact');

// Random fact list for the "Did You Know?" section
const spaceFacts = [
	'The Sun holds about 99.8% of all the mass in our solar system.',
	'One day on Venus is longer than one year on Venus.',
	'Neutron stars can spin hundreds of times per second.',
	'More energy from the Sun reaches Earth in one hour than humans use in a year.',
	'Jupiter has the shortest day of all planets, about 10 hours long.',
	'Saturn could float in water because it is mostly made of gas and has very low density.',
	'The footprints on the Moon can last for millions of years because there is no wind.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
	'Mars has the largest volcano in the solar system, Olympus Mons.',
	'The Milky Way galaxy is so large that light takes about 100,000 years to cross it.'
];

// Create a modal once and reuse it whenever a gallery item is clicked.
const modal = document.createElement('div');
modal.className = 'modal hidden';
modal.innerHTML = `
	<div class="modal-overlay"></div>
	<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
		<button class="modal-close" type="button" aria-label="Close details">Close</button>
		<div class="modal-media"></div>
		<h2 id="modalTitle" class="modal-title"></h2>
		<p class="modal-date"></p>
		<p class="modal-explanation"></p>
	</div>
`;
document.body.appendChild(modal);

const modalOverlay = modal.querySelector('.modal-overlay');
const modalCloseButton = modal.querySelector('.modal-close');
const modalMedia = modal.querySelector('.modal-media');
const modalTitle = modal.querySelector('.modal-title');
const modalDate = modal.querySelector('.modal-date');
const modalExplanation = modal.querySelector('.modal-explanation');

// Show one random fact when the page loads.
showRandomFact();

const appState = {
	latestRequestId: 0,
	currentGalleryItems: []
};

const STATUS_UI = {
	defaultTitles: {
		loading: 'Loading space images',
		error: 'Something went wrong',
		empty: 'No results yet'
	},
	icons: {
		error: '!',
		empty: 'i'
	},
	roles: {
		loading: 'status',
		error: 'alert',
		empty: 'status'
	}
};

const FALLBACK_TEXT = {
	title: 'Untitled NASA APOD entry',
	date: 'Unknown date',
	explanation: 'No explanation was provided by NASA for this entry.'
};

const STATUS_MESSAGES = {
	missingDates: {
		title: 'Select a complete date range',
		type: 'empty',
		message: 'Choose both a start and end date to begin exploring NASA\'s daily astronomy archive.'
	},
	invalidOrder: {
		title: 'Check your date order',
		type: 'error',
		message: 'Start date should be before or the same as end date. Adjust the range and try again.'
	},
	loading: {
		title: 'Scanning the cosmos',
		type: 'loading',
		message: 'Contacting NASA and preparing your gallery. This can take a few seconds.'
	},
	noEntries: {
		title: 'No entries found for these dates',
		type: 'empty',
		message: 'NASA did not return any APOD entries for that range. Try different dates to continue exploring.'
	},
	noDisplayableMedia: {
		title: 'Nothing displayable yet',
		type: 'empty',
		message: 'The returned entries could not be displayed as images or videos. Try a nearby date range.'
	},
	loadErrorPrefix: 'We couldn\'t load NASA images right now.'
};

// =====================
// Basic UI helpers
// =====================

function showRandomFact() {
	if (!spaceFactText) {
		return;
	}

	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

function showStatusMessage(message, type = 'empty', title = '') {
	if (!gallery) {
		return;
	}

	const safeType = ['loading', 'error', 'empty'].includes(type) ? type : 'empty';
	const safeTitle = title || STATUS_UI.defaultTitles[safeType];
	const iconMarkup = safeType === 'loading'
		? '<div class="status-spinner" aria-hidden="true"></div>'
		: `<div class="status-icon" aria-hidden="true">${STATUS_UI.icons[safeType] || 'i'}</div>`;

	gallery.innerHTML = `
		<div class="status-card status-${safeType}" role="${STATUS_UI.roles[safeType]}" aria-live="polite">
			${iconMarkup}
			<p class="status-title">${safeTitle}</p>
			<p class="status-text">${message}</p>
		</div>
	`;
}

function showPresetStatus(statusPreset) {
	showStatusMessage(statusPreset.message, statusPreset.type, statusPreset.title);
}

// =====================
// Video URL helpers
// =====================

function canEmbedVideo(url) {
	if (!url) {
		return false;
	}

	return (
		url.includes('youtube.com') ||
		url.includes('youtu.be') ||
		url.includes('youtube-nocookie.com') ||
		url.includes('player.vimeo.com')
	);
}

function getEmbedVideoUrl(url) {
	if (!url) {
		return null;
	}

	if (url.includes('/embed/') || url.includes('player.vimeo.com/video/')) {
		return url;
	}

	if (url.includes('youtu.be/')) {
		const videoId = url.split('youtu.be/')[1]?.split('?')[0];
		return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
	}

	if (url.includes('youtube.com/watch')) {
		const queryString = url.split('?')[1] || '';
		const params = new URLSearchParams(queryString);
		const videoId = params.get('v');
		return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
	}

	if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
		const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
		return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
	}

	return canEmbedVideo(url) ? url : null;
}

// =====================
// Data shaping helpers
// =====================

function normalizeApodData(data) {
	const items = Array.isArray(data) ? data : [data];

	const validItems = items.filter((item) => {
		return item && typeof item === 'object' && typeof item.date === 'string';
	});

	return validItems.sort((a, b) => {
		if (a.date < b.date) return -1;
		if (a.date > b.date) return 1;
		return 0;
	});
}

function getDisplayableItems(items) {
	return items.filter((item) => {
		if (item.media_type === 'image') {
			return Boolean(item.url);
		}

		if (item.media_type === 'video') {
			return Boolean(item.url);
		}

		return false;
	});
}

function getCardMetadata(item) {
	return {
		title: item.title || FALLBACK_TEXT.title,
		date: item.date || FALLBACK_TEXT.date,
		explanation: item.explanation || FALLBACK_TEXT.explanation,
		mediaTypeLabel: item.media_type === 'video' ? 'Video' : 'Image'
	};
}

// =====================
// Rendering helpers
// =====================

function createVideoFallbackMarkup(item, safeTitle) {
	const thumbnailMarkup = item.thumbnail_url
		? `<img src="${item.thumbnail_url}" alt="${safeTitle}" />`
		: '<div class="video-fallback">Preview unavailable in NASA feed</div>';

	return `
		${thumbnailMarkup}
		<p><a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Watch Video</a></p>
	`;
}

function createMediaMarkup(item, options = {}) {
	const safeTitle = item.title || 'Space media';
	const embedUrl = getEmbedVideoUrl(item.url);
	const useLargeImage = options.useLargeImage === true;

	if (item.media_type === 'image') {
		const imageUrl = useLargeImage ? (item.hdurl || item.url) : item.url;
		return `<img src="${imageUrl}" alt="${safeTitle}" />`;
	}

	if (embedUrl) {
		return `
			<iframe
				src="${embedUrl}"
				title="${safeTitle}"
				loading="lazy"
				allowfullscreen
			></iframe>
		`;
	}

	return createVideoFallbackMarkup(item, safeTitle);
}

function createGalleryCardMarkup(item, index) {
	const metadata = getCardMetadata(item);
	const mediaMarkup = createMediaMarkup(item);

	return `
		<article
			class="gallery-item"
			data-index="${index}"
			tabindex="0"
			role="button"
			aria-label="Open details for ${metadata.title} from ${metadata.date}"
		>
			<div class="gallery-media">
				${mediaMarkup}
			</div>
			<div class="gallery-body">
				<p class="media-type-badge">${metadata.mediaTypeLabel}</p>
				<h3 class="gallery-title">${metadata.title}</h3>
				<p class="gallery-date">${metadata.date}</p>
			</div>
		</article>
	`;
}

function renderGalleryItems(items) {
	if (!gallery) {
		return;
	}

	gallery.innerHTML = items.map((item, index) => createGalleryCardMarkup(item, index)).join('');
}

// =====================
// Modal helpers
// =====================

function openModal(item) {
	const metadata = getCardMetadata(item);

	modalMedia.innerHTML = createMediaMarkup(item, { useLargeImage: true });
	modalTitle.textContent = metadata.title;
	modalDate.textContent = metadata.date;
	modalExplanation.textContent = metadata.explanation;

	modal.classList.remove('hidden');
	document.body.classList.add('modal-open');
}

function closeModal() {
	modal.classList.add('hidden');
	document.body.classList.remove('modal-open');
	modalMedia.innerHTML = '';
}

function openModalFromCard(cardElement) {
	const index = Number(cardElement.dataset.index);
	const selectedItem = appState.currentGalleryItems[index];

	if (selectedItem) {
		openModal(selectedItem);
	}
}

// =====================
// API and request flow
// =====================

function validateDateRange(startDate, endDate) {
	if (!startDate || !endDate) {
		return { valid: false, status: STATUS_MESSAGES.missingDates };
	}

	if (startDate > endDate) {
		return { valid: false, status: STATUS_MESSAGES.invalidOrder };
	}

	return { valid: true };
}

function buildApodRequestUrl(startDate, endDate) {
	return `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
}

async function fetchApodRange(startDate, endDate) {
	const requestUrl = buildApodRequestUrl(startDate, endDate);
	const response = await fetch(requestUrl);

	if (!response.ok) {
		throw new Error(`NASA API request failed with status ${response.status}.`);
	}

	return response.json();
}

async function loadSpaceImages() {
	if (!startInput || !endInput || !fetchButton || !gallery) {
		console.error('NASA Space Explorer: required DOM elements are missing.');
		return;
	}

	const startDate = startInput.value;
	const endDate = endInput.value;
	const dateCheck = validateDateRange(startDate, endDate);

	if (!dateCheck.valid) {
		showPresetStatus(dateCheck.status);
		return;
	}

	const requestId = ++appState.latestRequestId;
	fetchButton.disabled = true;
	closeModal();
	showPresetStatus(STATUS_MESSAGES.loading);

	try {
		const rawData = await fetchApodRange(startDate, endDate);
		const normalizedData = normalizeApodData(rawData);

		// Only apply results if this is still the newest request.
		if (requestId !== appState.latestRequestId) {
			return;
		}

		if (normalizedData.length === 0) {
			showPresetStatus(STATUS_MESSAGES.noEntries);
			return;
		}

		const displayableItems = getDisplayableItems(normalizedData);

		if (displayableItems.length === 0) {
			showPresetStatus(STATUS_MESSAGES.noDisplayableMedia);
			return;
		}

		const limitedItems = displayableItems.slice(0, 9);
		appState.currentGalleryItems = limitedItems;
		renderGalleryItems(limitedItems);
	} catch (error) {
		if (requestId !== appState.latestRequestId) {
			return;
		}

		showStatusMessage(
			`${STATUS_MESSAGES.loadErrorPrefix} ${error.message} Please try again in a moment.`,
			'error',
			'Unable to load your gallery'
		);
	} finally {
		if (requestId === appState.latestRequestId) {
			fetchButton.disabled = false;
		}
	}
}

// =====================
// Event wiring
// =====================

function setupGalleryEvents() {
	if (!gallery) {
		return;
	}

	gallery.addEventListener('click', (event) => {
		if (event.target.closest('.video-link')) {
			return;
		}

		const clickedCard = event.target.closest('.gallery-item');

		if (!clickedCard) {
			return;
		}

		openModalFromCard(clickedCard);
	});

	gallery.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		const focusedCard = event.target.closest('.gallery-item');

		if (!focusedCard) {
			return;
		}

		event.preventDefault();
		openModalFromCard(focusedCard);
	});
}

function setupModalEvents() {
	modalCloseButton.addEventListener('click', closeModal);
	modalOverlay.addEventListener('click', closeModal);

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
			closeModal();
		}
	});
}

function initializeApp() {
	if (!startInput || !endInput || !fetchButton || !gallery) {
		console.error('NASA Space Explorer: required DOM elements are missing.');
		return;
	}

	setupDateInputs(startInput, endInput);
	fetchButton.addEventListener('click', loadSpaceImages);
	setupGalleryEvents();
	setupModalEvents();
}

initializeApp();
