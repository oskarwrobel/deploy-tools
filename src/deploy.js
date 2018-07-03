'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const NodeSSH = require( 'node-ssh' );

/**
 * See README.
 */
module.exports = function deploy( { host, username, privateKey, execute } ) {
	const ssh = new NodeSSH();
	const commands = [];

	function local( command ) {
		commands.push( { command } );
	}

	function remote( command, options = {} ) {
		commands.push( { command, options } );
	}

	execute( local, remote );

	return ssh.connect( { host, username, privateKey } )
		.then( ssh => {
			let chain = Promise.resolve();

			for ( const { command, options } of commands ) {
				chain = chain.then( () => {
					console.log( options === undefined ? 'Local: ' : 'Remote: ', command );

					if ( options === undefined ) {
						shell.exec( command );
					} else {
						return ssh.execCommand( command, options ).then( output => {
							if ( !options.silent ) {
								if ( output.stderr.length ) {
									return Promise.reject( output.stderr );
								}

								if ( output.stdout.length ) {
									console.log( output.stdout );
								}
							}

							return output.stdout;
						} );
					}
				} );
			}

			return chain.then( () => ssh.connection.end() );
		} );
};
