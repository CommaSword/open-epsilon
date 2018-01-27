import {expect} from 'chai';
import {translateAddressToGameQuery, translateOscMessageToGameCommand} from "../src/translate";
import {processApiSchema} from "../src/process-schema";

const apiModel = processApiSchema({
    "global": {
        "getPlayerShip": {
            "arguments": ["integer"],
            "type": ["PlayerSpaceship"]
        }
    },
    "PlayerSpaceship": {
        "$inherits": "SpaceShip"
    },
    "SpaceShip": {
        "$inherits": "ShipTemplateBasedObject",
        "getSystemHealth": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemHealth": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
    },
    "ShipTemplateBasedObject": {
        "getHull": {
            "arguments": [],
            "type": ["float"]
        },
        "setHull": {
            "arguments": ["float"],
            "type": []
        },
        "getPosition": {
            "arguments": [],
            "type": ["float", "float"]
        },
        "setPosition": {
            "arguments": ["float", "float"],
            "type": []
        },
    }
});
describe('translateAddressToGameQuery', () => {

    it('meaningless address throws', () => {
        expect(() => translateAddressToGameQuery(apiModel, '/foo/bar')).to.throw(Error);
    });

    it('incomplete expression throws', () => {
        expect(() => translateAddressToGameQuery(apiModel,'/ee/player-ship')).to.throw(Error);
    });

    it('expression that does not resolve to primitive throws', () => {
        expect(() => translateAddressToGameQuery(apiModel, '/ee/player-ship/-1')).to.throw(Error);
    });

    it('basic : ee/playership/-1/hull', () => {
        const q = translateAddressToGameQuery(apiModel, '/ee/player-ship/-1/hull');
        expect(q).to.eql({
            "address": "/ee/player-ship/-1/hull",
            "expr": "getPlayerShip(-1):getHull()",
            "type": "f"
        });
    });

    it('multiple returns : ee/playership/-1/position', () => {
        const q = translateAddressToGameQuery(apiModel, '/ee/player-ship/-1/position');
        expect(q).to.eql({
            "address": "/ee/player-ship/-1/position",
            "expr": "getPlayerShip(-1):getPosition()",
            "type": "ff"
        });
    });
});

describe('translateOscMessageToGameCommand', () => {

    it('meaningless address throws', () => {
        expect(() => translateOscMessageToGameCommand(apiModel, {address: '/foo/bar', args: []})).to.throw(Error);
    });

    it('incomplete expression throws', () => {
        expect(() => translateOscMessageToGameCommand(apiModel, {address: '/ee/player-ship', args: []})).to.throw(Error);
    });

    it('expression that does not resolve to primitive throws', () => {
        expect(() => translateOscMessageToGameCommand(apiModel, {address: '/ee/player-ship/-1', args: []})).to.throw(Error);
    });

    it('basic : ee/playership/-1/hull', () => {
        const q = translateOscMessageToGameCommand(apiModel, {address: '/ee/player-ship/-1/hull', args: [0.5]});
        expect(q).to.eql({
            "template": "getPlayerShip(-1):setHull({0})",
            "values": ["0.50"]
        });
    });

    it('with a method argument in the address (set it as part of the template, not a variable)', () => {
        const q = translateOscMessageToGameCommand(apiModel, {address: '/ee/player-ship/-1/system-health/reactor', args: [0.5]});
        expect(q).to.eql({
            "template": 'getPlayerShip(-1):setSystemHealth("Reactor", {0})',
            "values": ["0.50"]
        });
    });

});
