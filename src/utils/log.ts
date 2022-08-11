import c from "picocolors";

const currentTime = () => (new Date()).toLocaleTimeString();

export function info (...messages: any[]) {
  console.log(`\n${c.bold(c.inverse(c.blue(" INFO ")))} [${c.gray(currentTime())}]`, ...messages);
}
