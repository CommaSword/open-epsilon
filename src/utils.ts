export function merge<T1 extends Object | Array<any>, T2 extends Object | Array<any>>(json1: T1, json2: T2): T1 & T2 {
    let result: any = json2;
    if (json2 && typeof json2 === 'object' && !Array.isArray(json2)) {
        result = {};
        if (json1 && typeof json1 === 'object' && !Array.isArray(json1)) {
            for (let key in json1) {
                result [key] = json1 [key];
            }
        }
        for (let key in json2) {
            if (typeof result[key] === "object" && typeof json2 === "object") {
                result [key] = merge(result [key], json2 [key]);
            } else {
                result [key] = json2 [key];
            }
        }
    } else if (Array.isArray(json1) && Array.isArray(json2)) {
        result = json1;
        for (let i = 0; i < json2.length; i++) {
            if (result.indexOf(json2 [i]) === -1) {
                result [result.length] = json2 [i];
            }
        }
    }
    return result;
}
