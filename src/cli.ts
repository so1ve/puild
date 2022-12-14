import fs from "node:fs";
import { cli } from "cleye";
import { rollup, watch } from "rollup";
import { error, info, log, success, warn } from "kons/consola";

import { version } from "../package.json";
import { readPackageJson } from "./utils/read-package-json";
import { getExportEntries } from "./utils/parse-package-json/get-export-entries";
import { getExternalDependencies } from "./utils/parse-package-json/get-external-dependencies";
import { getAliases } from "./utils/parse-package-json/get-aliases";
import { normalizePath } from "./utils/normalize-path";
import { getSourcePath } from "./utils/get-source-path";
import { getRollupConfigs } from "./utils/get-rollup-configs";
import { tsconfig } from "./utils/tsconfig";
import { getDistFiles } from "./utils/get-dist-files";

const argv = cli({
  name: "puild",

  version,

  flags: {
    src: {
      type: String,
      description: "Source directory",
      default: "./src",
    },
    dist: {
      type: String,
      description: "Distribution directory",
      default: "./dist",
    },
    minify: {
      type: Boolean,
      description: "Minify output",
      alias: "m",
      default: false,
    },
    target: {
      type: [String],
      default: [`node${process.versions.node}`],
      description: "Environments to support. `target` in tsconfig.json is automatically added. Defaults to the current Node.js version.",
      alias: "t",
    },
    watch: {
      type: Boolean,
      description: "Watch mode",
      alias: "w",
      default: false,
    },
    env: {
      type: [function Env (flagValue: string) {
        const [key, value] = flagValue.split("=");
        return { key, value };
      }],
      description: "Compile-time environment variables (eg. --env.NODE_ENV=production)",
    },
    exportCondition: {
      type: [String],
      description: "Export conditions for resolving dependency export and import maps (eg. --export-condition=node)",
    },
  },

  help: {
    description: "Minimalistic package bundler",
    render (nodes, renderers) {
      renderers.flagOperator = flagData => (
        (flagData.name === "env")
          ? ".key="
          : " "
      );

      return renderers.render(nodes);
    },
  },
});

const cwd = process.cwd();
const { stringify } = JSON;

/**
 * The sourcepath may be a symlink.
 * In the tests, the temp directory is a symlink:
 * /var/folders/hl/ -> /private/var/folders/hl/
 */
const sourcePath = normalizePath(argv.flags.src, true);
const distPath = normalizePath(argv.flags.dist, true);

const tsconfigTarget = tsconfig?.config.compilerOptions?.target;
if (tsconfigTarget) {
  argv.flags.target.push(tsconfigTarget);
}

(async () => {
  const packageJson = await readPackageJson(cwd);

  let exportEntries = getExportEntries(packageJson);

  exportEntries = exportEntries.filter((entry) => {
    const validPath = entry.outputPath.startsWith(distPath);

    if (!validPath) {
      warn(`Ignoring entry outside of ${distPath} directory: package.json#${entry.from}=${stringify(entry.outputPath)}`);
    }

    return validPath;
  });

  if (exportEntries.length === 0) {
    throw new Error("No export entries found in package.json");
  }

  const sourcePaths = await Promise.all(exportEntries.map(async exportEntry => ({
    input: await getSourcePath(exportEntry, sourcePath, distPath),
    exportEntry,
  })));

  const aliases = getAliases(packageJson, cwd);
  const externalDependencies = getExternalDependencies(packageJson).filter(
    dependency => !(dependency in aliases),
  ).flatMap(dependency => [
    dependency,
    new RegExp(`^${dependency}/`),
  ]);

  const rollupConfigs = await getRollupConfigs(
    /**
     * Resolve symlink in source path.
     *
     * Tests since symlinks because tmpdir is a symlink:
     * /var/ -> /private/var/
     */
    normalizePath(fs.realpathSync.native(sourcePath), true),
    distPath,
    sourcePaths,
    argv.flags,
    aliases,
    externalDependencies,
  );

  if (argv.flags.watch) {
    info("Watch initialized");

    Object.values(rollupConfigs).map(async (rollupConfig) => {
      const watcher = watch(rollupConfig);

      watcher.on("event", async (event) => {
        if (event.code === "BUNDLE_START") {
          info("Building", ...(Array.isArray(event.input) ? event.input : [event.input]));
        }

        if (event.code === "BUNDLE_END") {
          await Promise.all(rollupConfig.output.map(
            outputOption => event.result.write(outputOption),
          ));

          info("Built!", ...(Array.isArray(event.input) ? event.input : [event.input]));
        }

        if (event.code === "ERROR") {
          info("Error: ", event.error.message);
        }
      });
    });
  } else {
    const isMinify = argv.flags.minify ? "and Minifying " : "";
    info(`Building ${isMinify}${packageJson.name || "[Package]"}...`);
    const outputs = await Promise.all(
      Object.values(rollupConfigs).map(async (rollupConfig) => {
        const bundle = await rollup(rollupConfig);
        return Promise.all(rollupConfig.output.map(
          outputOption => bundle.write(outputOption),
        ));
      }),
    );
    const distFiles = getDistFiles(distPath, outputs);
    for (const distFile of distFiles) {
      log(`Output: ${distFile}`);
    }
    success("Build succeeded");
  }
})().catch((e) => {
  error(e);
  process.exit(1);
});
