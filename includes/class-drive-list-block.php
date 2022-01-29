<?php
/**
 * Handles the drive-list Gutenberg block
 *
 * WP Drive List
 * Copyright (C) 2022  Ossian Eriksson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @package ftek/wp-drive-list
 */

namespace Ftek\WPDriveList;

/**
 * Handles the drive-list Gutenberg block
 */
class Drive_List_Block {

	const APIS_URL  = 'https://www.googleapis.com';
	const DRIVE_URL = 'https://drive.google.com';

	/**
	 * Plugin settings
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Default constructor
	 *
	 * @param Settings $settings Plugin settings.
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;

		if ( $this->settings->get( 'api_key' ) ) {
			add_action( 'init', array( $this, 'register_block' ) );
			add_action( 'rest_api_init', array( $this, 'rest_api_init' ) );
		}
	}

	/**
	 * Registers the block
	 */
	public function register_block(): void {
		register_block_type_from_metadata(
			PLUGIN_ROOT . '/src/blocks/drive-list',
			array(
				'render_callback' => array( $this, 'render_block' ),
			)
		);
		wp_set_script_translations(
			'wp-drive-list-drive-list-editor-script',
			'wp-drive-list',
			PLUGIN_ROOT . '/languages'
		);
	}

	/**
	 * Renders block markup
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content    Block content.
	 */
	public function render_block( array $attributes, string $content ): string {
		$files = isset( $attributes['url'] ) ? $this->list_files_in_drive_folder( $attributes['url'] ) : array();

		ob_start();
		if ( empty( $files ) ) {
			?>
			<div>
				<?php esc_html_e( 'No files to display', 'wp-drive-list' ); ?>
			</div>
			<?php
		} else {
			?>
			<ul>
				<?php foreach ( $files as $file ) : ?>
					<li>
						<a href="<?php echo esc_attr( $file['url'] ); ?>">
							<?php echo esc_html( $file['name'] ); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
			<?php
		}
		return ob_get_clean();
	}

	/**
	 * Returns the ID for a Google Drive folder
	 *
	 * @param string $url Shared url to the Google Drive folder.
	 */
	public function get_folder_id( string $url ): string {
		$path_parts = explode( '/', wp_parse_url( $url, PHP_URL_PATH ) );
		return end( $path_parts );
	}

	/**
	 * Lists all non-Google native files in a Google Drive folder
	 *
	 * @param string $url Shared url to the Google Drive folder.
	 */
	public function list_files_in_drive_folder( string $url ): array {
		$response = wp_remote_get(
			add_query_arg(
				array(
					'q'   => sprintf(
						'\'%s\' in parents and not mimeType contains \'application/vnd.google-apps.\'',
						$this->get_folder_id( $url )
					),
					'key' => $this->settings->get( 'api_key' ),
				),
				self::APIS_URL . '/drive/v3/files'
			),
			array()
		);

		if ( wp_remote_retrieve_response_code( $response ) !== 200 ) {
			// TODO Some nicer error handling here. This happens e.g. if the
			// user has not enabled the Google Drive API in Google Console.
			return array();
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return array_map(
			function( $file ): array {
				return array(
					'url'  => add_query_arg(
						array(
							'id'     => $file['id'],
							'export' => 'download',
						),
						self::DRIVE_URL . '/uc'
					),
					'name' => $file['name'],
				);
			},
			$body['files']
		);
	}

	/**
	 * Registers the REST API
	 */
	public function rest_api_init(): void {
		register_rest_route(
			'wp-drive-list/v1',
			'/drive/list',
			array(
				'methods'             => 'GET',
				'callback'            => function( \WP_REST_Request $request ): array {
					return $this->list_files_in_drive_folder( $request['url'] );
				},
				'args'                => array(
					'url' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
				'permission_callback' => function(): bool {
					return current_user_can( 'edit_pages' ) || current_user_can( 'edit_posts' );
				},
			)
		);
	}
}
