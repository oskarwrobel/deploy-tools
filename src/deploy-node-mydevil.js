'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const NodeSSH = require( 'node-ssh' );
const path = require( 'path' );
const os = require( 'os' );

module.exports = function deploy( options ) {
	const ssh = new NodeSSH();
	const { repo, domain, host, username, privateKey } = options;
	const dest = `domains/${ domain }/public_nodejs`;
	let { tmp } = options;

	if ( !tmp ) {
		tmp = path.join( path.dirname( dest ), os.tmpdir() );
	}

	// Connect to the remote by ssh.
	return ssh.connect( { host, username, privateKey } )
		.then( ssh => {
			return Promise.resolve()
			// Clone project.
				.then( () => ssh.execCommand( `git clone ${ repo } ${ dest }` ) )

				// Update project.
				.then( () => ssh.execCommand( `cd ${ dest } && git pull && npm4 update --production && devil www restart ${ domain }` ) )
				.then( output => console.log( output.stdout, output.stderr ) )

				// End connection.
				.then( () => ssh.connection.end() );
		} )
		.catch( err => console.log( err ) );
};
