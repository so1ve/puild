import fs from "node:fs/promises";
import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("bin", ({ test }) => {
    (async () => {
      const fixture = await createFixture("./tests/fixture-package");
      await fixture.writeJson("package.json", {
        bin: "./dist/index.mjs",
        exports: "./dist/index.mjs",
      });

      await test("supports single path", async () => {
        const puildProcess = await puild([], { cwd: fixture.path, nodePath });

        expect(puildProcess.exitCode).toBe(0);
        expect(puildProcess.stderr).toBe("");
      });

      if (process.platform !== "win32") {
        await test("is executable", async () => {
          const content = await fixture.readFile("dist/index.mjs", "utf8");
          expect(content).toMatch("#!/usr/bin/env node");

          const stats = await fs.stat(`${fixture.path}/dist/index.mjs`);
          const unixFilePermissions = `0${(stats.mode & 0o777).toString(8)}`; // eslint-disable-line no-bitwise

          expect(unixFilePermissions).toBe("0755");
        });
      }

      await fixture.rm();
    })();

    test("supports object", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        bin: {
          a: "./dist/index.mjs",
          b: "./dist/index.js",
        },
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      expect(await fixture.exists("dist/index.mjs")).toBe(true);
      expect(await fixture.exists("dist/index.js")).toBe(true);

      await fixture.rm();
    });
  });
});
