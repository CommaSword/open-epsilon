import {Observable} from 'rxjs';
import {EEDriver} from "empty-epsilon-js";
import {executeDriverCommands, monitorByAddress} from "./game-monitor";
import {OscDriver} from "./osc-driver";
import {Subscription} from "rxjs/Subscription";
import {GameSchema, processApiSchema} from "./process-schema";
import defaultSchema from './ee-schema';
import {MessageTranslator} from './translate';


export class OpenEpsilon {
    public monitoredAddresses: Array<string> = [];
    private subscription: Array<Subscription> = [];
    private readonly translator: MessageTranslator;

    constructor(private eeDriver: EEDriver, private oscDriver: OscDriver, apiSchema: GameSchema = defaultSchema) {
        this.translator = new MessageTranslator(processApiSchema(apiSchema));
    }

    init() {
        if (this.isInitialized()) {
            throw new Error('init() called on initialized service');
        }
        const pulse = Observable.interval(1000);
        const pollRequests = pulse.switchMap<any, string>(_ => this.monitoredAddresses);
        this.subscription.push(monitorByAddress(pollRequests, this.eeDriver, this.translator.translateAddressToGameQuery).subscribe(this.oscDriver.outbox));
        this.subscription.push(executeDriverCommands(this.oscDriver.inbox, this.eeDriver, this.translator.translateOscMessageToGameCommand));
    }

    isInitialized() {
        return !!this.subscription.length;
    }

    destroy() {
        this.subscription.forEach(s => s.unsubscribe());
        this.subscription = [];
    }
}
