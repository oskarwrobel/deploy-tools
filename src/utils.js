'use strict';

/* eslint-env node */

/**
 * A helper function that prints given value on the console.
 *
 * @param {String} message
 */
module.exports.log = function log( message ) {
	console.log( message );
};

/**
 * A helper function that changes first letters of a given string to uppercase.
 *
 * @param {String} string
 */
module.exports.capitalize = function capitalize( string ) {
	return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
};
