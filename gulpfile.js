
const gulp = require('gulp');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const archiver = require('archiver');

const less = require('gulp-less');

const argv = require('yargs').argv;

function getManifest() {
	const json = { root: 'src' };

	const modulePath = path.join(json.root, 'module.json');
	const systemPath = path.join(json.root, 'system.json');

	if (fs.existsSync(modulePath)) {
		json.file = fs.readJSONSync(modulePath);
		json.name = 'module.json';
	} else if (fs.existsSync(systemPath)) {
		json.file = fs.readJSONSync(systemPath);
		json.name = 'system.json';
	} else {
		return;
	}

	return json;
}

/********************/
/*		BUILD		*/
/********************/

/**
 * Build Less
 */
function buildLess() {
	return gulp.
		src('src/styles/*.less')
		.pipe(less())
		.pipe(gulp.dest('src/'));
}

/********************/
/*		CLEAN		*/
/********************/

/**
 * Remove built files from `src` folder
 * while ignoring source files
 */
async function clean() {
	const name = "barbrawl";
	const files = [];

	// If the project uses Less
	if (fs.existsSync(path.join('src', 'styles', `${name}.less`))) {
		files.push('fonts', `${name}.css`);
	}

	console.log(' ', chalk.yellow('Files to clean:'));
	console.log('   ', chalk.blueBright(files.join('\n    ')));

	// Attempt to remove the files
	try {
		for (const filePath of files) {
			await fs.remove(path.join('src', filePath));
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/********************/
/*		LINK		*/
/********************/

/**
 * Link build to User Data folder
 */
async function linkUserData() {
	const config = fs.readJSONSync('foundryconfig.json');

	let destDir, name;
	try {
		sourceModulePath = path.resolve('.', 'src', 'module.json');
		if (fs.existsSync(sourceModulePath)) {
			destDir = 'modules';
			name = fs.readJSONSync(sourceModulePath).name;
		} else {
			throw Error(
				`Could not find ${chalk.blueBright(
					'module.json'
				)} or ${chalk.blueBright('system.json')}`
			);
		}

		let linkDir;
		if (config.dataPath) {
			let appDataPath = process.env.AppData;
			let resolvedDataPath;
			if (!appDataPath) {
				console.warn(chalk.yellow("Can't auto-resolve data path, make sure to set an absolute path in foundryconfig.json > dataPath."));
				resolvedDataPath = config.dataPath;
			} else {
				let localAppDataPath = appDataPath.replace("Roaming", "Local");
				resolvedDataPath = config.dataPath.replace("${env:AppData}", localAppDataPath);
			}
			if (!fs.existsSync(path.join(resolvedDataPath, 'Data')))
				throw Error('User Data path invalid, no Data directory found at ' + resolvedDataPath);

			linkDir = path.join(resolvedDataPath, 'Data', destDir, name);
		} else {
			throw Error('No User Data path defined in foundryconfig.json');
		}

		if (argv.clean || argv.c) {
			console.log(
				chalk.yellow(`Removing build in ${chalk.blueBright(linkDir)}`)
			);

			await fs.remove(linkDir);
		} else if (!fs.existsSync(linkDir)) {
			console.log(
				chalk.green(`Copying build to ${chalk.blueBright(linkDir)}`)
			);
			await fs.symlink(path.resolve('./src'), linkDir);
		}
		return Promise.resolve();
	} catch (err) {
		Promise.reject(err);
	}
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Package build
 */
async function packageBuild() {
	const manifest = getManifest();

	return new Promise((resolve, reject) => {
		try {
			// Remove the package dir without doing anything else
			if (argv.clean || argv.c) {
				console.log(chalk.yellow('Removing all packaged files'));
				fs.removeSync('package');
				return;
			}

			// Ensure there is a directory to hold all the packaged versions
			fs.ensureDirSync('package');

			// Initialize the zip file
			const zipName = `${manifest.file.name}-v${manifest.file.version}.zip`;
			const zipFile = fs.createWriteStream(path.join('package', zipName));
			const zip = archiver('zip', { zlib: { level: 9 } });

			zipFile.on('close', () => {
				console.log(chalk.green(zip.pointer() + ' total bytes'));
				console.log(
					chalk.green(`Zip file ${zipName} has been written`)
				);
				return resolve();
			});

			zip.on('error', (err) => {
				throw err;
			});

			zip.pipe(zipFile);

			// Add the directory with the final code
			zip.directory('src/', manifest.file.name);

			zip.finalize();
		} catch (err) {
			return reject(err);
		}
	});
}

exports.build = gulp.series(clean, buildLess);
exports.buildLess = buildLess;
exports.clean = clean;
exports.link = linkUserData;
exports.package = packageBuild;
