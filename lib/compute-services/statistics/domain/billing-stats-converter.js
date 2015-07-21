
module.exports = BillingStatsConverter;

function BillingStatsConverter() {
    var self = this;

    self.convertClientResponse = function(clientBilling) {
        var groupBillingList = [];
        var groups = clientBilling.groups;

        for (var groupId in groups) {
            if (!groups.hasOwnProperty(groupId)) {
                continue;
            }

            var servers = groups[groupId].servers;
            var serverBillingList = [];

            for (var serverId in servers) {
                if (!servers.hasOwnProperty(serverId)) {
                    continue;
                }

                serverBillingList.push(
                    convertServerBilling(serverId, servers[serverId])
                );
            }

            groupBillingList.push(
                convertGroupBilling(groupId, groups[groupId].name, serverBillingList)
            );
        }

        return {
            date: clientBilling.date,
            groups: groupBillingList
        };
    };

    function convertGroupBilling(groupId, groupName, serverBillingList) {
        return {
            groupId: groupId,
            groupName: groupName,
            servers: serverBillingList
        };
    }

    function convertServerBilling(serverId, clientServerBilling) {
        return {
            serverId: serverId,
            templateCost: clientServerBilling.templateCost,
            archiveCost: clientServerBilling.archiveCost,
            monthlyEstimate: clientServerBilling.monthlyEstimate,
            monthToDate: clientServerBilling.monthToDate,
            currentHour: clientServerBilling.currentHour
        };
    }
}