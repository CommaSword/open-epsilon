import { Observable, Subject, Subscription, fromEvent } from 'rxjs';
import { OscMessage, PortEvents, SenderInfo, UDPPort, UdpOptions } from "osc";
import { groupBy, map, mergeMap } from 'rxjs/operators';

import { NextObserver } from "rxjs/Observer";
import { OscDriver } from "./service";

type PortMessageEvent = Parameters<PortEvents['message']>

export class OscUdpDriver implements OscDriver {
    public readonly inbox: Observable<OscMessage>;
    public readonly outbox: NextObserver<OscMessage>;
    private readonly subscription: Subscription;
    private readonly port: UDPPort;
    private readonly subject: Subject<OscMessage>;

    constructor(options: UdpOptions) {
        this.subject = new Subject<OscMessage>();
        this.outbox = this.subject;
        options = Object.assign({},
            {
                remoteAddress: "255.255.255.255",
                broadcast: true,
                metadata: true
            }, options);
        this.port = new UDPPort(options);
        this.subscription = this.subject
            .pipe(groupBy((msg: OscMessage) => msg.address))
            .pipe(mergeMap((o: Observable<OscMessage>) => {
                    // o is an observable of all messages of the same address
                    // this is the place to use distinctUntilKeyChanged('args', (args1, args2) => deepEqual(args1, args2))
                    // and throttleTime
                    return o;
                }))
            .subscribe(msg => this.port.send(msg));
        this.inbox = fromEvent<PortMessageEvent>(this.port as any, 'message').pipe(map(([msg]) => msg));
        console.info(`OSC server listening on ${options.localAddress}:${options.localPort}, sending to ${options.remoteAddress}:${options.remotePort}`)
    }

    async open() {
        this.port.open();
        await new Promise<void>(res => this.port.once('ready', res));
    }

    close() {
        this.subscription.unsubscribe();
        this.port.close();
    }
}
