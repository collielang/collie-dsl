enum Season {
    Spring,
    Summer,
    Autumn,
    Winter
}
enum StatusCode {
    OK = 200,
    NotFound = 404,
    ServerError = 500
}
function main() {
    let spring: number = 0;
    let ok: number = 200;
    console.log("Spring = " + String(spring));
    console.log("OK Status = " + String(ok));
}
main();