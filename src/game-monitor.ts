import {GameCommand, GameQuery} from "./translate";
import { map, mergeMap } from 'rxjs/operators';

import {EEDriver} from "empty-epsilon-js";
import {FileSystem} from "kissfs";
import {Observable} from 'rxjs';
import {OscMessage} from "osc";
import {Subscription} from "rxjs/Subscription";

export const FILE_PATH = 'game-monitor.json';

export function getMonitoredAddresses(fs: FileSystem): Array<string> {

    const result: Array<string> = [];

    function handleFileContent(fileContent: string) {
        try {
            const addresses: Array<string> = JSON.parse(fileContent.toLowerCase());
            result.splice(0, result.length, ...addresses);
        } catch (e) {
            console.error(`failed parsing ${FILE_PATH} : ${fileContent}`);
        }
    }

    fs.events.on('fileChanged', ({newContent, fullPath}) => {
        if (fullPath === FILE_PATH) {
            handleFileContent(newContent);
        }
    });
    fs.loadTextFile(FILE_PATH).then(handleFileContent);

    return result;
}

export function monitorByAddress(pollRequests: Observable<string>, eeDriver: EEDriver, translator: (address: string) => GameQuery): Observable<OscMessage> {
    return pollRequests
        .pipe(map<string, GameQuery>(translator))
        .pipe(mergeMap<GameQuery, Promise<OscMessage>>(
            async (q: GameQuery) => {
                const values = await eeDriver.query<Array<number>>(q.expr, q.type.length);
                return {
                    address: q.address,
                    args: values.map((value: any, i: number) => ({type: q.type.charAt(i) as 'i' | 'f', value}))
                };
            }))
}


export function executeDriverCommands(pushRequests: Observable<OscMessage>, eeDriver: EEDriver, translator: (message: OscMessage) => GameCommand): Subscription {
    return pushRequests
        .pipe(map<OscMessage, GameCommand>(translator))
        .subscribe(gc => eeDriver.command(gc.template, gc.values));
}

