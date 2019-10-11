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

	console.log( '' );

	await executeStep(
		`Upgrading version from ${ version } to ${ newVersion }.`,
		`npm version ${ newVersion } -m "Bumped version to %s." -tag-version-prefix ""`
	);

	await executeStep(
		'Publishing NPM package.',
		'npm publish',
	);

	await executeStep(
		'Pushing tags.',
		'git push --follow-tags'
	);

	console.log( `\nDone in ${ new Date() - start }ms.` );
	process.exit( 0 );
};

function asyncExec( command ) {
	return new Promise( resolve => {
		exec( command, { silent: true, async: true }, ( code, stdout, stderr ) => {
			resolve( { code, stdout, stderr } );
		} );
	} );
}

async function executeStep( message, command ) {
	const spinner = ora( message ).start();
	const response = await asyncExec( command );

	if ( response.code ) {
		spinner.fail();
		console.error( response.stderr );
		process.exit( response.code );
	} else {
		spinner.succeed();
	}

	spinner.stop();
}
