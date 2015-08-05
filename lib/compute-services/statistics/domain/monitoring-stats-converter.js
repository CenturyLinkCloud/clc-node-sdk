
var moment = require('moment');
var util = require('util');
var _ = require('./../../../core/underscore.js');
var Type = require('./monitoring-stats-type.js');

module.exports = MonitoringStatsConverter;

MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS = 14;
MonitoringStatsConverter.MIN_HOURLY_INTERVAL_HOURS = 1;
MonitoringStatsConverter.DEFAULT_HOURLY_INTERVAL = '00:01:00:00';

MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS = 4;
MonitoringStatsConverter.MIN_REALTIME_INTERVAL_MINUTES = 5;
MonitoringStatsConverter.DEFAULT_REALTIME_INTERVAL = '00:00:05:00';

function MonitoringStatsConverter() {

    var self = this;

    self.TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

    self.validateAndConvert = function(filter) {
        var type = getType(filter);

        if (type === Type.LATEST) {
            return { type: type };
        }

        return type === Type.REALTIME ?
            convertWithinRealTimeType(filter) :
            convertWithinHourlyType(filter);
    };

    function getType(filter) {
        if (filter.type !==  Type.LATEST && filter.type !== Type.REALTIME) {
            return Type.HOURLY;
        }

        return filter.type;
    }

    function convertWithinHourlyType(filter) {
        var start = getStartMoment(filter);
        var interval = getIntervalDuration(filter, MonitoringStatsConverter.DEFAULT_HOURLY_INTERVAL);

        var permittedStart = moment().subtract(MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS, 'days');

        if (start.isBefore(permittedStart)) {
            throw util.format(
                '"start" should be within the past %s day(s)',
                MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS
            );
        }



        if (interval < moment.duration({hours: MonitoringStatsConverter.MIN_HOURLY_INTERVAL_HOURS})) {
            throw util.format(
                '"sampleInterval" should be not less than %s hour(s)',
                MonitoringStatsConverter.MIN_HOURLY_INTERVAL_HOURS
            );
        }

        return composeConvertedResult(start, getEndMoment(filter), interval, Type.HOURLY);
    }

    function convertWithinRealTimeType(filter) {
        var start = getStartMoment(filter);
        var interval = getIntervalDuration(filter, MonitoringStatsConverter.DEFAULT_REALTIME_INTERVAL);

        var permittedStart = moment().subtract(MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS, 'hours');

        if (start.isBefore(permittedStart)) {
            throw util.format(
                '"start" should be within the past %s hour(s)',
                MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS
            );
        }

        if (interval < moment.duration({minutes: MonitoringStatsConverter.MIN_REALTIME_INTERVAL_MINUTES})) {
            throw util.format(
                '"sampleInterval" should be not less than %s minute(s)',
                MonitoringStatsConverter.MIN_REALTIME_INTERVAL_MINUTES
            );
        }

        return composeConvertedResult(start, getEndMoment(filter), interval, Type.REALTIME);
    }

    function composeConvertedResult(start, end, interval, type) {
        checkStatsPeriod(start, end, interval);

        var result = {
            start: start.format(self.TIME_FORMAT),
            sampleInterval: util.format(
                '%s:%s:%s:%s',
                prepareTime(interval.days()),
                prepareTime(interval.hours()),
                prepareTime(interval.minutes()),
                prepareTime(interval.seconds())
            ),
            type: type
        };

        if (end !== undefined) {
            result.end = composeTimeString(end);
        }

        return result;
    }

    function prepareTime(time) {
        return (time < 10 ? '0' : '') + time;
    }

    function getIntervalDuration(filter, defaultInterval) {
        if (filter.sampleInterval === undefined) {
            filter.sampleInterval = defaultInterval;
        }

        var interval = filter.sampleInterval;
        var sampleIntervalError = 'Incorrect "sampleInterval" format';

        /* check if simpleInterval instanceof Moment.Duration */
        if (interval.constructor && interval.constructor.name === "Duration") {
            return interval;
        }

        /* array [days, hours, minutes, seconds] */
       interval = interval.split(':').map(Number);

        _.each(interval, function(number) {
            if (isNaN(number)) {
                throw sampleIntervalError;
            }
        });

        if (interval.length > 4) {
            throw sampleIntervalError;
        } else if (interval.length < 4) {
            while (interval.length < 4) {
                interval.unshift(0);
            }
        }

        return moment.duration({
            seconds: interval[3],
            minutes: interval[2],
            hours: interval[1],
            days: interval[0]
        });
    }

    function getStartMoment(filter) {
        if (filter.start === undefined) {
            throw '"start" should be specified';
        }

        var start = moment(convertDateToString(filter.start));

        if (start.isAfter(moment())) {
            throw '"start" can not be in future';
        }

        return start;
    }

    function getEndMoment(filter) {
        if (filter.end === undefined) {
            return undefined;
        }

        var end = moment(convertDateToString(filter.end));

        if (end.isAfter(moment())) {
            throw '"end" can not be in future';
        }

        return end;
    }

    function convertDateToString(date) {
        return date instanceof Object ?
            moment(date).format(self.TIME_FORMAT) :
            date;
    }

    function composeTimeString(date) {
        return date.format(self.TIME_FORMAT);
    }

    function checkStatsPeriod(start, end, interval) {
        if (end !== undefined && start.isAfter(end)) {
            throw '"start" cannot be later than "end"';
        }

        if (end === undefined) {
            end = moment();
        }

        if (start.isAfter(moment(end).subtract(interval))) {
            throw 'Interval should fit within start/end date';
        }
    }
}