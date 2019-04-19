const path = require('path');

const prompts = require('prompts');

const { appendFile } = require('../utils');
const ReportingService = require('./ReportingService');

class LogFileReportingService extends ReportingService {

    constructor(filepath, reportingLevel = ReportingService.INFO) {
        super(reportingLevel);
        Object.defineProperty(this, 'outputBuffer', {
            configurable: false,
            enumerable: false,
            value: '',
            writable: true
        })

        this.filepath = filepath;
    }

    async report(message, level = ReportingService.INFO) {
        if (level < this.reportingLevel) return;

        this.outputBuffer += `${new Date()} ${message}\n`;

    }

    async flush() {
        
        await appendFile(this.filepath, this.outputBuffer);

    }

    static from(value) {
        const service = new LogFileReportingService(value.filepath, value.reportingLevel);
        return service;
    }

    static async wizard() {
        const response = await prompts({
            type: 'text',
            name: 'filepath',
            message: 'Where would you like to save the logs? (include file extension)'
        });

        const service = new LogFileReportingService(path.resolve(response.filepath));
        return service;
    }

}

module.exports = LogFileReportingService;
