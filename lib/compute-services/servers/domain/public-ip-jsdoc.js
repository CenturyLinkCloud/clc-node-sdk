
/**
 * @typedef PublicIpConfig
 * @type {object}
 *
 * @property {String} internalIPAddress - internal ip address.
 * @property {Array} ports - an array of open ports.
 * @property {Array} sourceRestrictions - an array of source restrictions.
 *
 * @example
 * {
 *    internalIPAddress: '10.11.12.13'
 *    openPorts: [
 *        Port.HTTP,
 *        Port.HTTPS,
 *        { from: 8080, to: 8081 },
 *        { protocol: Protocol.TCP, port: 23 }
 *    ],
 *    sourceRestrictions: [
 *        '71.100.60.0/24',
 *        { ip: '192.168.3.0', mask: '255.255.255.128' }
 *    ]
 * }
 */