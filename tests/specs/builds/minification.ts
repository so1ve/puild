import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("minification", ({ test }) => {
    test("minification", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/target.js",
      });

      const puildProcess = await puild(["--minify", "--target", "esnext"], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/target.js", "utf8");
      expect(content).toMatch("e?.y()");

      // Name should be minified
      expect(content).not.toMatch("exports.foo=foo");

      await fixture.rm();
    });
  });
});
