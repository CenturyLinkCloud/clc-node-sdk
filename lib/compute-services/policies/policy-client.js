
module.exports = PolicyClient;

function PolicyClient(rest) {
    var self = this;

    self.createAntiAffinityPolicy = function (request) {
        return rest.postJson('/v2/antiAffinityPolicies/{ACCOUNT}/', request);
    };

    self.deleteAntiAffinityPolicy = function (policyId) {
        return rest.delete('/v2/antiAffinityPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAntiAffinityPolicyById = function (policyId) {
        return rest.get('/v2/antiAffinityPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAntiAffinityPolicies = function () {
        return rest.get('/v2/antiAffinityPolicies/{ACCOUNT}/');
    };

    self.modifyAntiAffinityPolicy = function (policyId, request) {
        return rest.putJson('/v2/antiAffinityPolicies/{ACCOUNT}/' + policyId, request);
    };


    self.createAlertPolicy = function (request) {
        return rest.postJson('/v2/alertPolicies/{ACCOUNT}/', request);
    };

    self.deleteAlertPolicy = function (policyId) {
        return rest.delete('/v2/alertPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAlertPolicyById = function (policyId) {
        return rest.get('/v2/alertPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAlertPolicies = function () {
        return rest.get('/v2/alertPolicies/{ACCOUNT}/');
    };

    self.modifyAlertPolicy = function (policyId, request) {
        return rest.putJson('/v2/alertPolicies/{ACCOUNT}/' + policyId, request);
    };
}
