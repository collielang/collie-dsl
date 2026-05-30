import { Decimal } from './decimal';

function main() {
    let bigInt: bigint = BigInt("9007199254740993");
    let num: number = Number("42");
    let price: Decimal = new Decimal("19.99");
    let str: string = String(42);
    let piStr: string = String(3.14159);
    let truthy: boolean = Boolean(1);
    let falsy: boolean = Boolean(0);
    console.log("integer: " + String(bigInt));
    console.log("number: " + String(num));
    console.log("decimal: " + String(price));
    console.log("str: " + str);
    console.log("bool(1): " + String(Boolean(truthy)));
    console.log("bool(0): " + String(Boolean(falsy)));
}