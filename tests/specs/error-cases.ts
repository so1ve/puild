import { expect, testSuite } from "manten";
import { createFixture } from "fs-fixture";
import { puild } from "../utils";

export default testSuite(({ describe }, nodePath: string) => {
  describe("Error handling", ({ test }) => {
    test("no package.json", async () => {
      const fixture = await createFixture("./tests/fixture-package");
      const puildProcess = await puild(
        [],
        {
          cwd: fixture.path,
          nodePath,
          reject: false,
        },
      );

      expect(puildProcess.exitCode).toBe(1);
      expect(puildProcess.stderr).toMatch("package.json not found");

      await fixture.rm();
    });

    test("invalid package.json", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeFile("package.json", "{ name: pkg }");
      const puildProcess = await puild(
        [],
        {
          cwd: fixture.path,
          nodePath,
          reject: false,
        },
      );

      expect(puildProcess.exitCode).toBe(1);
      expect(puildProcess.stderr).toMatch("Cannot parse package.json");

      await fixture.rm();
    });

    test("no entry in package.json", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        name: "pkg",
      });

      const puildProcess = await puild(
        [],
        {
          cwd: fixture.path,
          nodePath,
          reject: false,
        },
      );

      expect(puildProcess.exitCode).toBe(1);
      expect(puildProcess.stderr).toMatch("No export entries found in package.json");

      await fixture.rm();
    });

    test("conflicting entry in package.json", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        name: "pkg",
        main: "dist/index.js",
        module: "dist/index.js",
      });

      const puildProcess = await puild(
        [],
        {
          cwd: fixture.path,
          nodePath,
          reject: false,
        },
      );

      expect(puildProcess.exitCode).toBe(1);
      expect(puildProcess.stderr).toMatch("Error: Conflicting export types \"commonjs\" & \"module\" found for ./dist/index.js");

      await fixture.rm();
    });

    test("ignore and warn on path entry outside of dist directory", async () => {
      const fixture = await createFixture("./tests/fixture-package");

      await fixture.writeJson("package.json", {
        name: "pkg",
        main: "/dist/main.js",
      });

      const puildProcess = await puild(
        [],
        {
          cwd: fixture.path,
          nodePath,
          reject: false,
        },
      );

      expect(puildProcess.exitCode).toBe(1);
      expect(puildProcess.stderr).toMatch("Ignoring entry outside of ./dist/ directory: package.json#main=\"/dist/main.js\"");
      expect(puildProcess.stderr).toMatch("No export entries found in package.json");

      await fixture.rm();
    });
  });
});
