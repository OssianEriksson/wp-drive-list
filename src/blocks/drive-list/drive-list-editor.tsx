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
import {
	PanelBody,
	PanelRow,
	TextControl,
	CheckboxControl,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, Children } from '@wordpress/element';

import metadata from './block.json';

type Attributes = {
	url: string;
	depth: number;
	download: boolean;
};

type Tree = (Folder | File)[];

type Folder = {
	type: 'folder';
	name: string;
	children: Tree;
};

type File = {
	type: 'file';
	name: string;
	url: string;
};

const fallbackMsg = __('No files to display', 'wp-drive-list');

const Folder = ({ tree }: { tree: Tree }): JSX.Element => (
	<ul className="wp-drive-list-list">
		{tree.map((file, i) => (
			<li key={`${i}`}>
				{file.type == 'file' ? (
					<a href={file.url}>{file.name}</a>
				) : (
					<>
						<span className="wp-drive-list-folder-name">
							{file.name}
						</span>
						<Folder tree={file.children} />
					</>
				)}
			</li>
		))}
	</ul>
);

const Edit = ({
	attributes,
	setAttributes,
}: {
	attributes: Attributes;
	setAttributes: (attr: Attributes) => unknown;
}): JSX.Element => {
	const { url = '', depth = 1, download = true } = attributes;

	const [tree, setTree] = useState<Tree>([]);
	useEffect(() => {
		apiFetch({
			path: `wp-drive-list/v1/drive/tree?url=${url}&depth=${depth}&download=${download}`,
		}).then((response) => {
			setTree(response as Tree);
		});
	}, [url, depth, download]);

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
							value={url}
							placeholder="https://drive.google.com/drive/folders/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
							onChange={(value: string) => {
								setAttributes({
									...attributes,
									url: value,
								});
							}}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label={__('Scan depth', 'wp-drive-list')}
							help={__(
								'Number of subfolders to scan',
								'wp-drive-list'
							)}
							value={depth}
							type="number"
							min="1"
							onChange={(value: any) => {
								setAttributes({
									...attributes,
									depth: parseInt(value),
								});
							}}
						/>
					</PanelRow>
					<PanelRow>
						<CheckboxControl
							label={__('Download files', 'wp-drive-list')}
							help={__(
								'Download files or open in browser',
								'wp-drive-list'
							)}
							checked={download}
							onChange={(value: boolean) => {
								setAttributes({
									...attributes,
									download: value,
								});
							}}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			{tree.length > 0 ? (
				<Folder tree={tree} />
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
