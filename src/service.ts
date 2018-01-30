import {Observable} from 'rxjs';
import {EEDriver} from "empty-epsilon-js";
import {executeDriverCommands, monitorByAddress} from "./game-monitor";
import {Subscription} from "rxjs/Subscription";
import {processApiSchema} from "./process-schema";
import {emptyEpsilonSchema, GameSchema} from './ee-schema';
import {MessageTranslator} from './translate';
import {OscMessage} from "osc";
import {NextObserver} from "rxjs/Observer";

export interface OscDriver {
    readonly inbox: Observable<OscMessage>;
    readonly outbox: NextObserver<OscMessage>;
}

export class OpenEpsilon {

    public monitoredAddresses: Array<string> = [];
    private subscription: Array<Subscription> = [];
    private readonly translator: MessageTranslator;

    constructor(private eeDriver: EEDriver, private oscDriver: OscDriver, apiSchema: GameSchema = emptyEpsilonSchema, private namespace: string = 'ee') {
        this.translator = new MessageTranslator(processApiSchema(apiSchema), namespace);
    }

    init(interval: number = 1000) {
        if (this.isInitialized()) {
            throw new Error('init() called on initialized service');
        }
        const pulse = Observable.interval(interval);
        const pollRequests = pulse.switchMap<any, string>(_ => this.monitoredAddresses);
        this.subscription.push(monitorByAddress(pollRequests, this.eeDriver, this.translator.translateAddressToGameQuery).subscribe(this.oscDriver.outbox));
        this.subscription.push(executeDriverCommands(this.oscDriver.inbox.filter(m => m.address.startsWith(`/${this.namespace}/`)), this.eeDriver, this.translator.translateOscMessageToGameCommand));
    }

    isInitialized() {
        return !!this.subscription.length;
    }

    destroy() {
        this.subscription.forEach(s => s.unsubscribe());
        this.subscription = [];
    }
}
