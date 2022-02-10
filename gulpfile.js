
const gulp = require('gulp');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const archiver = require('archiver');
const stringify = require('json-stringify-pretty-compact');
const XMLHttpRequest = require('xhr2');

const less = require('gulp-less');
const git = require('gulp-git');

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

/**
 * Creates a new version by incrementing the previous number, generating a new
 *  download link and tagging the current commit using Git.
 * Note that this requires a Git instance accessible through the command line.
 */
async function createVersion() {
    // Validate data.
    const manifest = getManifest();
    const config = fs.readJSONSync('foundryconfig.json');
    if (!manifest || !config) console.log(chalk.red("Manifest or configuration file not found."));
    if (!config.rawUrl || !config.apiUrl) console.log(chalk.red("Invalid repository URLs."));

    const versionTag = "v" + manifest.file.version;
    console.log("New version will be " + versionTag);

    // Generate URLs.
    manifest.file.manifest = `${config.rawUrl}/master/${manifest.root}/${manifest.name}`;
    const fileName = `${manifest.file.name}-v${manifest.file.version}.zip`;
    manifest.file.download = `${config.apiUrl}/packages/generic/barbrawl/${manifest.file.version}/${fileName}`;

    // Save manifest file.
    const manifestFilePath = path.join(manifest.root, manifest.name);
    console.log("Writing new manifest file to " + manifestFilePath);
    fs.writeFileSync(manifestFilePath, stringify(manifest.file, { indent: 4 }), "utf8");

    // Tag the repository.
    git.tag(versionTag, "", function (e) { if (e) throw e; });
}

/**
 * Publishes the most recently created version by uploading the package and
 *  committing the manifest file using Git.
 * Note that this requires a Git instance accessible through the command line.
 */
async function publish() {
    // Validate data.
    const manifest = getManifest();
    const config = fs.readJSONSync('foundryconfig.json');
    const token = fs.readJSONSync('deploytoken.json');
    if (!manifest || !config || !token) console.log(chalk.red("Manifest or configuration or token file not found."));

    // Upload package file.
    const fileName = `${manifest.file.name}-v${manifest.file.version}.zip`;
    if (!fs.existsSync("package/" + fileName)) console.log(chalk.red("Package " + fileName + " does not exist."));

    console.log("Uploading file " + fileName + " via GitLab API");
    var request = new XMLHttpRequest();
    request.open("PUT", `${config.apiUrl}/packages/generic/barbrawl/${manifest.file.version}/${fileName}`, true);
    request.setRequestHeader("Content-Type", "application/zip");
    request.setRequestHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    request.setRequestHeader("Authorization", "Basic " + Buffer.from(`${token.name}:${token.password}`).toString("base64"));
    request.addEventListener("loadend", function (ev) {
        console.log(ev.currentTarget.response);
    });
    request.send(fs.readFileSync("package/" + fileName));

    // Commit (only) module.json.
    console.log("Committing module.json");
    gulp.src("src/module.json").pipe(git.commit("Update manifest to v" + manifest.file.version, {
        disableAppendPaths: true,
        args: "-o ./src/module.json"
    }));
}

exports.build = gulp.series(clean, buildLess);
exports.buildLess = buildLess;
exports.clean = clean;
exports.link = linkUserData;
exports.package = gulp.series(exports.build, packageBuild);
exports.release = gulp.series(createVersion, exports.package, publish);