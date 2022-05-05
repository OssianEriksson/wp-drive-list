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
import { useState, useEffect } from '@wordpress/element';

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

const fallbackMsg = __('No files to display', 'ftek-drive-list');

const Folder = ({ tree }: { tree: Tree }): JSX.Element => (
	<ul className="ftek-drive-list-list">
		{tree.map((file, i) => (
			<li key={`${i}`}>
				{file.type === 'file' ? (
					<a href={file.url}>{file.name}</a>
				) : (
					<>
						<span className="ftek-drive-list-folder-name">
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
			path: `ftek-drive-list/v1/drive/tree?url=${url}&depth=${depth}&download=${download}`,
		}).then((response) => {
			setTree(response as Tree);
		});
	}, [url, depth, download]);

	return (
		<div {...useBlockProps()}>
			<InspectorControls>
				<PanelBody
					title={__('Basic settings', 'ftek-drive-list')}
					initialOpen={true}
				>
					<PanelRow>
						<TextControl
							label={__('Shared folder URL', 'ftek-drive-list')}
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
							label={__('Scan depth', 'ftek-drive-list')}
							help={__(
								'Number of subfolders to scan',
								'ftek-drive-list'
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
							label={__('Download files', 'ftek-drive-list')}
							help={__(
								'Download files or open in browser',
								'ftek-drive-list'
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
