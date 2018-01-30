import {OpenEpsilon, OscDriver} from "../src";
import {SinonSpy, SinonStub, spy, stub} from "sinon";
import {EEDriver, retry} from "empty-epsilon-js";
import {Subject} from "rxjs/Subject";
import {OscMessage} from "osc";
import {expect} from 'chai';
import {GameSchema} from "../src/ee-schema";

describe(`OpenEpsilon service`, () => {

    const schema: GameSchema = {
        "global": {
            "getFoo": {
                "arguments": [],
                "type": ["Foo"]
            }
        },
        "Foo": {
            "getBar": {
                "arguments": [],
                "type": ["float"]
            },
            "setBar": {
                "arguments": ["float"],
                "type": []
            },
        }
    };
    const interval = 10;
    const namespace = 'test';
    const address = `/${namespace}/foo/bar`;
    const value = 1.23;
    const oscMessage: OscMessage = {address, args: [{type: "f", value}]};

    let server: OpenEpsilon;
    let eeDriver: {
        query: SinonStub
        command: SinonSpy,
    } & EEDriver;
    let oscDriver: {
        inbox: Subject<OscMessage>;
        outbox: Subject<OscMessage>;
    } & OscDriver;

    beforeEach(`init`, () => {
        eeDriver = {
            query: stub(),
            command: spy(),
        } as any;
        oscDriver = {
            inbox: new Subject<OscMessage>(),
            outbox: new Subject<OscMessage>(),
        };
        server = new OpenEpsilon(eeDriver, oscDriver, schema, namespace);
        server.init(interval);
    });

    afterEach(() => {
        server.destroy();
    });

    function resetPolling(...addresses: string[]) {
        server.monitoredAddresses = addresses;
        resetEeQuery();
    }

    function resetEeQuery() {
        eeDriver.query.reset();
        eeDriver.query.resolves([value]);
    }

    function grace() {
        return new Promise(res => setTimeout(res, interval * 2));
    }

    function waitfor(promiseProvider: () => void | Promise<void>): Promise<void> {
        return retry(promiseProvider, {interval: interval / 2, timeout: interval * 2})
    }

    it(`continously polls state and sends to osc`, async () => {
        const sent = spy();
        oscDriver.outbox.subscribe(sent);

        // trigger the polling
        resetPolling(address);

        let i = 5;
        while (i--) {
            await waitfor(async () => {
                expect(eeDriver.query).to.have.been.calledWith('getFoo():getBar()', 1);
                expect(sent).to.have.been.calledWith(oscMessage);
            });
            resetEeQuery();
        }
    });

    describe(`stops polling state`, async () => {
        beforeEach(`init`, async () => {
            // trigger the polling
            resetPolling(address);
            // allow time for at least one poll
            await grace();
        });

        it(`when addresses array is empty`, async () => {
            resetPolling();
            resetEeQuery();
            await grace();
            await waitfor(async () => {
                expect(eeDriver.query).to.have.not.been.called;
            });

        });

        it(`after destroyed`, async () => {
            server.destroy();
            resetEeQuery();
            await grace();
            await waitfor(async () => {
                expect(eeDriver.query).to.have.not.been.called;
            });
        });
    });

    it(`sends commands to game server`, async () => {
        oscDriver.inbox.next(oscMessage);
        // await grace();
        expect(eeDriver.command).to.have.callCount(1);
        expect(eeDriver.command).to.have.been.calledWith('getFoo():setBar({0})', [value.toString()]);
    });
});
