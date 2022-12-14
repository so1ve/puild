import path from "node:path";
import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { installTypeScript, puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("types", ({ test }) => {
    test("emits", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await installTypeScript(fixture.path);

      await fixture.writeJson("package.json", {
        types: "./dist/utils.d.ts",
      });
      await fixture.writeJson("tsconfig.json", {
        compilerOptions: {
          typeRoots: [
            path.resolve("node_modules/@types"),
          ],
        },
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/utils.d.ts", "utf8");
      expect(content).toMatch("declare function");

      await fixture.rm();
    });

    test("emits multiple", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      installTypeScript(fixture.path);

      await fixture.writeJson("package.json", {
        exports: {
          "./utils": {
            types: "./dist/utils.d.ts",
          },
          "./nested": {
            types: "./dist/nested/index.d.ts",
          },
        },
      });

      await fixture.writeJson("tsconfig.json", {
        compilerOptions: {
          typeRoots: [
            path.resolve("node_modules/@types"),
          ],
        },
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const utilsDts = await fixture.readFile("dist/utils.d.ts", "utf8");
      expect(utilsDts).toMatch("declare function");

      const nestedDts = await fixture.readFile("dist/nested/index.d.ts", "utf8");
      expect(nestedDts).toMatch("declare function sayHello");

      await fixture.rm();
    });

    test("emits multiple - same name", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      installTypeScript(fixture.path);

      await fixture.writeJson("package.json", {
        exports: {
          "./a": {
            types: "./dist/utils.d.ts",
          },
          "./b": {
            types: "./dist/nested/utils.d.ts",
          },
        },
      });

      await fixture.writeJson("tsconfig.json", {
        compilerOptions: {
          typeRoots: [
            path.resolve("node_modules/@types"),
          ],
        },
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const utilsDts = await fixture.readFile("dist/utils.d.ts", "utf8");
      expect(utilsDts).toMatch("declare function sayHello");

      const nestedDts = await fixture.readFile("dist/nested/utils.d.ts", "utf8");
      expect(nestedDts).toMatch("declare function sayGoodbye");

      await fixture.rm();
    });
  });
});
