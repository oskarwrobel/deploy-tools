'use strict';

/* eslint-env node */

const { exec } = require( 'shelljs' );
const prompts = require( 'prompts' );
const ora = require( 'ora' );

module.exports = async function release() {
	const { version } = require( '../package.json' );
	const versions = version.split( '.' ).map( value => parseInt( value ) );
	const [ major, minor, patch ] = versions;

	const { newVersion } = await prompts( {
		type: 'autocomplete',
		name: 'newVersion',
		message: `Choose the next version (current ${ version })`,
		choices: [
			{ title: `${ major }.${ minor }.${ patch + 1 }` },
			{ title: `${ major }.${ minor + 1 }.0` },
			{ title: `${ major + 1 }.0.0` }
		]
	} );

	let start = new Date();
	let spinner;
	let response;

	spinner = ora( `Upgrading version from ${ version } to ${ newVersion }` ).start();
	response = await asyncExec( `npm version ${ newVersion } -m "Bumped version to %s." -tag-version-prefix ""` );
	handleResponse( response, spinner );

	spinner = ora( 'Publishing NPM package' );
	await asyncExec( 'npm publish' );
	handleResponse( response, spinner );

	spinner = ora( 'Pushing tags' );
	await asyncExec( `git push --follow-tags` );
	handleResponse( response, spinner );

	console.log( `\nDone in ${ new Date() - start }ms` );
};

function asyncExec( command ) {
	return new Promise( resolve => {
		exec( command, { silent: true, async: true }, ( code, stdout, stderr ) => {
			resolve( { code, stdout, stderr } );
		} );
	} );
}

function handleResponse( response, spinner ) {
	if ( response.code ) {
		spinner.fail();
		console.error( response.stderr );
		process.exit( response.code );
	} else {
		spinner.succeed();
	}
}
