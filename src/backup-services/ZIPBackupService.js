const fs = require('fs');
const path = require('path');

const prompts = require('prompts');
const format = require('string-format')

const BackupService = require('./BackupService');
const {
    fileExists,
    readFile,
    lstat,
    readdir,
    realpath
} = require('../utils');

class ZIPBackupService extends BackupService {

    constructor(zipFilepath) {
        super();
        Object.defineProperty(this, 'zip', {
            configurable: false,
            enumerable: false,
            writable: true
        });

        this.zipFilepath = zipFilepath;
    }

    async put(filepaths, reportingService) {
        const AdmZip = require('adm-zip');

        const date = new Date();
        const formattedZipFilePath = format(this.zipFilepath, {
            date: {
                yyyy: date.getFullYear(),
                mm: ('0' + (date.getMonth() + 1)).slice(-2),
                dd: ('0' + date.getDate()).slice(-2)
            }
        });

        reportingService.report(`Backing up to:    ${formattedZipFilePath}`);

        if (await fileExists(formattedZipFilePath)) {
            this.zip = new AdmZip(formattedZipFilePath);
        } else {
            this.zip = new AdmZip();
        }

        const seenFilePaths = new Set();

        while (filepaths.length > 0) {

            let dependencyFilePaths = [];

            await Promise.all(filepaths.map(async (filepath) => {
                if (seenFilePaths.has(filepath)) {
                    reportingService.report(`Skipping:         ${filepath}`);
                    return;
                }
                seenFilePaths.add(filepath);

                const stats = await lstat(filepath);
                if (stats.isSymbolicLink()) {
                    const resolvedFilepath = await realpath(filepath);

                    reportingService.report(`Adding symlink:   ${filepath} -> ${resolvedFilepath}`);

                    const entryName = `${filepath}.backup-symlink`;
                    const entry = this.zip.getEntry(entryName);
                    if (entry) {
                        this.zip.updateFile(entry, resolvedFilepath);
                    } else {
                        this.zip.addFile(entryName, resolvedFilepath);
                    }

                    dependencyFilePaths.push(resolvedFilepath);
                } else if (stats.isFile()) {
                    reportingService.report(`Adding file:      ${filepath}`);

                    const entryName = filepath;
                    const entry = this.zip.getEntry(entryName);
                    const buffer = await readFile(filepath);
                    if (entry) {
                        this.zip.updateFile(entry, buffer);
                    } else {
                        this.zip.addFile(entryName, buffer);
                    }
                } else {
                    reportingService.report(`Adding directory: ${filepath}`);

                    const files = await readdir(filepath);
                    dependencyFilePaths.push(...files.map(file => path.join(filepath, file)));
                }
            }));

            filepaths = dependencyFilePaths;
        }
        this.zip.writeZip(formattedZipFilePath);

        reportingService.report(`Backup written:   ${formattedZipFilePath}`);

    }

    static from(value) {
        const service = new ZIPBackupService(value.zipFilepath);
        return service;
    }

    static async wizard() {
        const response = await prompts({
            type: 'text',
            name: 'filepath',
            message: 'Where would you like to store the zip file? (include file extension)'
        });

        const service = new ZIPBackupService(path.resolve(response.filepath));
        return service;
    }

}

module.exports = ZIPBackupService;
