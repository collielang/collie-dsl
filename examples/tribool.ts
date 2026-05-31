let active: boolean | undefined = true;
let pending: boolean | undefined = false;
let unknown: boolean | undefined = undefined;
function main() {
    console.log("active = " + String(Boolean(active)));
    console.log("pending = " + String(Boolean(pending)));
    console.log("unknown is unset");
}
main();