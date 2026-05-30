import { Decimal } from './decimal';

function main() {
    let x: number = 42;
    let pi: number = 3.14159;
    let big: bigint = 9007199254740993;
    let price: Decimal = new Decimal("19.99");
    let name: string = "Collie";
    let initial: string = "C";
    let flag: boolean = true;
    let done: boolean = false;
    let inferred = x + 10;
    let message = "Hello, " + name;
    let condition = x > 0 && flag;
    console.log("x = " + String(x));
    console.log("name = " + name);
    console.log("flag = " + String(Boolean(flag)));
    console.log("inferred = " + String(inferred));
}
main();