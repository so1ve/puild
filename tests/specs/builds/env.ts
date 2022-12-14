import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("env", ({ test }) => {
    test("dead code elimination via env", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/conditional-require.js",
      });

      const puildProcess = await puild(["--env.NODE_ENV=development"], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/conditional-require.js", "utf8");
      expect(content).toMatch("development");
      expect(content).not.toMatch("2 ** 3");

      await fixture.rm();
    });
  });
});
