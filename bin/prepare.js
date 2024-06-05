#! /usr/bin/env node
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import * as url from 'url';
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
		dest[key] = src[key]
	}
}

mkdir.on('close', function(code) {
	let packageDir = url.fileURLToPath(new URL('.', import.meta.url))
	packageDir = path.resolve(packageDir, '..')
	let cwd = process.cwd()
	// console.log('package dir: ' + packageDir)
	// console.log('cwd: ' + cwd)
	spawn('cp', ['-rn', path.resolve(packageDir, 'client-js'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'client-lib'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'server-js'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'less'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'views'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'pages'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'build'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'test'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'utils'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'dev.config.cjs'), path.resolve(cwd)])
	spawn('cp', ['-rn', path.resolve(packageDir, 'pages.webpack.cjs'), path.resolve(cwd)])
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
        "/client-lib",
        "/less/components.less",
        "/public/js/index*"
    ]
	destPackage.main = 'client-lib/index.js'
	destPackage.type = 'module'

	delete destPackage.dependencies['webhandle-js-widget-setup']
	
	fs.writeFileSync(path.resolve(cwd, 'package.json'), JSON.stringify(destPackage, null, "\t"))
	spawn('sed', ['-i', `s/change-me/${destPackageName}/g`, 'dev.config.cjs'])
	
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
