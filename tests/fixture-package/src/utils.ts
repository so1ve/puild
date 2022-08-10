export { writeFileSync } from "node:fs";
export { readFileSync } from "node:fs";

export function sayHello (name: string) {
  return `Hello ${name}!`;
}
