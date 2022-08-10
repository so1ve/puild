import path from "node:path";
import fs from "node:fs/promises";
import { type NodeOptions, execaNode } from "execa";

const puildBinPath = path.resolve("./dist/cli.js");

type Options = NodeOptions<string>;

export const puild = async (
  cliArguments: string[],
  options: Options,
) => await execaNode(
  puildBinPath,
  cliArguments,
  {
    ...options,
    nodeOptions: [],
  },
);

export const installTypeScript = (fixturePath: string) => fs.symlink(
  path.resolve("node_modules/typescript"),
  path.join(fixturePath, "node_modules/typescript"),
  "dir",
);
