
var Port = {
    ANY: 'any',
    PING: 'icmp',
    HTTPS: TCP(443),
    HTTP_80: TCP(80),
    HTTP_8080: TCP(8080),
    SSH: TCP(22),
    RDP: TCP(3389),
    FTP: TCP(21),
    FTPS: TCP(990)

};

function convert(protocol, port, to) {
    if (to) {
        return protocol + '/' + port + '-' + to;
    }
    return protocol + '/' + port;
}

function TCP(port, to) {
    return convert('tcp', port, to);
}

Port.TCP = TCP;

function UDP(port, to) {
    return convert('udp', port, to);
}

Port.UDP = UDP;

Port.convert = convert;

module.exports = Port;