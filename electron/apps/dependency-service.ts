import fs from 'node:fs'
import path from 'node:path'

export type DetectedPackage = {
  name: string
  version: string
  path: string
  isRoot: boolean
  lockfiles: string[]
}

export type DetectionResult = {
  projectPath: string
  detectedStructure: 'Single Repo' | 'Monorepo' | 'Hybrid Monorepo'
  packages: DetectedPackage[]
  rootLockfiles: string[]
}

export type DependencyItem = {
  name: string
  version: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
  resolvedVersion?: string | null
  description?: string | null
  license?: string | null
}

export type DependencyListResult = {
  packageName: string
  packageVersion: string
  packageJsonPath: string
  dependencies: DependencyItem[]
}

export type DependencyService = {
  detectPackages: (projectPath: string) => DetectionResult
  getDependencies: (packageJsonPath: string) => DependencyListResult
}

const LOCKFILE_NAMES = [
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
]

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.hg',
  '.svn',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.turbo',
  'coverage',
  '.cache',
])

type RawPackageJson = {
  name?: string
  version?: string
  description?: string
  license?: string | { type?: string }
  workspaces?: string[] | { packages?: string[] }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

const safeReadJson = <T>(filePath: string): T | null => {
  try {
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

const checkLockfiles = (dirPath: string): string[] => {
  const present: string[] = []
  for (const file of LOCKFILE_NAMES) {
    if (fs.existsSync(path.join(dirPath, file))) {
      present.push(file)
    }
  }
  return present
}

// Simple recursive finder for sub-package package.json files
const findSubPackageJsonFiles = (dirPath: string, maxDepth = 3, currentDepth = 0): string[] => {
  if (currentDepth >= maxDepth) return []

  let results: string[] = []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) {
          continue
        }
        const fullSubDir = path.join(dirPath, entry.name)
        const subPkgJsonPath = path.join(fullSubDir, 'package.json')
        if (fs.existsSync(subPkgJsonPath)) {
          results.push(subPkgJsonPath)
        }
        results = results.concat(findSubPackageJsonFiles(fullSubDir, maxDepth, currentDepth + 1))
      }
    }
  } catch {
    // Ignore read errors
  }
  return results
}

// Parse pnpm-workspace.yaml if present
const parsePnpmWorkspacePackages = (workspaceFilePath: string): string[] => {
  try {
    if (!fs.existsSync(workspaceFilePath)) return []
    const content = fs.readFileSync(workspaceFilePath, 'utf-8')
    const lines = content.split('\n')
    const packages: string[] = []
    let inPackages = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('packages:')) {
        inPackages = true
        continue
      }
      if (inPackages) {
        if (trimmed.startsWith('-')) {
          const rawPkg = trimmed.replace(/^-/, '').trim().replace(/['"]/g, '')
          if (rawPkg) packages.push(rawPkg)
        } else if (trimmed && !trimmed.startsWith('#')) {
          break
        }
      }
    }
    return packages
  } catch {
    return []
  }
}

export const createDependencyService = (): DependencyService => {
  return {
    detectPackages: (projectPath: string): DetectionResult => {
      const rootPkgJsonPath = path.join(projectPath, 'package.json')
      const rootPkg = safeReadJson<RawPackageJson>(rootPkgJsonPath)
      const rootLockfiles = checkLockfiles(projectPath)

      const packages: DetectedPackage[] = []

      if (rootPkg) {
        packages.push({
          name: rootPkg.name || path.basename(projectPath),
          version: rootPkg.version || '0.0.0',
          path: rootPkgJsonPath,
          isRoot: true,
          lockfiles: rootLockfiles,
        })
      }

      // Look for sub-packages
      const discoveredPkgJsonPaths = new Set<string>()

      // 1. Check workspaces in package.json
      let workspaceGlobs: string[] = []
      if (rootPkg?.workspaces) {
        if (Array.isArray(rootPkg.workspaces)) {
          workspaceGlobs = rootPkg.workspaces
        } else if (Array.isArray(rootPkg.workspaces.packages)) {
          workspaceGlobs = rootPkg.workspaces.packages
        }
      }

      // 2. Check pnpm-workspace.yaml
      const pnpmWorkspacePath = path.join(projectPath, 'pnpm-workspace.yaml')
      const pnpmWorkspaces = parsePnpmWorkspacePackages(pnpmWorkspacePath)
      if (pnpmWorkspaces.length > 0) {
        workspaceGlobs = [...workspaceGlobs, ...pnpmWorkspaces]
      }

      // Directory scan to discover subpackages
      const allSubPkgJsonFiles = findSubPackageJsonFiles(projectPath, 3, 0)
      for (const subPath of allSubPkgJsonFiles) {
        if (path.resolve(subPath) !== path.resolve(rootPkgJsonPath)) {
          discoveredPkgJsonPaths.add(subPath)
        }
      }

      for (const subPkgPath of discoveredPkgJsonPaths) {
        const subPkg = safeReadJson<RawPackageJson>(subPkgPath)
        if (subPkg) {
          const subDir = path.dirname(subPkgPath)
          packages.push({
            name: subPkg.name || path.basename(subDir),
            version: subPkg.version || '0.0.0',
            path: subPkgPath,
            isRoot: false,
            lockfiles: checkLockfiles(subDir),
          })
        }
      }

      let detectedStructure: 'Single Repo' | 'Monorepo' | 'Hybrid Monorepo' = 'Single Repo'
      if (packages.length > 1) {
        const subHasLockfiles = packages.some((p) => !p.isRoot && p.lockfiles.length > 0)
        if (subHasLockfiles && rootLockfiles.length > 0) {
          detectedStructure = 'Hybrid Monorepo'
        } else if (subHasLockfiles || workspaceGlobs.length > 0) {
          detectedStructure = 'Monorepo'
        } else {
          detectedStructure = 'Monorepo'
        }
      }

      return {
        projectPath,
        detectedStructure,
        packages,
        rootLockfiles,
      }
    },

    getDependencies: (packageJsonPath: string): DependencyListResult => {
      const pkg = safeReadJson<RawPackageJson>(packageJsonPath)
      if (!pkg) {
        return {
          packageName: 'Unknown',
          packageVersion: '0.0.0',
          packageJsonPath,
          dependencies: [],
        }
      }

      const packageDir = path.dirname(packageJsonPath)
      const rootDir = path.resolve(packageDir, '..')

      // Attempt to load package-lock.json from current dir or root dir
      let lockData: {
        packages?: Record<string, { version?: string }>
        dependencies?: Record<string, { version?: string }>
      } | null = safeReadJson(path.join(packageDir, 'package-lock.json'))

      if (!lockData) {
        lockData = safeReadJson(path.join(rootDir, 'package-lock.json'))
      }

      const getResolvedVersion = (depName: string): string | null => {
        // Check node_modules in current package dir first
        const nodeModulesPkg = safeReadJson<RawPackageJson>(
          path.join(packageDir, 'node_modules', depName, 'package.json')
        )
        if (nodeModulesPkg?.version) {
          return nodeModulesPkg.version
        }

        if (lockData) {
          if (lockData.packages) {
            const key1 = `node_modules/${depName}`
            if (lockData.packages[key1]?.version) {
              return lockData.packages[key1].version
            }
            // Search in packages keys ending with node_modules/depName
            for (const [key, val] of Object.entries(lockData.packages)) {
              if (key.endsWith(`node_modules/${depName}`) && val.version) {
                return val.version
              }
            }
          }
          if (lockData.dependencies && lockData.dependencies[depName]?.version) {
            return lockData.dependencies[depName].version
          }
        }
        return null
      }

      const getPackageDetails = (depName: string): { description: string | null; license: string | null } => {
        const nodeModulesPkg = safeReadJson<RawPackageJson>(
          path.join(packageDir, 'node_modules', depName, 'package.json')
        )
        let licenseStr: string | null = null;
        if (nodeModulesPkg?.license) {
          if (typeof nodeModulesPkg.license === 'string') {
            licenseStr = nodeModulesPkg.license
          } else if (typeof nodeModulesPkg.license === 'object' && nodeModulesPkg.license.type) {
            licenseStr = nodeModulesPkg.license.type
          }
        }
        return {
          description: nodeModulesPkg?.description || null,
          license: licenseStr,
        }
      }

      const dependenciesList: DependencyItem[] = []

      const sectionTypes: Array<{
        key: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
        dict: Record<string, string> | undefined
      }> = [
        { key: 'dependencies', dict: pkg.dependencies },
        { key: 'devDependencies', dict: pkg.devDependencies },
        { key: 'peerDependencies', dict: pkg.peerDependencies },
        { key: 'optionalDependencies', dict: pkg.optionalDependencies },
      ]

      for (const section of sectionTypes) {
        if (!section.dict) continue
        for (const [depName, declaredVersion] of Object.entries(section.dict)) {
          const resolvedVersion = getResolvedVersion(depName)
          const details = getPackageDetails(depName)

          dependenciesList.push({
            name: depName,
            version: declaredVersion,
            type: section.key,
            resolvedVersion,
            description: details.description,
            license: details.license,
          })
        }
      }

      return {
        packageName: pkg.name || path.basename(packageDir),
        packageVersion: pkg.version || '0.0.0',
        packageJsonPath,
        dependencies: dependenciesList,
      }
    },
  }
}
