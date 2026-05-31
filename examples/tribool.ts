let active: boolean | 'unset' = true;
let pending: boolean | 'unset' = false;
let unknown: boolean | 'unset' = 'unset';
function check(value: boolean | 'unset') {
    if (value === 'unset') {
        console.log("  state: unset");
    } else if (value) {
        console.log("  state: true");
    } else {
        console.log("  state: false");
    }
}
function main() {
    console.log("active:");
    check(active);
    console.log("pending:");
    check(pending);
    console.log("unknown:");
    check(unknown);
}
main();