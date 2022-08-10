import path from "node:path";
import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { installTypeScript, puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("target", ({ describe, test }) => {
    test("transformation", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/target.js",
      });

      const puildProcess = await puild(["--target", "es2015"], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/target.js", "utf8");
      expect(content).toMatch("Math.pow");

      await fixture.rm();
    });

    describe("node protocol", () => {
      test("strips node protocol", async () => {
        const fixture = await createFixture("./tests/fixture-package");

        await installTypeScript(fixture.path);

        await fixture.writeJson("package.json", {
          main: "./dist/utils.js",
          module: "./dist/utils.mjs",
          types: "./dist/utils.d.ts",
        });
        await fixture.writeJson("tsconfig.json", {
          compilerOptions: {
            jsx: "react",
            typeRoots: [
              path.resolve("node_modules/@types"),
            ],
          },
        });

        const puildProcess = await puild(["--target", "node12.19"], { cwd: fixture.path, nodePath });

        expect(puildProcess.exitCode).toBe(0);
        expect(puildProcess.stderr).toBe("");

        expect(await fixture.readFile("dist/utils.js", "utf8")).not.toMatch("node:");
        expect(await fixture.readFile("dist/utils.mjs", "utf8")).not.toMatch("node:");

        const content = await fixture.readFile("dist/utils.d.ts", "utf8");
        expect(content).toMatch("declare function");
        expect(content).not.toMatch("node:");

        await fixture.rm();
      });

      test("keeps node protocol", async () => {
        const fixture = await createFixture("./tests/fixture-package");

        installTypeScript(fixture.path);

        await fixture.writeJson("package.json", {
          main: "./dist/utils.js",
          module: "./dist/utils.mjs",
          types: "./dist/utils.d.ts",
        });
        await fixture.writeJson("tsconfig.json", {
          compilerOptions: {
            jsx: "react",
            typeRoots: [
              path.resolve("node_modules/@types"),
            ],
          },
        });

        const puildProcess = await puild(["--target", "node14.18"], { cwd: fixture.path, nodePath });

        expect(puildProcess.exitCode).toBe(0);
        expect(puildProcess.stderr).toBe("");

        expect(await fixture.readFile("dist/utils.js", "utf8")).toMatch("'node:fs'");
        expect(await fixture.readFile("dist/utils.mjs", "utf8")).toMatch("'node:fs'");

        const content = await fixture.readFile("dist/utils.d.ts", "utf8");
        expect(content).toMatch("'fs'");
        expect(content).toMatch("'node:fs'");

        await fixture.rm();
      });
    });
  });
});
