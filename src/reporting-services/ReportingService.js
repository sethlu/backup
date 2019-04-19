class ReportingService {

    constructor(reportingLevel = ReportingService.INFO) {
        this.reportingLevel = reportingLevel;
    }

    async report(message, level = ReportingService.INFO) {
        throw new Error('Not implemented');
    }

    async flush() {
        throw new Error('Not implemented');
    }

    static from(value) {
        throw new Error('Not implemented');
    }
    
    static async wizard() {
        throw new Error('Not implemented');
    }

    getPrefixedReportingService(prefix) {
        return new PrefixedReportingService(this, prefix);
    }

}

class PrefixedReportingService extends ReportingService {

    constructor(service, prefix) {
        super(); // Reporting level doesn't matter

        this.service = service;
        this.prefix = prefix;
    }

    async report(message, level = ReportingService.INFO) {
        return this.service.report(this.prefix + message, level);
    }

    async flush() {
        throw new Error('Unsupported operation');
    }

    static async from() {
        throw new Error('Unsupported operation');
    }

    static async wizard() {
        throw new Error('Unsupported operation');
    }

}

class MergedReportingService extends ReportingService {

    constructor(services) {
        super(); // Reporting level doesn't matter

        this.services = services;
    }

    async report(message, level = ReportingService.INFO) {
        return Promise.all(this.services.map((service) => service.report(message, level)));
    }

    async flush() {
        throw new Error('Unsupported operation');
    }

    static async from() {
        throw new Error('Unsupported operation');
    }

    static async wizard() {
        throw new Error('Unsupported operation');
    }

}

Object.assign(ReportingService, {
    
    PrefixedReportingService,
    MergedReportingService,

    VERBOSE: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3

});

module.exports = ReportingService;
