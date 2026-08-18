import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  List,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  Project,
  OsInfo,
  DetectionResult,
  DependencyListResult,
  DetectedPackage,
} from '../electron/types.js'

const PROJECT_TYPES = [
  'Server (fastify, express, nest, ...)',
  'Web client (react, Vue, angular, next with static build only,...)',
  'Full stacks (next,...)',
  'Softwares and others (electron, console apps)',
]

const PROJECT_STRUCTURES = [
  'Single Repo (1 package.json, 1 lock)',
  'Monorepo (1 package.json, multiple package.jsons & locks)',
  'Hybrid Monorepo (1 package.json, 1 lock, multiple package.jsons)',
]

type EditingProjectState = {
  id: number
  type: string
  structure: string
}

function App() {
  const [osInfo, setOsInfo] = useState<OsInfo | null>(null)
  const [projects, setProjects] = useState<readonly Project[]>([])

  // Form states
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')
  const [projectType, setProjectType] = useState(PROJECT_TYPES[1]) // Default to Web client
  const [projectStructure, setProjectStructure] = useState(PROJECT_STRUCTURES[0]) // Default to Single Repo

  // Style state: 'glassy' | 'minimal'
  const [styleMode, setStyleMode] = useState<'glassy' | 'minimal'>('glassy')

  // Edit states for projects
  const [editingProject, setEditingProject] = useState<EditingProjectState | null>(null)

  // Package & Dependency Inspector state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [selectedPackagePath, setSelectedPackagePath] = useState<string>('')
  const [dependencyResult, setDependencyResult] = useState<DependencyListResult | null>(null)
  const [depFilter, setDepFilter] = useState<string>('')
  const [depSearch, setDepSearch] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.ipcApi) {
          const info = await window.ipcApi.getOsInfo()
          setOsInfo(info)

          const list = await window.ipcApi.getProjects()
          setProjects(list)
          if (list.length > 0) {
            handleSelectProjectForInspection(list[0])
          }
        } else {
          // Graceful mock data fallback for browser previews / Playwright
          setOsInfo({
            platform: 'darwin (mock)',
            release: '24.3.0 (mock)',
            arch: 'arm64 (mock)',
            uptime: 36000,
          })
          const mockProjList: Project[] = [
            {
              id: 1,
              name: 'package-json-gui',
              path: '/users/jules/projects/package-json-gui',
              type: 'Web client (react, Vue, angular, next with static build only,...)',
              structure: 'Single Repo (1 package.json, 1 lock)',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 2,
              name: 'my-monorepo-app',
              path: '/users/jules/projects/my-monorepo-app',
              type: 'Full stacks (next,...)',
              structure: 'Monorepo (1 package.json, multiple package.jsons & locks)',
              createdAt: new Date(Date.now() - 7200000).toISOString(),
            },
          ]
          setProjects(mockProjList)
          handleSelectProjectForInspection(mockProjList[0])
        }
      } catch (error) {
        console.error('Error fetching data from Electron:', error)
      }
    }

    loadData()
  }, [])

  const handleSelectProjectForInspection = async (project: Project) => {
    setSelectedProject(project)
    setDepSearch('')
    setDepFilter('')

    if (window.ipcApi) {
      try {
        const detection = await window.ipcApi.detectPackages(project.path)
        setDetectionResult(detection)
        if (detection.packages.length > 0) {
          const firstPkgPath = detection.packages[0].path
          setSelectedPackagePath(firstPkgPath)
          const deps = await window.ipcApi.getDependencies(firstPkgPath)
          setDependencyResult(deps)
        } else {
          setSelectedPackagePath('')
          setDependencyResult(null)
        }
      } catch (error) {
        console.error('Error detecting packages:', error)
      }
    } else {
      // Mock detection and dependency result
      const mockDetection: DetectionResult = {
        projectPath: project.path,
        detectedStructure: project.structure.includes('Monorepo') ? 'Monorepo' : 'Single Repo',
        rootLockfiles: ['package-lock.json'],
        packages: [
          {
            name: project.name,
            version: '1.0.0',
            path: `${project.path}/package.json`,
            isRoot: true,
            lockfiles: ['package-lock.json'],
          },
          ...(project.structure.includes('Monorepo')
            ? [
                {
                  name: `@${project.name}/ui`,
                  version: '0.1.0',
                  path: `${project.path}/packages/ui/package.json`,
                  isRoot: false,
                  lockfiles: [],
                },
                {
                  name: `@${project.name}/api`,
                  version: '0.2.0',
                  path: `${project.path}/packages/api/package.json`,
                  isRoot: false,
                  lockfiles: ['pnpm-lock.yaml'],
                },
              ]
            : []),
        ],
      }
      setDetectionResult(mockDetection)

      const firstPkg = mockDetection.packages[0]
      setSelectedPackagePath(firstPkg.path)

      setDependencyResult({
        packageName: firstPkg.name,
        packageVersion: firstPkg.version,
        packageJsonPath: firstPkg.path,
        dependencies: [
          {
            name: 'react',
            version: '^19.2.8',
            type: 'dependencies',
            resolvedVersion: '19.2.8',
            description: 'React is a JavaScript library for building user interfaces.',
            license: 'MIT',
          },
          {
            name: '@mui/material',
            version: '^9.3.1',
            type: 'dependencies',
            resolvedVersion: '9.3.1',
            description: 'MUI Core - React components that implement Google Material Design.',
            license: 'MIT',
          },
          {
            name: 'vite',
            version: '^8.2.1',
            type: 'devDependencies',
            resolvedVersion: '8.2.1',
            description: 'Native-ESM powered web dev server',
            license: 'MIT',
          },
          {
            name: 'typescript',
            version: '^5.7.3',
            type: 'devDependencies',
            resolvedVersion: '5.7.3',
            description: 'TypeScript is a language for application scale JavaScript development',
            license: 'Apache-2.0',
          },
        ],
      })
    }
  }

  const handlePackageChange = async (pkgPath: string) => {
    setSelectedPackagePath(pkgPath)
    if (window.ipcApi) {
      try {
        const deps = await window.ipcApi.getDependencies(pkgPath)
        setDependencyResult(deps)
      } catch (error) {
        console.error('Error fetching package dependencies:', error)
      }
    } else {
      // Mock subpackage deps
      const pkg = detectionResult?.packages.find((p) => p.path === pkgPath)
      setDependencyResult({
        packageName: pkg?.name || 'sub-pkg',
        packageVersion: pkg?.version || '1.0.0',
        packageJsonPath: pkgPath,
        dependencies: [
          {
            name: 'lodash-es',
            version: '^4.17.21',
            type: 'dependencies',
            resolvedVersion: '4.17.21',
            description: 'Lodash exported as ES modules.',
            license: 'MIT',
          },
          {
            name: 'vitest',
            version: '^1.0.0',
            type: 'devDependencies',
            resolvedVersion: '1.0.0',
            description: 'Next generation testing framework',
            license: 'MIT',
          },
        ],
      })
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName || !projectPath) return

    if (window.ipcApi) {
      try {
        const newProject = await window.ipcApi.createProject(
          projectName,
          projectPath,
          projectType,
          projectStructure
        )
        setProjects((prev) => [newProject, ...prev])
        setProjectName('')
        setProjectPath('')
        handleSelectProjectForInspection(newProject)
      } catch (error) {
        console.error('Error creating project:', error)
      }
    } else {
      const mockProject: Project = {
        id: Date.now(),
        name: projectName,
        path: projectPath,
        type: projectType,
        structure: projectStructure,
        createdAt: new Date().toISOString(),
      }
      setProjects((prev) => [mockProject, ...prev])
      setProjectName('')
      setProjectPath('')
      handleSelectProjectForInspection(mockProject)
    }
  }

  const handleStartEdit = (project: Project) => {
    setEditingProject({
      id: project.id,
      type: project.type,
      structure: project.structure,
    })
  }

  const handleSaveEdit = async (id: number) => {
    if (!editingProject) return

    if (window.ipcApi) {
      try {
        const updated = await window.ipcApi.updateProject(
          id,
          editingProject.type,
          editingProject.structure
        )
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
        if (selectedProject?.id === id) {
          setSelectedProject(updated)
        }
        setEditingProject(null)
      } catch (error) {
        console.error('Error updating project:', error)
      }
    } else {
      // Mock update
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, type: editingProject.type, structure: editingProject.structure }
            : p
        )
      )
      setEditingProject(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingProject(null)
  }

  // Generate container styles for custom glass/minimal look
  const getContainerStyles = () => {
    if (styleMode === 'glassy') {
      return {
        background: 'radial-gradient(circle at 50% 50%, #0d2b45 0%, #020813 100%)',
        minHeight: '100vh',
        width: '100%',
        py: 4,
        transition: 'background 0.5s ease',
      }
    } else {
      return {
        background: '#0a192f',
        minHeight: '100vh',
        width: '100%',
        py: 4,
        transition: 'background 0.5s ease',
      }
    }
  }

  // Generate card/paper styles
  const getCardStyles = () => {
    if (styleMode === 'glassy') {
      return {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(17, 34, 64, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        p: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    } else {
      return {
        backdropFilter: 'none',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        borderRadius: 0,
        p: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }
  }

  const getSubtleLabel = () => {
    return styleMode === 'glassy' ? 'text.secondary' : 'text.primary'
  }

  const filteredDependencies = dependencyResult?.dependencies.filter((dep) => {
    const matchesFilter = depFilter ? dep.type === depFilter : true
    const matchesSearch = depSearch
      ? dep.name.toLowerCase().includes(depSearch.toLowerCase()) ||
        (dep.description && dep.description.toLowerCase().includes(depSearch.toLowerCase()))
      : true
    return matchesFilter && matchesSearch
  }) || []

  return (
    <Box sx={getContainerStyles()}>
      <Container maxWidth="xl">
        {/* Style Selection and App Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background:
                  styleMode === 'glassy'
                    ? 'linear-gradient(45deg, #90caf9 30%, #f48fb1 90%)'
                    : 'none',
                WebkitBackgroundClip: styleMode === 'glassy' ? 'text' : 'none',
                WebkitTextFillColor: styleMode === 'glassy' ? 'transparent' : 'inherit',
                color: styleMode === 'glassy' ? 'transparent' : '#90caf9',
                display: 'inline-block',
              }}
            >
              package-json-gui
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Elegant Node.js project & dependency companion
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
              Style Mode:
            </Typography>
            <ToggleButtonGroup
              value={styleMode}
              exclusive
              onChange={(_e, val) => val && setStyleMode(val)}
              aria-label="style mode toggle"
              size="small"
              sx={{
                border:
                  styleMode === 'glassy'
                    ? '1px solid rgba(255, 255, 255, 0.12)'
                    : '1px solid #112240',
                '& .MuiToggleButton-root': {
                  px: 2,
                  color: 'text.secondary',
                  border: 'none',
                  '&.Mui-selected': {
                    color: '#90caf9',
                    backgroundColor:
                      styleMode === 'glassy' ? 'rgba(144, 202, 249, 0.15)' : '#112240',
                  },
                },
              }}
            >
              <ToggleButton value="glassy">🎨 Glassy</ToggleButton>
              <ToggleButton value="minimal">⚙️ Minimal</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* OS Info Block */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={getCardStyles()}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#90caf9' }}>
                🖥️ System Status
              </Typography>
              {osInfo ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}
                    >
                      Platform
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {osInfo.platform}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}
                    >
                      Release
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {osInfo.release}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}
                    >
                      Architecture
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {osInfo.arch}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}
                    >
                      Uptime
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {Math.floor(osInfo.uptime / 3600)} hours
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="textSecondary">Loading system details...</Typography>
              )}
            </Paper>
          </Grid>

          {/* Register New Project Block */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={getCardStyles()}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#90caf9' }}>
                📥 Register New Project
              </Typography>
              <Box
                component="form"
                onSubmit={handleAddProject}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                <TextField
                  label="Project Name"
                  variant="outlined"
                  size="small"
                  fullWidth
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: styleMode === 'glassy' ? undefined : 0,
                    },
                  }}
                />
                <TextField
                  label="Project Path"
                  variant="outlined"
                  size="small"
                  fullWidth
                  required
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: styleMode === 'glassy' ? undefined : 0,
                    },
                  }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel id="project-type-label">Project Type</InputLabel>
                  <Select
                    labelId="project-type-label"
                    value={projectType}
                    label="Project Type"
                    onChange={(e) => setProjectType(e.target.value)}
                    sx={{
                      borderRadius: styleMode === 'glassy' ? undefined : 0,
                    }}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="project-structure-label">Structure Layout</InputLabel>
                  <Select
                    labelId="project-structure-label"
                    value={projectStructure}
                    label="Structure Layout"
                    onChange={(e) => setProjectStructure(e.target.value)}
                    sx={{
                      borderRadius: styleMode === 'glassy' ? undefined : 0,
                    }}
                  >
                    {PROJECT_STRUCTURES.map((struct) => (
                      <MenuItem key={struct} value={struct}>
                        {struct}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  variant={styleMode === 'glassy' ? 'contained' : 'outlined'}
                  color="primary"
                  fullWidth
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    borderRadius: styleMode === 'glassy' ? undefined : 0,
                    textTransform: 'none',
                    boxShadow:
                      styleMode === 'glassy'
                        ? '0 4px 14px 0 rgba(144, 202, 249, 0.4)'
                        : 'none',
                  }}
                >
                  Create Project
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ ...getCardStyles(), mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#90caf9' }}>
                🗂️ Stored Projects
              </Typography>
              {projects.length > 0 ? (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0 }}>
                  {projects.map((project) => {
                    const isEditing = editingProject?.id === project.id
                    const isSelected = selectedProject?.id === project.id

                    return (
                      <Card
                        key={project.id}
                        elevation={0}
                        onClick={() => !isEditing && handleSelectProjectForInspection(project)}
                        sx={{
                          cursor: isEditing ? 'default' : 'pointer',
                          backgroundColor: isSelected
                            ? styleMode === 'glassy'
                              ? 'rgba(144, 202, 249, 0.12)'
                              : '#112240'
                            : styleMode === 'glassy'
                              ? 'rgba(255, 255, 255, 0.03)'
                              : 'transparent',
                          border: isSelected
                            ? '1px solid #90caf9'
                            : styleMode === 'glassy'
                              ? '1px solid rgba(255, 255, 255, 0.06)'
                              : '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: styleMode === 'glassy' ? undefined : 0,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': styleMode === 'glassy'
                            ? {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              }
                            : {},
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, color: '#90caf9' }}
                              >
                                📁 {project.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: getSubtleLabel(),
                                  fontFamily: 'monospace',
                                  display: 'block',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {project.path}
                              </Typography>
                            </Box>

                            {!isEditing && (
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEdit(project)
                                }}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: styleMode === 'glassy' ? undefined : 0,
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </Box>

                          {isEditing && editingProject ? (
                            <Box
                              sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FormControl fullWidth size="small">
                                <InputLabel id="edit-type-label">Project Type</InputLabel>
                                <Select
                                  labelId="edit-type-label"
                                  value={editingProject.type}
                                  label="Project Type"
                                  onChange={(e) =>
                                    setEditingProject({ ...editingProject, type: e.target.value })
                                  }
                                  sx={{ borderRadius: styleMode === 'glassy' ? undefined : 0 }}
                                >
                                  {PROJECT_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                      {type}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <FormControl fullWidth size="small">
                                <InputLabel id="edit-structure-label">Structure Layout</InputLabel>
                                <Select
                                  labelId="edit-structure-label"
                                  value={editingProject.structure}
                                  label="Structure Layout"
                                  onChange={(e) =>
                                    setEditingProject({
                                      ...editingProject,
                                      structure: e.target.value,
                                    })
                                  }
                                  sx={{ borderRadius: styleMode === 'glassy' ? undefined : 0 }}
                                >
                                  {PROJECT_STRUCTURES.map((struct) => (
                                    <MenuItem key={struct} value={struct}>
                                      {struct}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  justifyContent: 'flex-end',
                                  mt: 0.5,
                                }}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={handleCancelEdit}
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: styleMode === 'glassy' ? undefined : 0,
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleSaveEdit(project.id)}
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: styleMode === 'glassy' ? undefined : 0,
                                  }}
                                >
                                  Save
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                mt: 1.5,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.8,
                                alignItems: 'center',
                              }}
                            >
                              <Chip
                                label={project.type.split(' ')[0] || 'Web'}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    styleMode === 'glassy'
                                      ? 'rgba(144, 202, 249, 0.12)'
                                      : 'transparent',
                                  color: '#90caf9',
                                  border: `1px solid ${styleMode === 'glassy' ? 'rgba(144, 202, 249, 0.25)' : '#90caf9'}`,
                                  borderRadius: styleMode === 'glassy' ? undefined : 0,
                                }}
                              />
                              <Chip
                                label={project.structure.split(' ')[0] || 'Single'}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    styleMode === 'glassy'
                                      ? 'rgba(244, 143, 177, 0.12)'
                                      : 'transparent',
                                  color: '#f48fb1',
                                  border: `1px solid ${styleMode === 'glassy' ? 'rgba(244, 143, 177, 0.25)' : '#f48fb1'}`,
                                  borderRadius: styleMode === 'glassy' ? undefined : 0,
                                }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </List>
              ) : (
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  No registered projects.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Dependency & Package Inspection Panel */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ ...getCardStyles(), minHeight: 600 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#90caf9' }}>
                  📦 Package & Dependencies Inspector
                </Typography>
                {detectionResult && (
                  <Chip
                    label={`Auto-Detected: ${detectionResult.detectedStructure}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: styleMode === 'glassy' ? undefined : 0 }}
                  />
                )}
              </Box>

              {selectedProject ? (
                <Box>
                  {/* Auto-detected packages / workspace selector */}
                  {detectionResult && detectionResult.packages.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.secondary',
                          mb: 1,
                          fontWeight: 'bold',
                        }}
                      >
                        DETECTED PACKAGES & LOCKFILES:
                      </Typography>
                      <Grid container spacing={1.5}>
                        {detectionResult.packages.map((pkg: DetectedPackage) => {
                          const isPkgSelected = selectedPackagePath === pkg.path
                          return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.path}>
                              <Card
                                elevation={0}
                                onClick={() => handlePackageChange(pkg.path)}
                                sx={{
                                  cursor: 'pointer',
                                  backgroundColor: isPkgSelected
                                    ? styleMode === 'glassy'
                                      ? 'rgba(144, 202, 249, 0.2)'
                                      : '#1e3a8a'
                                    : styleMode === 'glassy'
                                      ? 'rgba(255, 255, 255, 0.04)'
                                      : 'transparent',
                                  border: isPkgSelected
                                    ? '1px solid #90caf9'
                                    : styleMode === 'glassy'
                                      ? '1px solid rgba(255, 255, 255, 0.08)'
                                      : '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: styleMode === 'glassy' ? undefined : 0,
                                  p: 1.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 600, color: '#90caf9' }}
                                  >
                                    {pkg.isRoot ? '🏠 ' : '📦 '}
                                    {pkg.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                      px: 1,
                                      py: 0.2,
                                      borderRadius: 1,
                                    }}
                                  >
                                    v{pkg.version}
                                  </Typography>
                                </Box>
                                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {pkg.lockfiles.length > 0 ? (
                                    pkg.lockfiles.map((lock) => (
                                      <Chip
                                        key={lock}
                                        label={`🔒 ${lock}`}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: '0.65rem',
                                          backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                          color: '#81c784',
                                          border: '1px solid rgba(76, 175, 80, 0.3)',
                                        }}
                                      />
                                    ))
                                  ) : (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                      No local lockfile
                                    </Typography>
                                  )}
                                </Box>
                              </Card>
                            </Grid>
                          )
                        })}
                      </Grid>
                    </Box>
                  )}

                  <Divider sx={{ my: 2.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                  {/* Filter and Search Bar */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: 2.5,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <TextField
                      size="small"
                      placeholder="🔍 Search dependency or description..."
                      value={depSearch}
                      onChange={(e) => setDepSearch(e.target.value)}
                      sx={{
                        flexGrow: 1,
                        minWidth: 200,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: styleMode === 'glassy' ? undefined : 0,
                        },
                      }}
                    />

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel id="dep-type-filter-label">Filter Type</InputLabel>
                      <Select
                        labelId="dep-type-filter-label"
                        value={depFilter}
                        label="Filter Type"
                        onChange={(e) => setDepFilter(e.target.value)}
                        sx={{ borderRadius: styleMode === 'glassy' ? undefined : 0 }}
                      >
                        <MenuItem value="">All Dependencies</MenuItem>
                        <MenuItem value="dependencies">dependencies</MenuItem>
                        <MenuItem value="devDependencies">devDependencies</MenuItem>
                        <MenuItem value="peerDependencies">peerDependencies</MenuItem>
                        <MenuItem value="optionalDependencies">optionalDependencies</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Dependency Listing Table */}
                  {dependencyResult && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Showing {filteredDependencies.length} dependencies for{' '}
                        <strong>{dependencyResult.packageName}</strong> (v
                        {dependencyResult.packageVersion})
                      </Typography>

                      <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                          backgroundColor:
                            styleMode === 'glassy' ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                          border:
                            styleMode === 'glassy'
                              ? '1px solid rgba(255, 255, 255, 0.08)'
                              : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: styleMode === 'glassy' ? undefined : 0,
                          maxHeight: 400,
                        }}
                      >
                        <Table stickyHeader size="small" aria-label="dependencies list table">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor:
                                    styleMode === 'glassy' ? '#0d2136' : '#112240',
                                  fontWeight: 'bold',
                                  color: '#90caf9',
                                  fontSize: '0.9rem',
                                }}
                              >
                                Name & Version (Primary)
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor:
                                    styleMode === 'glassy' ? '#0d2136' : '#112240',
                                  fontWeight: 'bold',
                                  color: 'text.secondary',
                                  fontSize: '0.8rem',
                                }}
                              >
                                Other Info (Limited View)
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredDependencies.length > 0 ? (
                              filteredDependencies.map((dep) => (
                                <TableRow
                                  key={dep.name}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor:
                                        styleMode === 'glassy'
                                          ? 'rgba(255, 255, 255, 0.05)'
                                          : 'rgba(255, 255, 255, 0.02)',
                                    },
                                  }}
                                >
                                  {/* Primary View: Name and Version */}
                                  <TableCell sx={{ py: 1.5, verticalAlign: 'top', minWidth: 220 }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 1,
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        sx={{
                                          fontWeight: 700,
                                          color: '#ffffff',
                                          fontFamily: 'monospace',
                                          fontSize: '0.95rem',
                                        }}
                                      >
                                        {dep.name}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: '#90caf9',
                                          fontWeight: 600,
                                          fontFamily: 'monospace',
                                        }}
                                      >
                                        {dep.version}
                                      </Typography>
                                    </Box>
                                    {dep.resolvedVersion && dep.resolvedVersion !== dep.version && (
                                      <Typography
                                        variant="caption"
                                        sx={{ color: 'text.secondary', display: 'block', mt: 0.2 }}
                                      >
                                        lockfile: {dep.resolvedVersion}
                                      </Typography>
                                    )}
                                  </TableCell>

                                  {/* Secondary View: Compact/Limited Info */}
                                  <TableCell sx={{ py: 1.5, verticalAlign: 'top' }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.5,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          gap: 1,
                                          alignItems: 'center',
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <Chip
                                          label={dep.type}
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: '0.65rem',
                                            backgroundColor:
                                              dep.type === 'dependencies'
                                                ? 'rgba(144, 202, 249, 0.15)'
                                                : dep.type === 'devDependencies'
                                                  ? 'rgba(244, 143, 177, 0.15)'
                                                  : 'rgba(255, 224, 130, 0.15)',
                                            color:
                                              dep.type === 'dependencies'
                                                ? '#90caf9'
                                                : dep.type === 'devDependencies'
                                                  ? '#f48fb1'
                                                  : '#ffe082',
                                            borderRadius:
                                              styleMode === 'glassy' ? undefined : 0,
                                          }}
                                        />
                                        {dep.license && (
                                          <Chip
                                            label={`📄 ${dep.license}`}
                                            size="small"
                                            sx={{
                                              height: 18,
                                              fontSize: '0.65rem',
                                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                              color: 'text.secondary',
                                              borderRadius:
                                                styleMode === 'glassy' ? undefined : 0,
                                            }}
                                          />
                                        )}
                                      </Box>

                                      {dep.description && (
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: 'text.secondary',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            fontSize: '0.75rem',
                                            lineHeight: 1.3,
                                            mt: 0.3,
                                          }}
                                        >
                                          {dep.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No dependencies match the current search or filter.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Select a project from the left panel to inspect its packages, lockfiles, and dependencies.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default App
