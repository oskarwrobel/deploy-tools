'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const prompts = require( 'prompts' );

module.exports = async function release() {
	const { version } = require( '../package.json' );
	const versions = version.split( '.' ).map( value => parseInt( value ) );
	const [ major, minor, patch ] = versions;

	const response = await prompts( {
		type: 'autocomplete',
		name: 'version',
		message: `Choose the next version (current ${ version })`,
		choices: [
			{ title: `${ major }.${ minor }.${ patch + 1 }` },
			{ title: `${ major }.${ minor + 1 }.0` },
			{ title: `${ major + 1 }.0.0` }
		]
	} );

	shell.exec( `npm version ${ response.version } -m "Bumped version to %s." -tag-version-prefix ""` );
	shell.exec( 'npm publish' );
	shell.exec( `git push --follow-tags` );

	console.log(
		`\nNew version ${ response.version } has been released.\n` +
		'NPM package has been published.\n' +
		'New tag has been pushed to the remote. '
	)
};
