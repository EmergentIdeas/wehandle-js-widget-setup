#! /usr/bin/env node
let path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const mkdir = spawn('mkdir', ['-p', 'public/css', 'public/js', 'public/img'])
console.log('creating directories')

function ensureObjectExists(parent, key) {
	if(!parent[key]) {
		parent[key] = {}
	}
	return parent[key]
}

function assignData(dest, src) {
	if(!dest || !src) {
		return
	}
	for(let key in src) {
		if(!dest[key]) {
			dest[key] = src[key]
		}
	}
}

mkdir.on('close', function(code) {
	let packageDir = path.resolve(path.dirname(require.main.filename), '..')
	let cwd = process.cwd()
	// console.log('package dir: ' + packageDir)
	// console.log('cwd: ' + cwd)
	spawn('cp', ['-rn', path.resolve(packageDir, 'client-js'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'server-js'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'less'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'views'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'pages'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'build'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'test'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'utils'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'dev.config.js'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'web-server.js'), path.resolve(cwd)])
	
	let buildPackage = JSON.parse(fs.readFileSync(path.resolve(packageDir, 'package.json')).toString())
	let destPackage = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json')).toString())
	let destPackageName = destPackage.name
	
	ensureObjectExists(destPackage, 'devDependencies')
	ensureObjectExists(destPackage, 'dependencies')
	ensureObjectExists(destPackage, 'scripts')
	ensureObjectExists(destPackage, 'browserify')

	assignData(destPackage.devDependencies, buildPackage.devDependencies)

	// This is on purpose assigning dependencies to dev dependencies so that they don't
	// make it into a plugin
	assignData(destPackage.devDependencies, buildPackage.dependencies)

	assignData(destPackage.browserify, buildPackage.browserify)
	assignData(destPackage.scripts, buildPackage.scripts)

	destPackage.files = [
        "/client-js/index.js",
        "/less/components.less",
        "/public"
    ]
	destPackage.main = '/client-js/index.js'
	
	fs.writeFileSync(path.resolve(cwd, 'package.json'), JSON.stringify(destPackage, null, "\t"))
	spawn('sed', ['-i', `s/change-me/${destPackageName}/g`, 'dev.config.js'])
	
	const npmInstall = spawn('npm', ['install'])
	npmInstall.on('close', function(code) {
		const compileLess = spawn('npm', ['run', 'less-build'])
		const compileJs = spawn('npm', ['run', 'client-js-build'])

		compileLess.on('close', function(code) {
			console.log('compiled less')
		})
		compileJs.on('close', function(code) {
			console.log('compiled js')
		})

	})
})
