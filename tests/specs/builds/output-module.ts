import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("output: module", ({ test }) => {
    test("{ type: module, field: main, srcExt: js, distExt: js }", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        type: "module",
        main: "./dist/index.js",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/index.js", "utf8");
      expect(content).toMatch("export { index as default }");

      await fixture.rm();
    });

    test("{ type: commonjs, field: main, srcExt: js, distExt: mjs }", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/index.mjs",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/index.mjs", "utf8");
      expect(content).toMatch("export { index as default }");

      await fixture.rm();
    });

    test("{ type: commonjs, field: module, srcExt: js, distExt: js }", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        module: "./dist/index.js",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/index.js", "utf8");
      expect(content).toMatch("export { index as default }");

      await fixture.rm();
    });

    test("{ type: commonjs, field: main, srcExt: cjs, distExt: mjs }", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/cjs.mjs",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/cjs.mjs", "utf8");
      expect(content).toMatch("export { cjs as default }");

      await fixture.rm();
    });

    test("require() works in esm", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/require.js",
        module: "./dist/require.mjs",
      });

      const puildProcess = await puild(["--minify"], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const js = await fixture.readFile("dist/require.js", "utf8");
      expect(js).not.toMatch("createRequire");

      const mjs = await fixture.readFile("dist/require.mjs", "utf8");
      expect(mjs).toMatch("createRequire");

      await fixture.rm();
    });

    test("conditional require() no side-effects", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/conditional-require.mjs",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/conditional-require.mjs", "utf8");
      expect(content).toMatch("\tconsole.log('side effect');");

      await fixture.rm();
    });

    test("require() & createRequire gets completely removed on conditional", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/conditional-require.mjs",
      });

      const puildProcess = await puild(["--env.NODE_ENV=development", "--minify"], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/conditional-require.mjs", "utf8");
      expect(content).not.toMatch("\tconsole.log('side effect');");

      const [, createRequireMangledVariable] = content.toString().match(/createRequire as (\w+)/)!;
      expect(content).not.toMatch(`${createRequireMangledVariable}(`);

      await fixture.rm();
    });
  });
});
