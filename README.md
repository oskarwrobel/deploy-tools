# Deploy tools

Scripts for deploying a simple structure projects.

## How to use:

```javascript
const deploy = require( 'deploy-tools/src/deploy' );

deploy( {
	username: 'user-name',
	host: 'host',
	privateKey: 'private-key',
	execute( local, remote ) {
		// local( 'shell command that will be ececuted on the local machine' );
		// remote( 'shell command that will bee executed on remote' );
		// remote( 'stduot will not be logged on the console', { silent: true } );
		// remote( 'change current working directory', { cwd: 'some/path/' } );

		local( 'npm run build --production' );
		local( `rsync -a build/ user-name@host:/var/www/my-website/` );
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
