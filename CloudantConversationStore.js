'use strict';

class CloudantConversationStore {

    /**
     * Creates a new instance of CloudantConversationStore.
     * @param {Object} cloudant - The instance of cloudant to connect to
     * @param {string} dbName - The name of the database to use
     */
    constructor(cloudant, dbName) {
        this.cloudant = cloudant;
        this.dbName = dbName;
        this.db = null;
    }

    /**
     * Creates and initializes the database.
     * @returns {Promise.<TResult>}
     */
    init() {
        console.log('Getting database...');
        return this.cloudant.db.list()
            .then((dbNames) => {
                var exists = false;
                for (var dbName of dbNames) {
                    if (dbName == this.dbName) {
                        exists = true;
                    }
                }
                if (!exists) {
                    console.log(`Creating database ${this.dbName}...`);
                    return this.cloudant.db.create(this.dbName);
                }
                else {
                    return Promise.resolve();
                }
            })
            .then(() => {
                this.db = this.cloudant.db.use(this.dbName);
                return Promise.resolve();
            })
            .then(() => {
                // see if the rubbish design doc exists, if not then create it
                return this.db.find({selector: {'_id': '_design/questions'}});
            })
            .then((result) => {
                if (result && result.docs && result.docs.length > 0) {
                    return Promise.resolve();
                }
                else {
                    var designDoc = {
                        _id: '_design/questions',
                        views: {
                            rubbish: {
                                map: 'function (doc) {\n  if (doc.type && doc.type==\'rubbishRequest\') {\n    emit(doc.name, 1);\n  }\n}',
                                reduce: '_sum'
                            }
                        },
                        'language': 'javascript'
                    };
                    return this.db.insert(designDoc);
                }
            })
            .catch((err) => {
                console.log(`Cloudant error: ${JSON.stringify(err)}`);
            });
    }

    // Rubbish Strings

    /**
     * Adds a new rubbish to Cloudant if a rubbish string is posted
     * @param rubbishStr - The rubbish string
     * @returns {Promise.<TResult>}
     */
    addRubbish(rubbishStr) {
        var rubbishDoc = {
            type: 'rubbish',
            name: rubbishStr
        };
        return this.addDocIfNotExists(rubbishDoc, 'name')
    }

    getAllRubbish() {
        return this.db.find({ selector: {type: 'rubbish'}})
            .then((rubbishes) => {

                return Promise.resolve(rubbishes);
            });
    }

    // Cloudant Helper Methods

    /**
     * Finds a doc based on the specified docType, propertyName, and propertyValue.
     * @param docType - The type value of the document stored in Cloudant
     * @param propertyName - The property name to search for
     * @param propertyValue - The value that should match for the specified property name
     * @returns {Promise.<TResult>}
     */
    findDoc(docType, propertyName, propertyValue) {
        var selector = {
            '_id': {'$gt': 0},
            'type': docType
        };
        selector[`${propertyName}`] = propertyValue;
        return this.db.find({selector: selector})
            .then((result) => {
                if (result.docs) {
                    return Promise.resolve(result.docs[0]);
                }
                else {
                    return Promise.resolve();
                }
            });
    }

    /**
     * Adds a new doc to Cloudant if a doc with the same value for uniquePropertyName does not exist.
     * @param doc - The document to add
     * @param uniquePropertyName - The name of the property used to search for an existing document (the value will be extracted from the doc provided)
     * @returns {Promise.<TResult>}
     */
    addDocIfNotExists(doc, uniquePropertyName) {
        var docType = doc.type;
        var propertyValue = doc[uniquePropertyName];
        return this.findDoc(docType, uniquePropertyName, propertyValue)
            .then((existingDoc) => {
                if (existingDoc) {
                    console.log(`Returning ${docType} doc where ${uniquePropertyName}=${propertyValue}`);
                    return Promise.resolve(existingDoc);
                }
                else {
                    console.log(`Creating ${docType} doc where ${uniquePropertyName}=${propertyValue}`);
                    return this.db.insert(doc)
                        .then((body) => {
                            doc._id = body.id;
                            doc._rev = body.rev;
                            return Promise.resolve(doc);
                        });
                }
            });
    }
}

module.exports = CloudantConversationStore;