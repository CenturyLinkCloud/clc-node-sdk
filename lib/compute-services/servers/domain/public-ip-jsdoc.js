
/**
 * @typedef OpenPort
 * @type {object}
 *
 * @property {String} from - lower bound of the port range
 * @property {String} to - higher bound of the port range
 * @property {String} protocol - protocol which can be 'TCP', 'UDP' or 'ICMP'
 * @property {String} port - port to be open
 *
 * @typedef SourceRestriction
 * @type {object}
 *
 * @property {String} ip - ip address
 * @property {String} mask - mask
 *
 * @typedef PublicIpConfig
 * @type {object}
 *
 * @property {String} internalIPAddress - internal ip address.
 * @property {Array|String} ports - an array of OpenPorts and/or Strings.
 * @property {Array|String} sourceRestrictions - an array of SourceRestrictions and/or Strings.
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