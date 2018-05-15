'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const NodeSSH = require( 'node-ssh' );

module.exports = function deploy( options ) {
	const ssh = new NodeSSH();
	const { host, username, privateKey, remote, local } = options;
	const remoteCommands = [];

	local( shell );
	remote( ( command, options = {} ) => remoteCommands.push( [ command, options ] ) );

	return ssh.connect( { host, username, privateKey } )
		.then( ssh => {
			let chain = Promise.resolve();

			for ( const command of remoteCommands ) {
				chain = chain.then( () => {
					console.log( command[ 0 ] );

					return ssh.execCommand( command[ 0 ], command[ 1 ] )
						.then( output => {
							const isSilent = command[ 1 ].silent;

							if ( !isSilent ) {
								if ( output.stderr.length ) {
									return Promise.reject( output.stderr );
								}

								console.log( output.stdout );
							}

							return output.stdout;
						} );
				} );
			}

			return chain.then( () => ssh.connection.end() );
		} );
};
