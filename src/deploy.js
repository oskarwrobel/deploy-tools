'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const NodeSSH = require( 'node-ssh' );
const ora = require( 'ora' );
const humanizeDuration = require( 'humanize-duration' );
const { log, capitalize } = require( './utils' );

/**
 * Connects to te remote via SSH and allows for executing commands for the deployment purpose.
 *
 * See the README for more details.
 *
 * @param {Object} data
 * @param {String} data.username
 * @param {String} data.host
 * @param {String} data.privateKey
 * @param {Function} data.execute
 */
module.exports = function deploy( { username, host, privateKey, execute } ) {
	const ssh = new NodeSSH();
	const commands = new Set();
	const start = new Date();

	// Helper functions for adding local and remote commands.
	const createLocalCommand = command => commands.add( new Command( command ) );
	const createRemoteCommand = ( command, options = {} ) => commands.add( new Command( command, options ) );

	// Add all commands to the stack.
	execute( createLocalCommand, createRemoteCommand );

	const connectSpinner = ora( `Connecting to the server ${ username }@${ host }.` );
	const disconnectSpinner = ora( 'Disconnecting from the server.' );

	connectSpinner.start();

	// Connect to the server and execute commands from the stack one by one (in sequence).
	return ssh.connect( { host, username, privateKey } )
		.then( async ssh => {
			connectSpinner.succeed();
			connectSpinner.stop();

			for ( const command of commands ) {
				await executeCommand( ssh, command );
			}

			disconnectSpinner.start();
		} )
		.then( () => ssh.connection.end() )
		.then( () => {
			disconnectSpinner.succeed();
			disconnectSpinner.stop();

			log( `\nDone in ${ humanizeDuration( new Date() - start ) }.` );
			process.exit( 0 );
		} );
};

/**
 * Single command representation.
 */
class Command {
	/**
	 * @param {String} input
	 * @param {Object} [options]
	 */
	constructor( input, options ) {
		if ( typeof input !== 'string' ) {
			throw new Error( 'Command has to be a string.' );
		}

		/**
		 * @readonly
		 * @type {string}
		 */
		this.input = input;

		/**
		 * @readonly
		 * @type {Object}
		 */
		this.options = options;
	}

	/**
	 * @type {String}
	 */
	get type() {
		return this.options === undefined ? 'local' : 'remote';
	}

	/**
	 * @type {Boolean}
	 */
	get isSilent() {
		return this.options && this.options.silent;
	}
}

/**
 * Execute single command.
 *
 * @param {NodeSSH} ssh
 * @param {Command} command
 * @returns {Promise}
 */
function executeCommand( ssh, command ) {
	const spinner = ora( capitalize( command.type ) + ':'.padEnd( 8 ) + command.input ).start();

	return new Promise( ( resolve, reject ) => {
		if ( command.type === 'local' ) {
			shell.exec( command.input, { async: true, silent: true }, ( code, stdout, stderr ) => {
				if ( !command.isSilent && code ) {
					spinner.fail();
					reject( stderr );
				} else {
					spinner.succeed();
					resolve( stdout );
				}

				spinner.stop();
			} );
		} else {
			ssh.execCommand( command.input, command.options ).then( output => {
				const { stderr } = output;

				if ( !command.isSilent && stderr.length ) {
					spinner.fail();
					reject( stderr );
				} else {
					spinner.succeed();
					resolve( output.stdout );
				}

				spinner.stop();
			} );
		}
	} );
}
