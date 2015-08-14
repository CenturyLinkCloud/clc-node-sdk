
/**
 * @typedef TimeFilter
 * @type {Object}
 *
 * @property {String|Moment} start - start time.
 * @property {String|Moment} end - end time.
 * @property {String|Moment.duration} sampleInterval - time interval.
 * @property {MonitoringStatsType} type - data type.
 *
 * @example with Strings
 * {
 *     start: '2015-04-05T16:00:00',
 *     end: '2015-04-05T22:00:00',
 *     sampleInterval: '02:00:00',
 *     type: MonitoringStatsType.HOURLY,
 * }
 *
 * @example with Moment
 * {
 *     start: moment().subtract(4, 'hours'),
 *     end: moment().subtract(10, 'hours'),
 *     sampleInterval: moment.duration(2, 'hours'),
 *     type: compute.MonitoringStatsType.HOURLY
 * }
 */