<?php
/**
 * Main plugin file
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
 * Plugin Name: WP Drive List
 * Description: WordPress plugin for listing files in a shared Google Drive folder.
 * Version: 1.0.0
 * Text Domain: wp-drive-list
 * Domain Path: /languages
 * Author: Ossian Eriksson
 * Author URI: https://github.com/OssianEriksson
 * Licence: GLP-3.0
 *
 * @package ftek/wp-drive-list
 */

namespace Ftek\WPDriveList;

if ( ! defined( 'WPINC' ) ) {
	exit;
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Checks if $haystack starts with $needle
 *
 * @param string $haystack String to search.
 * @param string $needle   String to look for.
 */
function str_starts_with( string $haystack, string $needle ): bool {
	return substr( $haystack, 0, strlen( $needle ) ) === $needle;
}

/**
 * Resolves a path by expanding ../ and ./
 *
 * Borrowed from https://www.php.net/manual/en/function.realpath.php#84012
 *
 * @param string $path File path.
 */
function resolve_path( string $path ): string {
	$path     = str_replace( '\\', '/', $path );
	$parts    = array_filter( explode( '/', $path ), 'strlen' );
	$resolved = array();
	foreach ( $parts as $part ) {
		if ( '..' === $part ) {
			array_pop( $resolved );
		} elseif ( '.' !== $part ) {
			$resolved[] = $part;
		}
	}
	$initial_slash = str_starts_with( $path, '/' ) ? '/' : '';
	return $initial_slash . implode( '/', $resolved );
}

/**
 * Loads the plugin's translated strings
 */
function load_translations() {
	load_plugin_textdomain(
		'wp-drive-list',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}

add_action( 'init', 'Ftek\WPDriveList\load_translations' );

/*
This is neccessary since i18n translations of JavaScript is done by finding
the JED (.json) file in languages/ whose basename suffix matches the md5
md5. This works fine for most scripts, but as of right now not for the scripts
enqueued by WordPress as part of parsing the block.json files. For example

```
--- src/block.json ---
{
	...
	"editorScript": "file:../build/myScript.js"
	...
}
```

would cause the entirety of `src/../builds/myScript.js` to get hashed instead
of just `builds/myScript.js` which is what `wp i18n make-json` generates md5
hashes for.
*/
add_filter( 'load_script_textdomain_relative_path', 'Ftek\WPDriveList\resolve_path' );

$settings = new Settings();

/**
 * Removes persistant data
 */
function clean() {
	Settings::clean();
}

register_uninstall_hook( __FILE__, 'clean' );
