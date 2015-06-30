
/**
 * @typedef CreateServerConfig
 * @type {object}
 * @property {string} name - a server name.
 * @property {string} description - a server description.
 *
 * @property {object} group - a group reference.
 * @property {DataCenterMetadata} group.datacenter - a datacenter reference.
 * @property {string} group.name - a group name.
 *
 * @property {object} template - a template reference.
 * @property {DataCenterMetadata} template.datacenter - a datacenter reference.
 * @property {Os} template.os - an os name.
 * @property {string} template.version - an os version.
 * @property {Machine.Architecture} template.architecture - an os architecture.
 * @property {string} template.edition - an os edition.
 *
 * @property {object} network - a network config.
 * @property {string} network.primaryDns - a primary DNS.
 * @property {string} network.secondaryDns - a secondary DNS.
 * @property {number} cpu - a cpu count.
 * @property {number} memoryGB - a memory size (in GB).
 * @property {Server} type - a server type.
 * @property {Server.StorageType} storageType - a type of server storage.
 * @property {string} ttl - Date/time that the server should be deleted (ISO format).
 */