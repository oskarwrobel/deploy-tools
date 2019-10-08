'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const NodeSSH = require( 'node-ssh' );

/**
 * Connects to te remote via SSH and allows for executing commands for the deploy purpose.
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

	// Helper function for adding a local command to the commands stack.
	function createLocalCommand( command ) {
		commands.add( new Command( command ) );
	}

	// Helper function for adding a remote command to the commands stack.
	function createRemoteCommand( command, options = {} ) {
		commands.add( new Command( command, options ) );
	}

	// Add all commands to the stack.
	execute( createLocalCommand, createRemoteCommand );

	log( `Connecting to the server ${ username }@${ host }.` );

	// Connect to the server and execute commands from the stack one by one (in sequence).
	return ssh.connect( { host, username, privateKey } )
		.then( async ssh => {
			log( 'Connection established.' );

			for ( const command of commands ) {
				await executeCommand( ssh, command );
			}

			log( 'Disconnecting from the server.' );
		} )
		.then( () => ssh.connection.end() )
		.then( () => log( 'Disconnected.' ) );
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
async function executeCommand( ssh, command ) {
	log( `Executing a ${ command.type } command: ${ command.input }` );

	if ( command.type === 'local' ) {
		shell.exec( command.input );

		return Promise.resolve();
	}

	return ssh.execCommand( command.input, command.options ).then( output => {
		if ( !command.isSilent ) {
			if ( output.stderr.length ) {
				return Promise.reject( output.stderr );
			}

			if ( output.stdout.length ) {
				log( output.stdout );
			}
		}

		return output.stdout;
	} );
}

/**
 * A helper function that prints given value on the console.
 *
 * @param {String} value
 */
function log( value ) {
	console.log( value );
}
