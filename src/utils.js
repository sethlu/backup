const fs = require('fs');

function fileExists(filepath) {
    return new Promise((resolve) => {
        fs.exists(filepath, (exists) => resolve(exists));
    });
}

function readFile(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

function writeFile(filepath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function appendFile(filepath, data) {
    return new Promise((resolve, reject) => {
        fs.appendFile(filepath, data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    })
}

function lstat(filepath) {
    return new Promise((resolve, reject) => {
        fs.lstat(filepath, (err, stats) => {
            if (err) reject(err);
            else resolve(stats);
        });
    });
}

function readdir(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        })
    })
}

function realpath(filepath) {
    return new Promise((resolve, reject) => {
        fs.realpath(filepath, (err, resolvedPath) => {
            if (err) reject(err);
            else resolve(resolvedPath);
        });
    });
}

module.exports = {
    fileExists,
    readFile,
    writeFile,
    appendFile,
    lstat,
    readdir,
    realpath
};
