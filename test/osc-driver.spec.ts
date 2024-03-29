import {OscMessage, UDPPort} from "osc";

import {OscUdpDriver} from "../src/osc-udp-driver";
import {expect} from "chai";
import {spy} from "sinon";

function delay(timeout: number) {
    return new Promise(r => setTimeout(r, timeout));
}

const NETWORK_GRACE = 30;

describe('OscUdpDriver (real network test)', () => {
    const MSG: OscMessage = {address: '/foo/bar', args: [{type: 'f', value: 5.677999973297119}]};

    const sent = spy();
    const received = spy();

    let oscDriver = new OscUdpDriver({
        remotePort: 56668,
        localPort: 56667,
        localAddress: '0.0.0.0',
        metadata: true
    });

    let udpPort = new UDPPort({
        remotePort: 56667,
        localPort: 56668,
        remoteAddress: '127.0.0.1',
        localAddress: '0.0.0.0',
        metadata: true
    });

    udpPort.on('message', sent);
    oscDriver.inbox.subscribe(received);

    before(async () => {
        udpPort.open();
        oscDriver.open();
        await delay(1);

    });

    after(() => {
        udpPort.close();
        oscDriver.close();
    });

    it('can send messages', async () => {

        oscDriver.outbox.next(MSG);

        await delay(NETWORK_GRACE);

        expect(sent).to.have.callCount(1);
        expect(sent).to.have.been.calledWith(MSG);
    });

    it('can receive messages', async () => {
        udpPort.send(MSG);
        await delay(NETWORK_GRACE);
        expect(received).to.have.callCount(1);
        expect(received).to.have.been.calledWith(MSG);
    });
});
