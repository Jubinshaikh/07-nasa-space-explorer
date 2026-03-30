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

// Track request order so only the newest search updates the gallery.
let latestRequestId = 0;

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

// Store the current gallery items so we can open modal details by index.
let currentGalleryItems = [];

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

// Helper: set a random space fact in the fact section
function showRandomFact() {
	if (!spaceFactText) {
		return;
	}

	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

// Helper: simple check for video URLs we can usually embed in an iframe
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

// Helper: convert known video URLs into iframe-friendly embed URLs
function getEmbedVideoUrl(url) {
	if (!url) {
		return null;
	}

	// Already an embed link
	if (url.includes('/embed/') || url.includes('player.vimeo.com/video/')) {
		return url;
	}

	// youtu.be/VIDEO_ID -> youtube embed URL
	if (url.includes('youtu.be/')) {
		const videoId = url.split('youtu.be/')[1]?.split('?')[0];
		return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
	}

	// youtube watch URL -> youtube embed URL
	if (url.includes('youtube.com/watch')) {
		const queryString = url.split('?')[1] || '';
		const params = new URLSearchParams(queryString);
		const videoId = params.get('v');
		return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
	}

	// vimeo.com/VIDEO_ID -> vimeo player URL
	if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
		const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
		return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
	}

	return canEmbedVideo(url) ? url : null;
}

// Helper: show a status message inside the gallery area
function showStatusMessage(message) {
	if (!gallery) {
		return;
	}

	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">*</div>
			<p>${message}</p>
		</div>
	`;
}

// Helper: create gallery media section for image or video APOD entries.
function createGalleryMedia(item) {
	const safeTitle = item.title || 'Space media';

	if (item.media_type === 'image') {
		return `
			<div class="gallery-media">
				<img src="${item.url}" alt="${safeTitle}" />
			</div>
		`;
	}

	const embedUrl = getEmbedVideoUrl(item.url);

	if (embedUrl) {
		return `
			<div class="gallery-media">
				<iframe
					src="${embedUrl}"
					title="${safeTitle}"
					loading="lazy"
					allowfullscreen
				></iframe>
			</div>
		`;
	}

	const thumbnailMarkup = item.thumbnail_url
		? `<img src="${item.thumbnail_url}" alt="${safeTitle}" />`
		: '<div class="video-fallback">Preview unavailable in NASA feed</div>';

	return `
		<div class="gallery-media">
			${thumbnailMarkup}
		</div>
		<p><a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Watch Video</a></p>
	`;
}

// Helper: create one gallery card from APOD data
function createGalleryItem(item, index) {
	const mediaMarkup = createGalleryMedia(item);
	const safeTitle = item.title || 'Untitled NASA APOD entry';
	const safeDate = item.date || 'Unknown date';

	return `
		<article class="gallery-item" data-index="${index}" tabindex="0">
			${mediaMarkup}
			<p><strong>${safeTitle}</strong></p>
			<p>${safeDate}</p>
		</article>
	`;
}

// Open modal and fill it with the selected APOD item details.
function openModal(item) {
	const largeImageUrl = item.hdurl || item.url;
	const embedUrl = getEmbedVideoUrl(item.url);
	const safeTitle = item.title || 'Untitled NASA APOD entry';
	const safeDate = item.date || 'Unknown date';
	const safeExplanation = item.explanation || 'No explanation was provided by NASA for this entry.';

	if (item.media_type === 'video' && embedUrl) {
		modalMedia.innerHTML = `
			<iframe
				src="${embedUrl}"
				title="${safeTitle}"
				loading="lazy"
				allowfullscreen
			></iframe>
		`;
	} else if (item.media_type === 'video') {
		const thumbnailMarkup = item.thumbnail_url
			? `<img src="${item.thumbnail_url}" alt="${safeTitle}" />`
			: '<div class="video-fallback">Preview unavailable in NASA feed</div>';

		modalMedia.innerHTML = `
			${thumbnailMarkup}
			<p><a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Watch Video</a></p>
		`;
	} else {
		modalMedia.innerHTML = `<img src="${largeImageUrl}" alt="${safeTitle}" />`;
	}

	modalTitle.textContent = safeTitle;
	modalDate.textContent = safeDate;
	modalExplanation.textContent = safeExplanation;

	modal.classList.remove('hidden');
	document.body.classList.add('modal-open');
}

// Close modal and clean up media so videos stop playing.
function closeModal() {
	modal.classList.add('hidden');
	document.body.classList.remove('modal-open');
	modalMedia.innerHTML = '';
}

// Helper: ensure APOD data is always an array sorted oldest -> newest
function normalizeApodData(data) {
	const items = Array.isArray(data) ? data : [data];
	const validItems = items.filter((item) => item && typeof item === 'object' && typeof item.date === 'string');

	return validItems.sort((a, b) => {
		if (a.date < b.date) return -1;
		if (a.date > b.date) return 1;
		return 0;
	});
}

// Fetch and render images for the selected date range
async function loadSpaceImages() {
	if (!startInput || !endInput || !fetchButton || !gallery) {
		console.error('NASA Space Explorer: required DOM elements are missing.');
		return;
	}

	const startDate = startInput.value;
	const endDate = endInput.value;

	// Basic date validation before making the request
	if (!startDate || !endDate) {
		showStatusMessage('Please select both a start date and an end date.');
		return;
	}

	if (startDate > endDate) {
		showStatusMessage('Start date must be before or equal to end date.');
		return;
	}

	const requestId = ++latestRequestId;
	fetchButton.disabled = true;
	closeModal();
	showStatusMessage('Loading space images...');

	try {
		// thumbs=true asks APOD for thumbnail images when media is a video
		const requestUrl = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error(`NASA API request failed with status ${response.status}.`);
		}

		const rawData = await response.json();
		const normalizedData = normalizeApodData(rawData);

		// If the user already started a newer request, ignore this result.
		if (requestId !== latestRequestId) {
			return;
		}

		if (normalizedData.length === 0) {
			showStatusMessage('NASA returned no valid entries for that date range.');
			return;
		}

		// Keep only items that have required media data.
		const displayableItems = normalizedData.filter((item) => {
			if (item.media_type === 'image') {
				return Boolean(item.url);
			}

			if (item.media_type === 'video') {
				return Boolean(item.url);
			}

			return false;
		});

		if (displayableItems.length === 0) {
			showStatusMessage('No displayable APOD items were found for this date range.');
			return;
		}

		// Requirement: render only 9 items when more are returned.
		// Data is already normalized to chronological order.
		const nineItems = displayableItems.slice(0, 9);
		currentGalleryItems = nineItems;

		gallery.innerHTML = nineItems.map((item, index) => createGalleryItem(item, index)).join('');
	} catch (error) {
		if (requestId !== latestRequestId) {
			return;
		}

		showStatusMessage(`Could not load NASA images. ${error.message}`);
	} finally {
		if (requestId === latestRequestId && fetchButton) {
			fetchButton.disabled = false;
		}
	}
}

// Set up interactions only if required DOM elements exist.
if (!startInput || !endInput || !fetchButton || !gallery) {
	console.error('NASA Space Explorer: required DOM elements are missing.');
} else {
	setupDateInputs(startInput, endInput);
	fetchButton.addEventListener('click', loadSpaceImages);
}

if (gallery) {
	// Open modal when user clicks a gallery item.
	gallery.addEventListener('click', (event) => {
		if (event.target.closest('.video-link')) {
			return;
		}

		const clickedCard = event.target.closest('.gallery-item');

		if (!clickedCard) {
			return;
		}

		const index = Number(clickedCard.dataset.index);
		const selectedItem = currentGalleryItems[index];

		if (selectedItem) {
			openModal(selectedItem);
		}
	});

	// Keyboard support for opening modal from focused gallery items.
	gallery.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		const focusedCard = event.target.closest('.gallery-item');

		if (!focusedCard) {
			return;
		}

		event.preventDefault();
		const index = Number(focusedCard.dataset.index);
		const selectedItem = currentGalleryItems[index];

		if (selectedItem) {
			openModal(selectedItem);
		}
	});
}

// Ways to close the modal: close button, click outside, and Escape key.
modalCloseButton.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
		closeModal();
	}
});
