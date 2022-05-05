import { render } from '@wordpress/element';

import SettingsPage from '../components/settings-page';

document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('ftek-drive-list-settings');
	if (root) {
		render(<SettingsPage />, root);
	}
});
