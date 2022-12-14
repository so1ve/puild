import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("dependencies", ({ test }) => {
    test("externalize dependencies", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/dependency-external.js",
        dependencies: {
          "@org/name": "*",
        },
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/dependency-external.js", "utf8");
      expect(content).toMatch("require('@org/name/path')");

      await fixture.rm();
    });

    test("dual package - require", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/dependency-exports-require.js",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/dependency-exports-require.js", "utf8");
      expect(content).toMatch("cjs");

      await fixture.rm();
    });

    test("dual package - import", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/dependency-exports-import.js",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/dependency-exports-import.js", "utf8");
      expect(content).toMatch("esm");

      await fixture.rm();
    });

    test("imports map - default", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/dependency-imports-map.js",
      });

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/dependency-imports-map.js", "utf8");
      expect(content).toMatch("default");

      await fixture.rm();
    });

    test("imports map - node", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/dependency-imports-map.js",
      });

      const puildProcess = await puild(["--export-condition=node"], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/dependency-imports-map.js", "utf8");
      expect(content).toMatch("node");

      await fixture.rm();
    });
  });
});
