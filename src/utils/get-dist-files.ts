import path from "node:path";
import type { RollupOutput } from "rollup";

export function getDistFiles (distPath: string, rollupOutputs: RollupOutput[][]) {
  const fileNames = rollupOutputs.flat()
    .map(o => o.output.map(f => f.fileName))
    .flat();
  const distFiles = fileNames.map(f => path.join(distPath, f));
  return distFiles;
}
