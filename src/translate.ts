import {ProcessedResource, ProcessedSchema, ProcessedType} from "./process-schema";
import {OscMessage} from "osc";
import {EMissileWeapons, ESystem} from "empty-epsilon-js";
import {EnumType, isPrimitiveOrArrayOfPrimitiveType, PrimitiveType} from "./ee-schema";
import naming = require('naming');

export interface GameQuery {
    address: string;
    expr: string;
    type: string;
}

export interface GameCommand {
    template: string;
    values: Array<string>;
}


function translatePrimitiveType(pt: PrimitiveType): 'f' | 'i' {
    return pt.charAt(0) as any;
}

function translateType(pt: PrimitiveType | Array<PrimitiveType>): string {
    return pt instanceof Array ? pt.map(translatePrimitiveType).join('') : translatePrimitiveType(pt);
}

function enumAddresItemToArgument(addressItem: string, enumObj: any, enumName: string) {
    const name = naming(addressItem, 'pascal');
    if (typeof enumObj[name] === 'undefined') {
        throw new Error(`bad ${enumName} name ${name}`);
    }
    return '"' + name + '"';
}

function addressItemToArgument(addressItem: string, argumentSchema: PrimitiveType | EnumType): string {
    switch (argumentSchema) {
        case "float" :
            return Number.parseFloat(addressItem).toFixed(2);
        case "integer" :
        case "bool" :
            return addressItem;
        case "ESystem":
            return enumAddresItemToArgument(addressItem, ESystem, "ESystem");
        case "EMissileWeapons":
            return enumAddresItemToArgument(addressItem, EMissileWeapons, "EMissileWeapons");
        default:
            throw new Error(`unknown type: ${argumentSchema}`);
    }
}

function addressArrToArguments(addressParts: Array<string>, argumentsSchema: Array<PrimitiveType | EnumType>) {
    return argumentsSchema.map((t, i) => addressItemToArgument(addressParts[i], t))
}

export class MessageTranslator {
    translateOscMessageToGameCommand = (message: OscMessage): GameCommand => {
        const addressArr = message.address.split('/');
        const oscArgs: Array<any> = message.args instanceof Array ? message.args : [message.args];
        const vals = addressArr.concat(oscArgs.map<string>(arg => '' + (arg.value == undefined ? arg : arg.value)));
        //  console.info(`handling command: ${vals.join('/')}`);

        this.assertNamespaceAddress(addressArr);

        let addrIdx = 2;
        let path: string[] = [];
        let currentType: ProcessedType = this.apiModel.global;

        while (addrIdx < addressArr.length) {
            if (isPrimitiveOrArrayOfPrimitiveType(currentType)) {
                throw new Error(`reached a primitive result ${currentType} before address is finished ${message.address}`);
            } else {
                const symbolName = addressArr[addrIdx++];
                const symbol: ProcessedResource = currentType[symbolName];
                if (symbol) {
                    // the +1 makes us not use getters that exhaust the entire address. the last part needs to be a setter.
                    if (symbol && symbol.get && addrIdx < addressArr.length - symbol.get.arguments.length) {
                        currentType = symbol.get.type;
                        const lastArdIdx = addrIdx + symbol.get.arguments.length;
                        path.push(`${symbol.get.methodName}(${addressArrToArguments(addressArr.slice(addrIdx, lastArdIdx), symbol.get.arguments).join(',')})`);
                        addrIdx = lastArdIdx;
                    } else if (symbol && symbol.set && addrIdx <= vals.length - symbol.set.arguments.length) { // last one is a setter, its arguments are taken from the vals array
                        const lastArdIdx = addrIdx + symbol.set.arguments.length;
                        path.push(symbol.set.methodName);
                        const setter = path.join(':');
                        const values = addressArrToArguments(vals.slice(addrIdx, lastArdIdx), symbol.set.arguments);
                        const numOfStaticValues = addressArr.length - addrIdx;
                        return {
                            template: `${setter}(${values.map((v, idx) => idx >= numOfStaticValues ? `{${idx - numOfStaticValues}}` : v).join(', ')})`,
                            values: values.slice(numOfStaticValues)
                        }
                    } else {
                        throw new Error(`reached a symbol with no matching methods '${symbolName}' in ${vals}`);
                    }
                } else {
                    throw new Error(`reached an unknown symbol '${symbolName}' in ${message.address}`);
                }
            }
        }
        throw new Error(`reached a non-primitive result ${currentType} but address is finished ${message.address}`);
    }
    translateAddressToGameQuery = (address: string): GameQuery => {
        const addressArr = address.split('/');

        this.assertNamespaceAddress(addressArr);

        let addrIdx = 2;
        let path: string[] = [];
        let currentType: ProcessedType = this.apiModel.global;

        while (addrIdx < addressArr.length) {
            if (isPrimitiveOrArrayOfPrimitiveType(currentType)) {
                throw new Error(`reached a primitive result ${currentType} before address is finished ${address}`);
            } else {
                const symbolName = addressArr[addrIdx++];
                const symbol: ProcessedResource = currentType[symbolName];
                if (symbol && symbol.get && addrIdx <= addressArr.length - symbol.get.arguments.length) {
                    currentType = symbol.get.type;
                    const lastArdIdx = addrIdx + symbol.get.arguments.length;
                    path.push(`${symbol.get.methodName}(${addressArrToArguments(addressArr.slice(addrIdx, lastArdIdx), symbol.get.arguments).join(',')})`);
                    addrIdx = lastArdIdx;
                } else {
                    throw new Error(`reached an unknown symbol '${symbolName}' in ${address}`);
                }
            }
        }
        if (isPrimitiveOrArrayOfPrimitiveType(currentType)) {
            return {
                address: address,
                expr: path.join(':'),
                type: translateType(currentType)
            }
        } else {
            throw new Error(`reached a non-primitive result ${currentType} but address is finished ${address}`);
        }
    }

    constructor(private apiModel: ProcessedSchema, private namespace: string) {
        if (~namespace.indexOf('/')) {
            throw new Error(`namespace '${namespace}' contains address delimiter '/'`);
        }
    }

    private assertNamespaceAddress(addressArr: Array<string>) {
        // assert address begins with namespace
        if (addressArr[0] !== '' || addressArr[1] !== this.namespace) {
            throw new Error(`ilegal address prefix ${ addressArr.join('/')}`);
        }
    }

}
