# Deploy tools

Tools for deploying a simple structured projects.

## How to use:

```javascript
const deploy = require( '@oskarwrobel/deploy-tools/src/deploy' );

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

		// How it can be used in the real word:

		// Build your application locally.
		local( 'npm run build --production' );
		// Copy bundled files from your local machine to the server.
		local( `rsync -a build/ user-name@host:/var/www/my-website/` );
		// Execute some custom script on the server after deploying files.
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
