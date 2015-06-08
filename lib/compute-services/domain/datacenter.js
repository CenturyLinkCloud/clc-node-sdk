/**
 * @typedef DataCenterReference
 * @type {object}
 * @property {string} id - a data center ID.
 * @property {string} name - a data center name.
 */

/**
 * The DataCenter enum
 * @enum {DataCenterReference}
 */
var DataCenter = {

    DE_FRANKFURT: {
        id: 'de1',
        name: 'DE1 - Germany (Frankfurt)'
    },

    CA_VANCOUVER: {
        id: 'ca1',
        name: 'CA1 - Canada (Vancouver)'
    },

    CA_TORONTO_1: {
        id: 'ca2',
        name: 'CA2 - Canada (Toronto)'
    },

    CA_TORONTO_2: {
        id: 'ca3',
        name: 'CA3 - Canada (Toronto)'
    },

    GB_PORTSMOUTH: {
        id: 'gb1',
        name: 'GB1 - Great Britain (Portsmouth)'
    },

    GB_SLOUGH: {
        id: 'gb3',
        name: 'GB3 - Great Britain (Slough)'
    },

    US_CENTRAL_CHICAGO: {
        id: 'il1',
        name: 'IL1 - US Central (Chicago)'
    },

    US_EAST_NEW_YORK: {
        id: 'ny1',
        name: 'NY1 - US East (New York)'
    },

    SG_APAC: {
        id: 'sg1',
        name: 'SG1 - APAC (Singapore)'
    },

    US_WEST_SANTA_CLARA: {
        id: 'uc1',
        name: 'UC1 - US West (Santa Clara)'
    },

    US_CENTRAL_SALT_LAKE_CITY: {
        id: 'ut1',
        name: 'UT1 - US Central (Salt Lake City)'
    },

    US_EAST_STERLING: {
        id: 'va1',
        name: 'VA1 - US East (Sterling)'
    },

    US_WEST_SEATTLE: {
        id: 'wa1',
        name: 'WA1 - US West (Seattle)'
    }
};

module.exports = DataCenter;