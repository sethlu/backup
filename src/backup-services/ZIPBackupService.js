const fs = require('fs');
const path = require('path');

const prompts = require('prompts');
const format = require('string-format')

const BackupService = require('./BackupService');
const {
    fileExists
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
        const formattedFilePath = format(this.zipFilepath, {
            date: {
                yyyy: date.getFullYear(),
                mm: ('0' + date.getMonth()).slice(-2),
                dd: ('0' + date.getDay()).slice(-2)
            }
        });

        reportingService.report(`Backing up files to: ${formattedFilePath}`);

        if (await fileExists(formattedFilePath)) {
            this.zip = new AdmZip(formattedFilePath);
        } else {
            this.zip = new AdmZip();
        }

        filepaths.forEach((filepath) => {
            reportingService.report(`Adding: ${filepath}`);
            if (fs.lstatSync(filepath).isFile()) {
                this.zip.addLocalFile(filepath, path.dirname(filepath));
            } else {
                this.zip.addLocalFolder(filepath, filepath);
            }
        });
        this.zip.writeZip(formattedFilePath);

        reportingService.report(`File written to: ${formattedFilePath}`);

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
