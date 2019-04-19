#!/usr/bin/env node

const path = require('path');
const os = require('os');

const {
    fileExists,
    readFile,
    writeFile
} = require('../src/utils');

const BACKUP_SERVICES = require('../src/backup-services');
const BackupService = require('../src/backup-services/BackupService');

const REPORTING_SERVICES = require('../src/reporting-services');
const ReportingService = require('../src/reporting-services/ReportingService');

let configFilepath = path.join(os.homedir(), '.backup.json');
let config = null;

function configReviver(key, value) {
    if (key == 'files' && !(value instanceof Set)) {
        return new Set(Array.from(value));
    }

    if (value.backupServiceType) {
        const Service = BACKUP_SERVICES[value.backupServiceType];
        if (!Service) {
            throw new Error(`Backup service not found: ${value.backupServiceType}`);
        }
        return Service.from(value);
    }

    if (value.reportingServiceType) {
        const Service = REPORTING_SERVICES[value.reportingServiceType];
        if (!Service) {
            throw new Error(`Reporting service not found: ${value.reportingServiceType}`);
        }
        return Service.from(value);
    }

    return value;
}

function configReplacer(key, value) {
    if (key == 'files' && !(value instanceof Array)) {
        return Array.from(value);
    }

    if (value instanceof BackupService) {
        const replacedValue = Object.assign({
            backupServiceType: value.constructor.name
        }, value);
        return replacedValue;
    }

    if (value instanceof ReportingService) {
        const replacedValue = Object.assign({
            reportingServiceType: value.constructor.name
        }, value);
        return replacedValue;
    }

    return value;
}

async function loadConfig() {
    if (await fileExists(configFilepath)) {
        const str = (await readFile(configFilepath)).toString('utf8');
        if (str) config = JSON.parse(str, configReviver);
    }
    if (!config) config = {};
}

async function saveConfig() {
    await writeFile(configFilepath, JSON.stringify(config, configReplacer, 2));
}

/**
 * Add files to backup
 * Updates config object
 *
 * @param  {...any} filepaths Filepaths to add in config
 */
function addFiles(...filepaths) {
    if (!config) throw new Error('Config not found');
    if (!config.files) config.files = new Set();

    filepaths.forEach((filepath) => config.files.add(path.resolve(filepath)));

}

/**
 * Remove files from backup
 * Updates config object
 *
 * @param  {...any} filepaths Filepaths to remove in config
 */
function removeFiles(...filepaths) {
    if (!config) throw new Error('Config not found');
    if (!config.files) return;

    filepaths.forEach((filepath) => config.files.delete(path.resolve(filepath)));

}

function addBackupService(name, service) {
    if (!config) throw new Error('Config not found');
    if (!config.backupServices) config.backupServices = {};

    if (config.backupServices[name]) {
        throw new Error('Service name already exists');
    }

    config.backupServices[name] = service;

}

function addReportingService(name, service) {
    if (!config) throw new Error('Config not found');
    if (!config.reportingServices) config.reportingServices = {};

    if (config.reportingServices[name]) {
        throw new Error('Service name already exists');
    }

    config.reportingServices[name] = service;

}

/**
 * Backup files
 */
async function backup() {
    if (!config) throw new Error('Config not found');
    if (!config.files) throw new Error('No files registered for backup');
    if (!config.backupServices) throw new Error('No backup services configured');
    if (!config.reportingServices) throw new Error('No reporting services configured');

    const mergedReportingService =
        new ReportingService.MergedReportingService(Object.values(config.reportingServices));

    mergedReportingService.report('Backup starting');

    try {
        await Promise.all(Object.entries(config.backupServices).map(async ([name, service]) => {
            const prefixedReportingService = mergedReportingService.getPrefixedReportingService(`${name}(${service.constructor.name}): `);
            await service.put([
                path.resolve(configFilepath),
                ...config.files
            ], prefixedReportingService);
        }));
    } catch (e) {
        mergedReportingService.report(`Encountered error during backup:\n${e.stack}`, ReportingService.ERROR);
    }

    mergedReportingService.report('Backup finished');

    await Promise.all(Object.values(config.reportingServices).map((service) => service.flush()));

}

(async () => {

    await loadConfig();

    require('yargs')
        .command('add [path...]', 'Add files to backup', (yargs) => {
            yargs
                .positional('path', {
                    describe: 'Path to file to add'
                });
        }, (argv) => {
            addFiles(...argv.path);
            saveConfig();
        })
        .command('remove [path...]', 'Remove files from backup', (yargs) => {
            yargs
                .positional('path', {
                    describe: 'Path to file to remove'
                });
        }, (argv) => {
            removeFiles(...argv.path);
            saveConfig();
        })
        .command('service add [name] [service]', 'Add backup service', (yargs) => {
            yargs
                .positional('name', {
                    describe: 'Name of backup service'
                })
                .positional('service', {
                    describe: 'Backup service type'
                });
        }, async (argv) => {
            const Service = BACKUP_SERVICES[argv.service];
            if (!Service) {
                throw new Error(`Backup service not found: ${argv.service}`);
            }
            const service = await Service.wizard();
            addBackupService(argv.name, service);
            saveConfig();
        })
        .command('report add [name] [service]', 'Add reporting service', (yargs) => {
            yargs
                .positional('name', {
                    describe: 'Name of reporting service'
                })
                .positional('service', {
                    describe: 'Reporting service type'
                });
        }, async (argv) => {
            const Service = REPORTING_SERVICES[argv.service];
            if (!Service) {
                throw new Error(`Reporting service not found: ${argv.service}`);
            }
            const service = await Service.wizard();
            addReportingService(argv.name, service);
            saveConfig();
        })
        .command('now', 'Back up now', () => { }, async (argv) => {
            await backup();
        })
        .argv;

})();
