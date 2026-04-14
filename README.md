# NASA Space Explorer

## Project Overview
NASA Space Explorer is a polished, portfolio-style front-end application that lets users browse NASA's Astronomy Picture of the Day (APOD) content by date range. This version goes beyond the starter assignment by focusing on clean UI design, stronger UX states, and more structured JavaScript logic.

## What This Project Does
- Connects to NASA's APOD API and fetches entries between a selected start date and end date.
- Validates date inputs before making API requests.
- Displays returned APOD content in a responsive gallery layout.
- Supports both image and video APOD entries.
- Shows loading, empty, and error states for a better user experience.
- Opens a modal with larger media and full details when a gallery card is selected.
- Includes a "Did You Know?" section that displays a random space fact.

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+)
- NASA APOD API

## Key Features
- Date range filtering with APOD-supported limits.
- API request URL built dynamically from user-selected dates.
- Input validation for missing dates and incorrect date order.
- Responsive gallery that adapts across mobile, tablet, and desktop.
- Media-aware rendering:
	- Images render directly in cards and modal view.
	- Videos use embeddable links when available.
	- Fallback links are provided when direct embedding is not possible.
- Clear status messaging for loading, no results, and request errors.
- Accessible interactions:
	- Keyboard-openable gallery cards.
	- Modal close support via button, overlay click, and Escape key.

## What I Improved From The Original Version
- Designed a cleaner, more professional interface with improved visual hierarchy and spacing.
- Upgraded responsiveness so the app feels consistent across screen sizes.
- Refactored JavaScript into smaller helper functions for cleaner structure and readability.
- Strengthened validation before requests to prevent avoidable API calls.
- Added clearer loading and error handling so users always understand app state.
- Implemented support for different media types (images and videos), including safer fallbacks.
- Improved the modal experience with richer content, better interactions, and reusable modal logic.
- Organized the project more clearly for maintainability and easier explanation during code review.

## Challenges I Solved
- Handling mixed APOD media types without breaking gallery rendering.
- Converting video links into embeddable formats when possible.
- Managing async request flow to avoid stale results overriding newer searches.
- Building user-friendly status states for each part of the fetch lifecycle.
- Keeping UI polished while still writing beginner-friendly, understandable code.

## What I Learned
- How to structure front-end JavaScript using helper functions and app state.
- How to validate user input before network requests to improve reliability.
- How to design for multiple UI states (loading, empty, success, error).
- How to combine API data handling with responsive, portfolio-ready UI decisions.
- How thoughtful UX details (feedback, modal behavior, clear messaging) improve overall product quality.

## How To Run Locally
1. Clone this repository:

```bash
git clone https://github.com/GCA-Classroom/07-nasa-space-explorer.git
```

2. Open the project folder:

```bash
cd 07-nasa-space-explorer
```

3. Open `js/script.js` and make sure your NASA API key is set in the `API_KEY` constant.
	 - You can generate a key at: https://api.nasa.gov/

4. Launch the app by opening `index.html` in your browser.
	 - In VS Code, you can also use a Live Server extension for a smoother local dev workflow.

## Possible Future Improvements
- Add pagination or infinite scroll for larger date ranges.
- Add sorting/filtering options (for example, images only or videos only).
- Add favorites/bookmarks so users can save APOD entries.
- Add unit tests for validation and data transformation helpers.
- Improve accessibility further with focus trapping inside the modal.
- Move API key handling to an environment-based setup for production workflows.
