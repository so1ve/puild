export type PackageType = "module" | "commonjs";

export interface ExportEntry {
  outputPath: string
  type: PackageType | "types"
  platform?: "node"
  isExecutable?: true
  from: string
}

export interface AliasMap { [alias: string]: string }
