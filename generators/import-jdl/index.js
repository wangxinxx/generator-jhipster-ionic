const jhiCore = require('jhipster-core');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterUtils = require('generator-jhipster/generators/utils');
const prompts = require('../app/prompts');

module.exports = class extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);
        jhipsterUtils.copyObjectProps(this, this.options.context);

        // This makes `filename` a required argument.
        this.argument('filename', {
            type: String,
            required: true,
            description: 'JDL Filename'
        });

        this.context = {};
    }

    get prompting() {
        return {
            askForPath: prompts.askForPath
        };
    }

    writing() {
        // load the JHipster config and set the default jhipster directory
        const jdlFiles = [this.options.filename];
        this.info('The JDL is being parsed.');
        const fromPath = `${this.directoryPath}/.yo-rc.json`;
        const jhipsterConfig = this.fs.readJSON(fromPath)['generator-jhipster'];
        const prodDatabaseType = jhipsterConfig.prodDatabaseType;
        const applicationType = jhipsterConfig.applicationType;
        const baseName = jhipsterConfig.baseName;
        try {
            const jdlObject = jhiCore.convertToJDLFromConfigurationObject({
                document: jhiCore.parseFromFiles(jdlFiles),
                databaseType: prodDatabaseType,
                applicationType,
                applicationName: baseName
            });
            const entities = jhiCore.convertToJHipsterJSON({
                jdlObject,
                databaseType: prodDatabaseType,
                applicationType
            });
            this.info('Writing entity JSON files.');
            this.changedEntities = jhiCore.exportEntities({
                entities,
                forceNoFiltering: false
            });

            this.updatedKeys = Object.keys(this.changedEntities);
            if (this.updatedKeys.length > 0) {
                this.info(`Updated entities: ${this.updatedKeys}`);
            } else {
                this.info('No change in entity configurations. No entities were updated');
            }

            this.context.fromPath = this.directoryPath;
            // generate update entities
            for (let i = 0; i < this.updatedKeys.length; i++) {
                const context = this.context;
                this.composeWith(require.resolve('../entity'), {
                    context,
                    name: this.updatedKeys[i],
                    force: context.options.force,
                    debug: context.isDebugEnabled
                });
            }

            this.success('JDL successfully imported!');
        } catch (e) {
            this.error('\nError while parsing entities from JDL\n');
            if (e && e.message) {
                this.error(`${e.name || ''}: ${e.message}`);
            }
        }
    }
};
