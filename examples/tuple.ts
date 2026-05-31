let alice: object = { name: "Alice", age: 18 };
let bob: object = { name: "Bob", age: 25 };
function main() {
    console.log("alice.name = " + String(alice.name));
    console.log("alice.age = " + String(alice.age));
    console.log("bob.name = " + String(bob.name));
    console.log("bob.age = " + String(bob.age));
    let totalAge: number = alice.age + bob.age;
    console.log("total age = " + String(totalAge));
}
main();