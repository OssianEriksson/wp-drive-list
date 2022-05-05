import { useState, useEffect } from '@wordpress/element';
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

import styles from './index.module.scss';

type Option = {
	api_key: string;
};

type SettingsObject = {
	wp_drive_list_option?: Option;
};

const ErrorDisplay = (error: any): JSX.Element => (
	<>
		{__('The following error has occurred:', 'ftek-drive-list')}
		<pre className={styles.error}>{JSON.stringify(error, null, 4)}</pre>
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
		<div className={styles['placeholder-center']}>
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
					__('Settings saved.', 'ftek-drive-list'),
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
				label={__('Google API key', 'ftek-drive-list')}
				value={option.api_key}
				onChange={(value: string) =>
					setOption({ ...option, api_key: value })
				}
			/>
			<Button onClick={save} isPrimary>
				{__('Save changes', 'ftek-drive-list')}
			</Button>
		</>
	);
};

const SettingsPage = (): JSX.Element => (
	<div>
		<h1>{__('Ftek Drive List Settings', 'ftek-drive-list')}</h1>
		<SettingsContent />
		<NoticeBar />
	</div>
);

export default SettingsPage;
