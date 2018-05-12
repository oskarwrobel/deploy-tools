'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const NodeSSH = require( 'node-ssh' );
const path = require( 'path' );

module.exports = function deploy( options ) {
	const ssh = new NodeSSH();
	const { src, dest, host, username, privateKey } = options;
	let { tmp } = options;

	if ( !tmp ) {
		tmp = path.join( path.dirname( dest ), 'tmp' );
	}

	// Copy files to the remote.
	shell.exec( `rsync -a ${ path.join( src, '/' ) } ${ username }@${ host }:${ tmp }` );

	// Connect to the remote by ssh.
	return ssh.connect( { host, username, privateKey } )
		.then( ssh => {
			return Promise.resolve()
			// Remove old project files.
				.then( () => ssh.execCommand( `rm -rf ${ dest }` ) )
				.then( output => console.log( output.stdout, output.stderr ) )

				// Move new project files to the destination.
				.then( () => ssh.execCommand( `mv ${ tmp } ${ dest }` ) )
				.then( output => console.log( output.stdout, output.stderr ) )

				// End connection.
				.then( () => ssh.connection.end() );
		} )
		.catch( err => console.log( err ) );
};
