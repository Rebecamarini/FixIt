module.exports = {
  forbidden: [
    {
      name: "no-runtime-cycles",
      severity: "error",
      from: { path: "^src/" },
      to: {
        path: "^src/",
        circular: true,
        viaOnly: { dependencyTypesNot: ["type-only"] },
      },
    },
    {
      name: "no-unresolved-imports",
      severity: "error",
      from: { path: "^src/" },
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: "^(?!src/)" },
    exclude: "\\.d\\.(ts|mts|cts)$|/(generated|__generated__)/",
    tsPreCompilationDeps: "specify",
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: { metrics: { hideFolders: true } },
  },
};
