/*
WP Drive List
Copyright (C) 2022  Ossian Eriksson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './settings.scss';

const SettingsPage = (): JSX.Element => (
	<>
		<h1>{__('WP Drive List Settings', 'wp-drive-list')}</h1>
	</>
);

document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('wp_drive_list_settings');
	if (root) {
		render(<SettingsPage />, root);
	}
});
