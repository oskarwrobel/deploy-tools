'use strict';

/* eslint-env node */

const shell = require( 'shelljs' );
const prompts = require( 'prompts' );
const ora = require( 'ora' );
const humanizeDuration = require( 'humanize-duration' );
const { log } = require( './utils' );

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

	// One line padding for the visual purpose.
	log( '' );

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

	log( `\nDone in ${ humanizeDuration( new Date() - start ) }.` );
	process.exit( 0 );
};

function exec( command ) {
	return new Promise( resolve => {
		shell.exec( command, { silent: true, async: true }, ( code, stdout, stderr ) => {
			resolve( { code, stdout, stderr } );
		} );
	} );
}

async function executeStep( message, command ) {
	const spinner = ora( message ).start();
	const response = await exec( command );

	if ( response.code ) {
		spinner.fail();
		console.error( response.stderr );
		process.exit( response.code );
	} else {
		spinner.succeed();
	}

	spinner.stop();
}
