<?php
/**
 * Handles the drive-list Gutenberg block
 *
 * @package ftek/ftek-drive-list
 */

namespace Ftek\DriveList;

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
		register_block_type(
			PLUGIN_ROOT . '/build/blocks/drive-list',
			array(
				'render_callback' => array( $this, 'render_block' ),
			)
		);
		wp_set_script_translations(
			'ftek-drive-list-drive-list-editor-script',
			'ftek-drive-list',
			PLUGIN_ROOT . '/languages'
		);
	}

	/**
	 * Renders markup displaying a list of files
	 *
	 * @param array $files List of files to display.
	 */
	public function render_folder( array $files ) {
		?>
		<ul class="ftek-drive-list-list">
			<?php foreach ( $files as $file ) : ?>
				<li>
					<?php if ( 'file' === $file['type'] ) : ?>
						<a href="<?php echo esc_attr( $file['url'] ); ?>">
							<?php echo esc_html( $file['name'] ); ?>
						</a>
					<?php elseif ( 'folder' === $file['type'] ) : ?>
						<span class="ftek-drive-list-folder-name">
							<?php echo esc_html( $file['name'] ); ?>
						</span>
						<?php $this->render_folder( $file['children'] ); ?>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
		<?php
	}

	/**
	 * Renders block markup
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content    Block content.
	 */
	public function render_block( array $attributes, string $content ): string {
		$depth    = max( $attributes['depth'] ?? 1, 1 );
		$download = $attributes['download'] ?? true;
		$files    = isset( $attributes['url'] ) ? $this->get_drive_tree( $attributes['url'], $depth, $download ) : array();

		ob_start();
		if ( empty( $files ) ) {
			?>
			<div>
				<?php esc_html_e( 'No files to display', 'ftek-drive-list' ); ?>
			</div>
			<?php
		} else {
			$this->render_folder( $files );
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
	 * @param string $url      Shared url to the Google Drive folder.
	 * @param int    $depth    Depth to scan.
	 * @param bool   $download If false, url opens the file in the browser.
	 */
	public function get_drive_tree( string $url, int $depth, bool $download ): array {
		// phpcs:disable WordPress.WP.AlternativeFunctions

		$tree   = array();
		$leaves = array(
			array(
				'id'   => $this->get_folder_id( $url ),
				'node' => &$tree,
			),
		);

		$curl_multi = curl_multi_init();

		$tree = array();
		for ( $i = $depth; $i > 0 && $leaves; $i-- ) {
			$curls = array();

			$leave_count = count( $leaves );
			for ( $j = 0; $j < $leave_count; $j++ ) {
				$url = add_query_arg(
					array(
						'q'   => rawurlencode( sprintf( '\'%s\' in parents', $leaves[ $j ]['id'] ) ),
						'key' => rawurlencode( $this->settings->get( 'api_key' ) ),
					),
					self::APIS_URL . '/drive/v3/files'
				);

				$leaves[ $j ]['curl'] = curl_init( $url );
				curl_setopt( $leaves[ $j ]['curl'], CURLOPT_RETURNTRANSFER, true );
				curl_multi_add_handle( $curl_multi, $leaves[ $j ]['curl'] );
			}

			do {
				$status = curl_multi_exec( $curl_multi, $active );
				if ( $active ) {
					curl_multi_select( $curl_multi );
				}
			} while ( $active && CURLM_OK === $status );

			$next_leaves = array();
			for ( $j = 0; $j < $leave_count; $j++ ) {
				$body = json_decode( curl_multi_getcontent( $leaves[ $j ]['curl'] ), true );

				foreach ( $body['files'] as $file ) {
					$node_count = count( $leaves[ $j ]['node'] );
					if ( $i > 1 && 'application/vnd.google-apps.folder' === $file['mimeType'] ) {
						$leaves[ $j ]['node'][ $node_count ] = array(
							'type'     => 'folder',
							'name'     => $file['name'],
							'children' => array(),
						);

						$next_leaves[] = array(
							'id'   => $file['id'],
							'node' => &$leaves[ $j ]['node'][ $node_count ]['children'],
						);
					}
					if ( ! str_starts_with( $file['mimeType'], 'application/vnd.google-apps.' ) ) {
						$leaves[ $j ]['node'][ $node_count ] = array(
							'type' => 'file',
							'name' => $file['name'],
							'url'  => add_query_arg(
								array(
									'id'     => $file['id'],
									'export' => 'download',
								),
								self::DRIVE_URL . '/uc'
							) . ( $download ? '' : '?download=false' ),
						);
					}
				}

				curl_multi_remove_handle( $curl_multi, $leaves[ $j ]['curl'] );
			}

			$leaves = $next_leaves;
		}

		curl_multi_close( $curl_multi );

		return $tree;

		// phpcs:enable
	}

	/**
	 * Registers the REST API
	 */
	public function rest_api_init(): void {
		register_rest_route(
			'ftek-drive-list/v1',
			'/drive/tree',
			array(
				'methods'             => 'GET',
				'callback'            => function( \WP_REST_Request $request ): array {
					return $this->get_drive_tree( $request['url'], $request['depth'], $request['download'] );
				},
				'args'                => array(
					'url'      => array(
						'type'     => 'string',
						'required' => true,
					),
					'depth'    => array(
						'type'     => 'integer',
						'required' => true,
					),
					'download' => array(
						'type'     => 'boolean',
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
