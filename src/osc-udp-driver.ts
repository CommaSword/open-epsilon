import {OscMessage, UdpOptions, UDPPort} from "osc";
import {Observable, Subject, Subscription} from 'rxjs';
import {NextObserver} from "rxjs/Observer";
import {NodeStyleEventEmitter} from 'rxjs/observable/FromEventObservable';
import {OscDriver} from "./service";


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
        this.subscription = this.subject.groupBy((msg: OscMessage) => msg.address)
            .mergeMap((o: Observable<OscMessage>) => {
                // o is an observable of all messages of the same address
                // this is the place to use distinctUntilKeyChanged('args', (args1, args2) => deepEqual(args1, args2))
                // and throttleTime
                return o;
            })
            .subscribe(msg => this.port.send(msg));
//        this.port.on('message', (m: OscMessage) => console.log('#####MSG', m.address));
        this.inbox = Observable.fromEvent(this.port as any as NodeStyleEventEmitter, 'message');
        console.info(`OSC server listening on ${options.localAddress}:${options.localPort}, sending to ${options.remoteAddress}:${options.remotePort}`)
    }

    async open() {
        this.port.open();
        await new Promise(res => this.port.once('ready', res));
    }

    close() {
        this.subscription.unsubscribe();
        this.port.close();
    }
}
