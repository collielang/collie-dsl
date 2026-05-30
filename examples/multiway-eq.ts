function main() {
    let score: number = 85;
    let grade: string = (() => {
  const _v = score;
  if (_v === 90) return "A";
  if (_v === 80) return "B";
  if (_v === 70) return "C";
  if (_v === 60) return "D";
  return "F";
})();
    console.log("score: " + String(score) + " -> grade: " + grade);
    let day: number = 6;
    let type: string = (() => {
  const _v = day;
  if (_v === 1 || _v === 2 || _v === 3 || _v === 4 || _v === 5) return "工作日";
  if (_v === 0 || _v === 6) return "周末";
  return "未知";
})();
    console.log("day " + String(day) + " -> " + type);
    let flag: boolean = false;
    let val: number = (() => {
  const _v = flag;
  if (_v === true) return 1;
  return 2;
})();
    console.log("flag=" + String(Boolean(flag)) + " -> val=" + String(val));
    let num: number = 3;
    let result: string = (() => {
  const _v = num;
  if (_v === 1) return "一";
  if (_v === 2) return "二";
  if (_v === 3) return "三";
  return "其它";
})();
    console.log("num=" + String(num) + " -> " + result);
    let threshold: number = 50;
    let value: number = 75;
    let range: string = (() => {
  const _v = value;
  if (_v === threshold) return "刚好在阈值";
  return "不在阈值";
})();
    console.log("value=" + String(value) + " -> " + range);
    let magic: number = 42;
    let msg: string = "答案是 " + ((() => {
  const _v = magic;
  if (_v === 42) return "生命的意义";
  if (_v === 7) return "幸运数字";
  return "不知道";
})());
    console.log(msg);
}
main();