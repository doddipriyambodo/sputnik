/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the 'License'). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

'use strict';

const Logger = require('logger');
const moment = require('moment');
const AWS = require('aws-sdk');
const _ = require('underscore');
const uuid = require('uuid');


/**
 * Performs crud actions for a device type, such as, creating, retrieving, updating and deleting device types.
 *
 * @class DeviceTypeManager
 */
class DeviceTypeManager {

    /**
     * @class DeviceTypeManager
     * @constructor
     */
    constructor() {
        this.creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
        this.dynamoConfig = {
            credentials: this.creds,
            region: process.env.AWS_REGION
        };
    }

    /**
     * Get device types.
     * @param {JSON} ticket - authorization ticket.
     */
    getDeviceTypes(ticket, page) {

        const _self = this;
        return new Promise((resolve, reject) => {

            let _page = parseInt(page);
            if (isNaN(_page)) {
                _page = 0;
            }

            _self._getDeviceTypePage(ticket, null, 0, _page).then(results => {
                resolve(results);
            }).catch((err) => {
                Logger.error(Logger.levels.INFO, err);
                Logger.error(Logger.levels.INFO, 'Error occurred while attempting to retrieve device types.');
                reject({
                    code: 500,
                    error: 'DeviceTypeRetrievalFailure',
                    message: err
                });
            });

        });
    }
    getAllDeviceTypes(ticket) {
        const _self = this;
        return new Promise((resolve, reject) => {
            _self._getAllDeviceTypesPage(ticket, null).then(results => {
                resolve(results);
            }).catch((err) => {
                Logger.error(Logger.levels.INFO, err);
                Logger.error(Logger.levels.INFO, 'Error occurred while attempting to retrieve device types.');
                reject({
                    code: 500,
                    error: 'DeviceTypeRetrievalFailure',
                    message: err
                });
            });
        });
    }

    /**
     * Get specific devices page for the user.
     * @param {JSON} ticket - authorization ticket.
     * @param {string} lastevalkey - a serializable JavaScript object representing last evaluated key
     * @param {int} curpage - current page evaluated
     * @param {int} targetpage - target page of devices to Retrieves
     */
    _getDeviceTypePage(ticket, lastevalkey, curpage, targetpage) {
        const _self = this;
        return new Promise((resolve, reject) => {

            let params = {
                TableName: process.env.DEVICE_TYPES_TBL,
                Limit: 20
            };

            if (lastevalkey) {
                params.ExclusiveStartKey = lastevalkey;
            }

            let docClient = new AWS.DynamoDB.DocumentClient(_self.dynamoConfig);
            docClient.scan(params).promise().then(result => {

                if (curpage === targetpage) {
                    return resolve(result.Items);
                } else if (result.LastEvaluatedKey) {
                    curpage++;
                    _self._getDeviceTypePage(ticket, result.LastEvaluatedKey, curpage, targetpage).then((data) => {
                        resolve(data);
                    }).catch((err) => {
                        return reject(err);
                    });
                } else {
                    return resolve([]);
                }
            }).catch(err => {
                Logger.error(Logger.levels.INFO, err);
                reject(`Error occurred while attempting to retrieve page ${targetpage} of device types.`);
            });

        });

    }
    _getAllDeviceTypesPage(ticket, lastevalkey) {

        const _self = this;
        return new Promise((resolve, reject) => {

            let params = {
                TableName: process.env.DEVICE_TYPES_TBL,
                Limit: 75
            };

            if (lastevalkey) {
                params.ExclusiveStartKey = lastevalkey;
            }

            let docClient = new AWS.DynamoDB.DocumentClient(_self.dynamoConfig);
            docClient.scan(params).promise().then(result => {

                let _deviceTypes = [].concat(result.Items);

                if (result.LastEvaluatedKey) {
                    _self._getDeviceTypeStats(ticket, result.LastEvaluatedKey).then(data => {
                        _deviceTypes = _deviceTypes.concat(data.Items);
                        resolve(_deviceTypes);
                    }).catch((err) => {
                        Logger.error(Logger.levels.INFO, err);
                        reject('Error occurred while attempting to retrieve device type statistics.');
                    });
                } else {
                    resolve(_deviceTypes);
                }
            }).catch(err => {
                Logger.error(Logger.levels.INFO, err);
                return reject(`Error occurred while attempting to retrieve stats for ${process.env.DEVICE_TYPES_TBL}.`);
            });
        });

    }

    /**
     * Retrieves device type statistics.
     * @param {JSON} ticket - authentication ticket
     */
    getDeviceTypeStats(ticket) {
        const _self = this;
        return new Promise((resolve, reject) => {
            _self._getDeviceTypeStats(ticket, null).then((data) => {
                resolve(data);
            }).catch((err) => {
                Logger.error(Logger.levels.INFO, err);
                Logger.error(Logger.levels.INFO, 'Error occurred while attempting to retrieve device type stats');
                reject({
                    code: 500,
                    error: 'DeviceTypeStatsRetrievalFailure',
                    message: err
                });
            });
        });
    }

    /**
     * Get device types statistics for the user.
     * @param {JSON} ticket - authorization ticket.
     * @param {string} lastevalkey - a serializable JavaScript object representing last evaluated key
     */
    _getDeviceTypeStats(ticket, lastevalkey) {

        const _self = this;
        return new Promise((resolve, reject) => {

            let params = {
                TableName: process.env.DEVICE_TYPES_TBL,
                ProjectionExpression: 'typeId, custom',
                Limit: 75
            };

            if (lastevalkey) {
                params.ExclusiveStartKey = lastevalkey;
            }

            let docClient = new AWS.DynamoDB.DocumentClient(_self.dynamoConfig);
            docClient.scan(params).promise().then(result => {

                let _stats = {
                    total: result.Items.length
                };

                if (result.LastEvaluatedKey) {
                    _self._getDeviceTypeStats(ticket, result.LastEvaluatedKey).then((data) => {
                        _stats.total = _stats.total + data.total;
                        resolve(_stats);
                    }).catch((err) => {
                        Logger.error(Logger.levels.INFO, err);
                        reject('Error occurred while attempting to retrieve device type statistics.');
                    });
                } else {
                    resolve(_stats);
                }
            }).catch(err => {
                Logger.error(Logger.levels.INFO, err);
                return reject(`Error occurred while attempting to retrieve stats for ${process.env.DEVICE_TYPES_TBL}.`);
            });
        });

    }

    /**
     * Retrieves a device type.
     * @param {JSON} ticket - authentication ticket
     * @param {string} deviceTypeId - id of device type to retrieve
     */
    getDeviceType(ticket, deviceTypeId) {
        const _self = this;

        return new Promise((resolve, reject) => {

            let params = {
                TableName: process.env.DEVICE_TYPES_TBL,
                Key: {
                    typeId: deviceTypeId
                }
            };

            let docClient = new AWS.DynamoDB.DocumentClient(_self.dynamoConfig);
            docClient.get(params, function (err, data) {
                if (err) {
                    Logger.error(Logger.levels.INFO, err);
                    return reject({
                        code: 500,
                        error: 'DeviceTypeRetrieveFailure',
                        message: `Error occurred while attempting to retrieve device type ${deviceTypeId} for user ${ticket.userid}.`
                    });
                }

                if (!_.isEmpty(data)) {
                    return resolve(data.Item);
                } else {
                    return reject({
                        code: 400,
                        error: 'MissingDeviceType',
                        message: `The device type ${deviceTypeId} for user ${ticket.userid} or default does not exist.`
                    });
                }
            });
        });
    }

    /**
     * Creates a device type.
     * @param {JSON} ticket - authentication ticket
     * @param {JSON} deviceType - device type object
     */
    createDeviceType(ticket, deviceType) {

        const _self = this;

        return new Promise((resolve, reject) => {

            if (ticket.isAdmin === true) {

                let _id = _.has(deviceType, 'typeId') ? deviceType.typeId : uuid.v4();
                if (_id === "") {
                    _id = uuid.v4();
                }

                let _deviceType = {
                    typeId: _id,
                    name: deviceType.name,
                    custom: deviceType.custom,
                    createdBy: ticket.userid,
                    spec: deviceType.spec,
                    createdAt: moment().utc().format(),
                    updatedAt: moment().utc().format()
                };

                let params = {
                    TableName: process.env.DEVICE_TYPES_TBL,
                    Item: _deviceType
                };

                let docClient = new AWS.DynamoDB.DocumentClient(_self.dynamoConfig);
                docClient.put(params).promise().then(data => resolve(_deviceType)).catch(err => {
                    Logger.error(Logger.levels.INFO, err);
                    reject({
                        code: 500,
                        error: 'DeviceTypeCreateFailure',
                        message: `Error occurred while attempting to create device type for user ${ticket.userid}.`
                    });
                });


            } else {
                reject({
                    code: 401,
                    error: 'DeviceTypeCreateFailure',
                    message: `Error occurred while attempting to create device type for user ${ticket.userid}. Only Administrators can create types: User's groups ${JSON.stringify(ticket.groups)}`
                });
            }
        });
    }

    /**
     * Deletes a device type for user.
     * @param {JSON} ticket - authentication ticket
     * @param {string} deviceTypeId - id of device type to delete
     */
    deleteDeviceType(ticket, deviceTypeId) {

        const _self = this;
        return new Promise((resolve, reject) => {

            if (!ticket.isAdmin) {
                return reject({
                    code: 401,
                    error: 'DeviceTypeCreateFailure',
                    message: `Error occurred while attempting to delete device type for user ${ticket.userid}. Only Administrators can delete types: User's groups ${JSON.stringify(ticket.groups)}`
                });
            }

            let params = {
                TableName: process.env.DEVICE_TYPES_TBL,
                Key: {
                    typeId: deviceTypeId
                }
            };

            let docClient = new AWS.DynamoDB.DocumentClient(_self.dynamoConfig);
            docClient.get(params, function (err, deviceType) {
                if (err) {
                    Logger.error(Logger.levels.INFO, err);
                    return reject({
                        code: 500,
                        error: 'DeviceTypeRetrieveFailure',
                        message: `Error occurred while attempting to retrieve device type ${deviceTypeId} for user ${ticket.userid} to delete.`
                    });
                }

                if (!_.isEmpty(deviceType)) {
                    docClient.delete(params, function (err, data) {
                        if (err) {
                            Logger.error(Logger.levels.INFO, err);
                            return reject({
                                code: 500,
                                error: 'DeviceTypeDeleteFailure',
                                message: `Error occurred while attempting to delete device type ${deviceTypeId} for user ${ticket.userid}.`
                            });
                        }

                        resolve(data);
                    });
                } else {
                    return reject({
                        code: 400,
                        error: 'MissingDeviceType',
                        message: `The requested device type ${deviceTypeId} for user ${ticket.userid} does not exist.`
                    });
                }
            });
        });
    }

    /**
     * Updates a device type for user.
     * @param {JSON} ticket - authentication ticket
     * @param {string} deviceTypeId - id device type to update
     * @param {string} newDeviceType - new device type object
     */
    updateDeviceType(ticket, deviceTypeId, newDeviceType) {

        const _self = this;
        return new Promise((resolve, reject) => {

            if (!ticket.isAdmin) {
                return reject({
                    code: 401,
                    error: 'DeviceTypeCreateFailure',
                    message: `Error occurred while attempting to update device type for user ${ticket.userid}. Only Administrators can update types: User's groups ${JSON.stringify(ticket.groups)}`
                });
            }

            let _params = {
                TableName: process.env.DEVICE_TYPES_TBL,
                Key: {
                    typeId: deviceTypeId
                }
            };

            let docClient = new AWS.DynamoDB.DocumentClient(_self.dynamoConfig);
            docClient.get(_params, function (err, deviceType) {
                if (err) {
                    Logger.error(Logger.levels.INFO, err);
                    return reject({
                        code: 500,
                        error: 'DeviceTypeRetrieveFailure',
                        message: `Error occurred while attempting to retrieve device type ${deviceTypeId} for user ${ticket.userid} to update.`
                    });
                }

                if (!_.isEmpty(deviceType)) {
                    deviceType.Item.updatedAt = moment().utc().format();
                    deviceType.Item.name = newDeviceType.name;
                    deviceType.Item.spec = newDeviceType.spec;

                    let _updateParams = {
                        TableName: process.env.DEVICE_TYPES_TBL,
                        Item: deviceType.Item
                    };

                    docClient.put(_updateParams, function (err, data) {
                        if (err) {
                            Logger.error(Logger.levels.INFO, err);
                            return reject({
                                code: 500,
                                error: 'DeviceTypeUpdateFailure',
                                message: `Error occurred while attempting to update device type ${deviceTypeId} for user ${ticket.userid}.`
                            });
                        }

                        resolve(data);
                    });
                } else {
                    return reject({
                        code: 400,
                        error: 'MissingDeviceType',
                        message: `The requested device type ${deviceTypeId} for user ${ticket.userid} does not exist.`
                    });
                }
            });
        });
    }

}

module.exports = DeviceTypeManager;
