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
        })
    })
}

module.exports = {
    fileExists,
    readFile,
    writeFile,
    appendFile
};
