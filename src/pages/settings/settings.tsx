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

import { render, useState, useEffect } from '@wordpress/element';
import {
	Placeholder,
	Spinner,
	TextControl,
	Button,
	SnackbarList,
} from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

import './settings.scss';

type Option = {
	api_key: string;
};

type SettingsObject = {
	wp_drive_list_option?: Option;
};

const ErrorDisplay = (error: any): JSX.Element => (
	<>
		{__('The following error has occurred:', 'wp-drive-list')}
		<pre className="error">{JSON.stringify(error, null, 4)}</pre>
	</>
);

const NoticeBar = (): JSX.Element => {
	const notices = useSelect((select) =>
		select(noticesStore).getNotices()
	).filter((notice) => notice.type === 'snackbar');
	const { removeNotice } = useDispatch(noticesStore);
	return <SnackbarList notices={notices} onRemove={removeNotice} />;
};

const SpinnerPlaceholder = (): JSX.Element => (
	<Placeholder>
		<div className="placeholder-center">
			<Spinner />
		</div>
	</Placeholder>
);

const SettingsContent = (): JSX.Element => {
	const [error, setError] = useState<unknown>(null);
	const [option, setOption] = useState<Option>(null);
	useEffect(() => {
		apiFetch({ path: '/wp/v2/settings' })
			.then((response) => {
				const settings = response as SettingsObject;
				setOption(settings?.wp_drive_list_option);
			})
			.catch((reason) => setError(reason));
	}, []);

	const { createNotice } = useDispatch(noticesStore);

	if (error) {
		return <ErrorDisplay error={error} />;
	}

	if (!option) {
		return <SpinnerPlaceholder />;
	}

	const save = () => {
		apiFetch({
			path: '/wp/v2/settings',
			method: 'POST',
			data: { wp_drive_list_option: option },
		})
			.then(() =>
				createNotice(
					'success',
					__('Settings saved.', 'wp-drive-list'),
					{ type: 'snackbar' }
				)
			)
			.catch((reason) =>
				createNotice(
					'error',
					reason?.message || JSON.stringify(reason),
					{ type: 'snackbar' }
				)
			);
	};

	return (
		<>
			<TextControl
				label={__('Google API key', 'wp-drive-list')}
				value={option.api_key}
				onChange={(value: string) =>
					setOption({ ...option, api_key: value })
				}
			/>
			<Button onClick={save} isPrimary>
				{__('Save changes', 'wp-drive-list')}
			</Button>
		</>
	);
};

const SettingsPage = (): JSX.Element => (
	<>
		<h1>{__('WP Drive List Settings', 'wp-drive-list')}</h1>
		<SettingsContent />
		<NoticeBar />
	</>
);

document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('wp_drive_list_settings');
	if (root) {
		render(<SettingsPage />, root);
	}
});
