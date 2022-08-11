function getLocalTypescriptPath () {
  const cwd = process.cwd();
  try {
    return require.resolve("typescript", {
      paths: [cwd],
    });
  } catch {
    throw new Error(`Could not find \`typescript\` in ${cwd}`);
  }
}

export default require(getLocalTypescriptPath());
