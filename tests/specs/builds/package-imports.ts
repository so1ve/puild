import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("package imports", ({ test }) => {
    test("imports", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        main: "./dist/entry.js",
        imports: {
          "~": "./src/nested",
        },
      });
      await fixture.writeFile("src/entry.ts", `
        import { sayGoodbye } from '~/utils';
        console.log(sayGoodbye);
      `);

      const puildProcess = await puild([], { cwd: fixture.path, nodePath });

      expect(puildProcess.exitCode).toBe(0);
      expect(puildProcess.stderr).toBe("");

      const content = await fixture.readFile("dist/entry.js", "utf8");

      expect(content).toMatch("sayGoodbye");

      await fixture.rm();
    });
  });
});
