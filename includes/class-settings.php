<?php
/**
 * Class for plugin settings management
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
 * Class for plugin settings management
 */
class Settings {

	/**
	 * Settings constructor
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_filter( 'plugin_action_links_wp-drive-list/wp-drive-list.php', array( $this, 'add_settings_action_link' ) );
	}

	/**
	 * Adds an admin menu page for plugin settings
	 */
	public function add_settings_page(): void {
		$settings_page = add_submenu_page(
			null,
			__( 'WP Drive List Settings', 'wp-drive-list' ),
			__( 'WP Drive List Settings', 'wp-drive-list' ),
			'manage_options',
			'wp_drive_list_settings',
			function(): void {
				?>
				<div id="wp_drive_list_settings" class="wrap"></div>
				<?php

				$asset = require PLUGIN_ROOT . '/build/settings.tsx.asset.php';
				wp_enqueue_script(
					'wp_drive_list_script_settings',
					plugins_url( '/build/settings.tsx.js', PLUGIN_FILE ),
					$asset['dependencies'],
					$asset['version'],
					true
				);
				wp_set_script_translations(
					'wp_drive_list_script_settings',
					'wp-drive-list',
					PLUGIN_ROOT . '/languages'
				);
				wp_enqueue_style(
					'wp_drive_list_style_settings',
					plugins_url( '/build/settings.tsx.css', PLUGIN_FILE ),
					array( 'wp-components' ),
					$asset['version']
				);
			}
		);

		if ( $settings_page ) {
			add_action( 'load-' . $settings_page, array( $this, 'add_settings_help' ) );
		}
	}

	/**
	 * Adds a help dropdown to the current screen
	 */
	public function add_settings_help(): void {
		$screen = get_current_screen();
		$screen->add_help_tab(
			array(
				'title'    => __( 'API key', 'wp-drive-list' ),
				'id'       => 'wp_drive_list_help_tab_api_key',
				'callback' => function(): void {
					?>
					<p>
						<?php
						printf(
							// translators: %1$s and %2$s are replaced with anchor attributes.
							__( 'This plugin requires an API key from Google in order to function. Instructions for creating an API key as a Google Workspace admin are available in <a %1$s>Google\'s documentation</a>. Also read about <a %2$s>securing your API key</a>.', 'wp-drive-list' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
							'href="https://cloud.google.com/docs/authentication/api-keys#creating_an_api_key" target="blank" rel="noopener noreferrer"',
							'href="https://cloud.google.com/docs/authentication/api-keys#securing_an_api_key" target="blank" rel="noopener noreferrer"'
						);
						?>
					</p>
					<?php
				},
			)
		);
	}

	/**
	 * Filters plugin_actions_links to add a link to the plugin settings page
	 *
	 * @param array $actions An array of plugin action links.
	 */
	public function add_settings_action_link( array $actions ): array {
		$url = add_query_arg(
			'page',
			'wp_drive_list_settings',
			get_admin_url() . 'admin.php'
		);

		ob_start();
		?>
		<a href="<?php echo esc_attr( $url ); ?>">
			<?php esc_html_e( 'Settings', 'wp-drive-list' ); ?>
		</a>
		<?php
		$actions[] = ob_get_clean();
		return $actions;
	}

	/**
	 * Removes persistant data
	 */
	public static function clean(): void {

	}
}
