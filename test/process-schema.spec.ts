import {expect} from 'chai';
import {processApiSchema} from "../src/process-schema";
import {GameSchema} from "../src/ee-schema";

describe('processApiSchema', () => {
    it('works on simple input', () => {
        const input: GameSchema = {
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
                "$inherits": "ShipTemplateBasedObject"
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
            }
        };
        const output = processApiSchema(input) as any;
        for (let k in input) {
            expect(output[k], 'output.' + k).to.be.ok;
        }
        expect(output.global['player-ship'].get.type, 'output.global.getPlayerShip.type').to.equal(output.PlayerSpaceship);
        expect(output.global['player-ship'].get.methodName, 'output.global.getPlayerShip.methodName').to.equal("getPlayerShip");
        expect(output.PlayerSpaceship.hull, 'output.PlayerSpaceship.hull').to.equal(output.ShipTemplateBasedObject.hull);

        expect(output.PlayerSpaceship.hull.get, 'output.PlayerSpaceship.hull.get').to.be.ok;
        expect(output.PlayerSpaceship.hull.get.type, 'output.PlayerSpaceship.hull.get.type').to.eql(['float']);
        expect(output.PlayerSpaceship.hull.get.methodName, 'output.PlayerSpaceship.hull.get.methodName').to.equal("getHull");


        expect(output.PlayerSpaceship.hull.set, 'output.PlayerSpaceship.hull.set').to.be.ok;
        expect(output.PlayerSpaceship.hull.set.arguments, 'output.PlayerSpaceship.hull.set.arguments').to.eql(["float"]);
        expect(output.PlayerSpaceship.hull.set.methodName, 'output.PlayerSpaceship.hull.set.methodName').to.equal("setHull");

    });
});
