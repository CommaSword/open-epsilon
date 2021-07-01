export type PrimitiveType = 'float' | 'integer' | 'bool';

export type EnumType = "ESystem" | "EMissileWeapons";

export interface GameSchema {
    [k: string]: GameContext<this>;
}

export type GameContextName<S extends GameSchema> = keyof S & string;

export type GameValueType<S extends GameSchema> = [GameContextName<S>] | Array<PrimitiveType>;

export type GameMethod<S extends GameSchema> = {
    arguments: Array<PrimitiveType | EnumType>,
    type: GameValueType<S>
};

export type GameContext<S extends GameSchema> = {
    [k: string]: GameContextName<S> | GameMethod<S>;
}

export function isPrimitiveType(t: any): t is PrimitiveType {
    return t === 'float' || t === 'integer';
}

export function isPrimitiveOrArrayOfPrimitiveType(t: any): t is (PrimitiveType | Array<PrimitiveType>) {
    return t instanceof Array ? t.every(t1 => isPrimitiveType(t1)) : isPrimitiveType(t);
}

export function isGameMethod(t: any): t is GameMethod<any> {
    return typeof t === 'object' && t && t.arguments !== undefined && typeof t.type !== 'undefined';
}


export const emptyEpsilonSchema = {
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
        "getSystemHeat": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemHeat": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
        "getSystemPower": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemPower": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
        "getSystemCoolant": {
            "arguments": ["ESystem"],
            "type": ["float"]
        },
        "setSystemCoolant": {
            "arguments": ["ESystem", "float"],
            "type": []
        },
        "setCombatManeuver": {
            "arguments": ["float"/* boost */, "float" /* strafe */],
            "type": []
        },
        "getWeaponStorage": {
            "arguments": ["EMissileWeapons"],
            "type": ["integer"]
        },
        "setWeaponStorage": {
            "arguments": ["EMissileWeapons", "integer"],
            "type": []
        }, "getWeaponStorageMax": {
            "arguments": ["EMissileWeapons"],
            "type": ["integer"]
        },
        "setWeaponStorageMax": {
            "arguments": ["EMissileWeapons", "integer"],
            "type": []
        },
        "getEnergy": {
            "arguments": [],
            "type": ["float"]
        },
        "setEnergy": {
            "arguments": ["float"],
            "type": []
        },
        "getMaxEnergy": {
            "arguments": [],
            "type": ["float"]
        },
        "setMaxEnergy": {
            "arguments": ["float"],
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
        "getHullMax": {
            "arguments": [],
            "type": ["float"]
        },
        "setHullMax": {
            "arguments": ["float"],
            "type": []
        },
        "getRotation": {
            "arguments": [],
            "type": ["float"]
        },
        "setRotation": {
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
        "getCanBeDestroyed": {
            "arguments": [],
            "type": ["bool"]
        },
        "setCanBeDestroyed": {
            "arguments": ["bool"],
            "type": []
        },
    }
} as GameSchema;
