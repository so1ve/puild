import path from "node:path";
import fs from "node:fs/promises";
import { type NodeOptions, execaNode } from "execa";

const pkgrollBinPath = path.resolve("./dist/cli.js");

type Options = NodeOptions<string>;

export const pkgroll = async (
  cliArguments: string[],
  options: Options,
) => await execaNode(
  pkgrollBinPath,
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
