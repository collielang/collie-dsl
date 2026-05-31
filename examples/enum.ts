const Season = {
    Spring: 0,
    Summer: 1,
    Autumn: 2,
    Winter: 3
} as const;
type Season = (typeof Season)[keyof typeof Season];
const StatusCode = {
    OK: 200,
    NotFound: 404,
    ServerError: 500
} as const;
type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];
function main() {
    console.log("Spring = " + String(Season.Spring));
    console.log("Summer = " + String(Season.Summer));
    console.log("OK Status = " + String(StatusCode.OK));
    console.log("Not Found = " + String(StatusCode.NotFound));
}
main();