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

import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, PanelRow, TextControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

import metadata from './block.json';

type Attributes = {
	url: string;
};

type File = {
	name: string;
	url: string;
};

const fallbackMsg = __('No files to display', 'wp-drive-list');

const Edit = ({
	attributes,
	setAttributes,
}: {
	attributes: Attributes;
	setAttributes: (attr: Attributes) => unknown;
}): JSX.Element => {
	const { url } = attributes;

	const [files, setFiles] = useState([]);
	useEffect(() => {
		apiFetch({ path: `wp-drive-list/v1/drive/list?url=${url}` }).then(
			(response) => {
				setFiles(response as File[]);
			}
		);
	}, [url]);

	return (
		<div {...useBlockProps()}>
			<InspectorControls>
				<PanelBody
					title={__('Basic settings', 'wp-drive-list')}
					initialOpen={true}
				>
					<PanelRow>
						<TextControl
							label={__('Shared folder URL', 'wp-drive-list')}
							value={url || ''}
							placeholder="https://drive.google.com/drive/folders/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
							onChange={(value: string) => {
								setAttributes({
									...attributes,
									url: value,
								});
							}}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			{files.length > 0 ? (
				<ul>
					{files.map((file, i) => (
						<li key={`${i}`}>
							<a href={file.url}>{file.name}</a>
						</li>
					))}
				</ul>
			) : (
				<div>{fallbackMsg}</div>
			)}
		</div>
	);
};

const Save = (): JSX.Element => (
	<div {...useBlockProps.save()}>{fallbackMsg}</div>
);

registerBlockType(metadata, { edit: Edit, save: Save });
