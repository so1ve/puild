import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("output: commonjs", ({ test }) => {
    test("{ type: commonjs, field: main, srcExt: js, distExt: js }", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/index.js",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/index.js", "utf8");
      expect(content).toMatch("module.exports =");

      await fixture.rm();
    });

    test("{ type: module, field: main, srcExt: js, distExt: cjs }", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        type: "module",
        main: "./dist/index.cjs",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/index.cjs", "utf8");
      expect(content).toMatch("module.exports =");

      await fixture.rm();
    });

    test("{ type: commonjs, field: main, srcExt: mjs, distExt: cjs }", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/mjs.cjs",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/mjs.cjs", "utf8");
      expect(content).toMatch("exports.sayHello =");

      await fixture.rm();
    });

    test("nested directory", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/nested/index.js",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/nested/index.js", "utf8");
      expect(content).toMatch("nested entry point");

      await fixture.rm();
    });
  });
});
