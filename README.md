# Deploy tools

Tools for deploying a simple structured projects.

It connects to the remote via SSH protocol and allows to execute commands on the server and the local machine.

## How to use:

```javascript
const { deploy } = require( '@oskarwrobel/deploy-tools' );

deploy( {
	username: 'user-name',
	host: 'host',
	privateKey: 'private-key',
	execute( local, remote ) {
		// Start executing commands here.

		// Command that will be executed on your local machine.
		local( 'some command' );

		// Command that will be executed on the server.
		remote( 'some command' );

		// Remote commands has some additional options:
		remote( 'some command', { silent: true } ); // stduot will not be logged on the console.
		remote( 'some command', { cwd: 'some/path/' } ); // Changes current working directory for the command execution.
	}
} )
.then( () => {
	console.log( 'Deployed.' );
} )
.catch( err => {
	console.log( err );
} );
```

## Real world example:

```javascript
const { deploy } = require( '@oskarwrobel/deploy-tools' );

deploy( {
	username: 'user-name',
	host: 'host',
	privateKey: 'private-key',
	execute( local, remote ) {
		// Build application locally.
		local( 'npm run build' );

		// Before copying files to the remote, make sure there is a proper directory structure.
		'var/www/my-website'.split( '/' ).reduce( ( result, directory ) => {
			result = path.join( result, directory );
			remote( `mkdir ${ result }`, { silent: true, cwd: '/' } );

			return result;
		}, '' );

		// Copy bundled files from your local machine to the server.
		local( `rsync -a build/ user-name@host:/var/www/my-website/` );

		// Execute some custom script on the server side after files has been deployed.
		remote( 'sh after_deploy.sh', { cwd: '/var/www/my-website/' } );
	}
} )
.then( () => {
	console.log( 'Deployed.' );
} )
.catch( err => {
	console.log( err );
} );
```
