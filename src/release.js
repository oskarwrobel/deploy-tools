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
			{ title: `${ major }.${ minor + 1 }.${ patch }` },
			{ title: `${ major + 1 }.${ minor }.${ patch }` }
		]
	} );

	shell.exec( `npm version ${ response.version } -m "Bumped version to %s." -tag-version-prefix ""` );
	shell.exec( `git push --follow-tags` );
	shell.exec( 'npm release' );

	console.log(
		`\nNew version ${ response.version } has been released.\n` +
		'NPM package has been released.\n' +
		'New tag has been pushed to the remote. '
	)
};
