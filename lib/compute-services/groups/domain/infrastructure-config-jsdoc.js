
/**
 * There is he similar to {@link GroupConfig} only just has dataCenter property
 * @typedef InfrastructureConfig
 *
 * @example
 * {
 *    dataCenter: compute.DataCenter.US_CENTRAL_CHICAGO,
 *    name: 'Group-1',
 *    description: 'Test Group',
 *    subItems: [
 *    {
 *        name: 'Group-1-1',
 *        subItems: [
 *            {
 *                name: "web",
 *                description: "My web server",
 *                template: {
 *                    dataCenter: compute.DataCenter.US_CENTRAL_CHICAGO,
 *                    operatingSystem: {
 *                        family: compute.OsFamily.CENTOS,
 *                        version: "6",
 *                        architecture: compute.Machine.Architecture.X86_64
 *                    }
 *                },
 *                machine: {
 *                    cpu: 1,
 *                    memoryGB: 1,
 *                    disks: [
 *                        {size: 2}
 *                    ]
 *                }
 *            },
 *            {name: 'Group-1-1-1'}
 *        ]
 *    },
 *    {
 *        name: 'Group-1-2',
 *        subItems:[
 *            mysqlServer(),
 *           nginxServer()
 *        ]
 *    }
 *]}
 */



/**
 * @typedef GroupConfig
 * @type {object}
 * @property {string} name - group name
 * @property {string} description - group description
 * @property {Array<GroupConfig|ServerConfig>} subItems - the list of items in group.
 */

/**
 * There is the similar to {@link CreateServerConfig} except:
 * <br/>
 * <ul>
 *     <li>group property is omitted
 *     <li>count property may be processed
 * </ul>
 * @typedef ServerConfig
 * @type {object}
 * @property {string} count - the count of similar servers
 */