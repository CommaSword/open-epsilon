import {getMonitoredAddresses, monitorByAddress} from "../src/game-monitor";
import {Subject} from "rxjs";
import {spy, stub} from "sinon";
import {expect} from "chai";
import {MemoryFileSystem} from "kissfs";

function delay(timeout: number) {
    return new Promise(r => setTimeout(r, timeout));
}

describe('getMonitoredAddresses', () => {

    const INITIAL_VALUE = ['/foo/bar'];
    const OTHER_VALUE = ['/foo', '/foo/bar', 'foo2/bar'];
    let fs: MemoryFileSystem;

    beforeEach(async () => {
        fs = new MemoryFileSystem();
        await fs.saveFile('game-monitor.json', JSON.stringify(INITIAL_VALUE));
    });

    it('reads file correctly', async () => {
        const monitored = await getMonitoredAddresses(fs);
        expect(monitored).to.eql(INITIAL_VALUE);
    });

    it('tracks changes', async () => {
        const monitored = await getMonitoredAddresses(fs);
        await fs.saveFile('game-monitor.json', JSON.stringify(OTHER_VALUE));
        expect(monitored).to.eql(OTHER_VALUE);
    });

    it('ignores invalid changes', async () => {
        const monitored = await getMonitoredAddresses(fs);
        await fs.saveFile('game-monitor.json', 'fooooo');
        expect(monitored).to.eql(INITIAL_VALUE);
    });
});


describe('monitorByAddress', () => {

    const pollRequests = new Subject<string>();
    const fakeDriver = {
        query: stub(),
    };
    const output = spy();
    const translator = stub();

    it('basically works', async () => {
        const address = '/ee/player-ship/-1/rotation';
        const expr = `getPlayerShip(-1):getRotation()`;
        const driverResult = '6';

        monitorByAddress(pollRequests, fakeDriver as any, translator)
            .subscribe(output, console.error.bind(console), console.log.bind(console, 'completed'));

        expect(translator).to.have.callCount(0);
        expect(fakeDriver.query).to.have.callCount(0);

        translator.returns({
            address,
            expr,
            type: 'f'
        });
        fakeDriver.query.resolves([driverResult]);

        pollRequests.next(address);

        expect(translator).to.have.callCount(1);
        expect(translator).to.have.been.calledWith(address);

        expect(fakeDriver.query).to.have.callCount(1);
        expect(fakeDriver.query).to.have.been.calledWith(expr);

        // "wait" for the driver's result
        await delay(1);
        expect(output).to.have.callCount(1);
        expect(output).to.have.been.calledWith({
            address,
            args: [{type: 'f', value: driverResult}]
        });

    });

});
