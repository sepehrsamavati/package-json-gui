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
} from '@mui/material'
import { Project, OsInfo } from '../electron/types.js'

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

  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.ipcApi) {
          const info = await window.ipcApi.getOsInfo()
          setOsInfo(info)

          const list = await window.ipcApi.getProjects()
          setProjects(list)
        } else {
          // Graceful mock data fallback for browser previews / Playwright
          setOsInfo({
            platform: 'darwin (mock)',
            release: '24.3.0 (mock)',
            arch: 'arm64 (mock)',
            uptime: 36000,
          })
          setProjects([
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
              name: 'react-mui-app',
              path: '/users/jules/projects/react-mui-app',
              type: 'Web client (react, Vue, angular, next with static build only,...)',
              structure: 'Single Repo (1 package.json, 1 lock)',
              createdAt: new Date(Date.now() - 7200000).toISOString(),
            },
          ])
        }
      } catch (error) {
        console.error('Error fetching data from Electron:', error)
      }
    }

    loadData()
  }, [])

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

  return (
    <Box sx={getContainerStyles()}>
      <Container maxWidth="lg">
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
                background: styleMode === 'glassy'
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
                border: styleMode === 'glassy' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #112240',
                '& .MuiToggleButton-root': {
                  px: 2,
                  color: 'text.secondary',
                  border: 'none',
                  '&.Mui-selected': {
                    color: '#90caf9',
                    backgroundColor: styleMode === 'glassy' ? 'rgba(144, 202, 249, 0.15)' : '#112240',
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
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>
                      Platform
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {osInfo.platform}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>
                      Release
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {osInfo.release}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>
                      Architecture
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {osInfo.arch}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase' }}>
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
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={getCardStyles()}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#90caf9' }}>
                📥 Register New Project
              </Typography>
              <Box component="form" onSubmit={handleAddProject} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                    boxShadow: styleMode === 'glassy' ? '0 4px 14px 0 rgba(144, 202, 249, 0.4)' : 'none',
                  }}
                >
                  Create Project
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Stored Projects Block */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ ...getCardStyles(), minHeight: 450 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#90caf9' }}>
                🗂️ Stored Projects (SQLite)
              </Typography>
              {projects.length > 0 ? (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
                  {projects.map((project) => {
                    const isEditing = editingProject?.id === project.id

                    return (
                      <Card
                        key={project.id}
                        elevation={0}
                        sx={{
                          backgroundColor: styleMode === 'glassy' ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                          border: styleMode === 'glassy' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: styleMode === 'glassy' ? undefined : 0,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': styleMode === 'glassy' ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            borderColor: 'rgba(255, 255, 255, 0.12)',
                          } : {},
                        }}
                      >
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#90caf9', fontSize: '1.1rem' }}>
                                📁 {project.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: getSubtleLabel(), fontFamily: 'monospace', mt: 0.5, wordBreak: 'break-all' }}>
                                {project.path}
                              </Typography>
                            </Box>

                            {!isEditing && (
                              <Button
                                size="small"
                                onClick={() => handleStartEdit(project)}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: styleMode === 'glassy' ? undefined : 0,
                                }}
                              >
                                Edit Labels
                              </Button>
                            )}
                          </Box>

                          {/* Chips and editing view */}
                          {isEditing && editingProject ? (
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <FormControl fullWidth size="small">
                                <InputLabel id="edit-type-label">Project Type</InputLabel>
                                <Select
                                  labelId="edit-type-label"
                                  value={editingProject.type}
                                  label="Project Type"
                                  onChange={(e) => setEditingProject({ ...editingProject, type: e.target.value })}
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
                                  onChange={(e) => setEditingProject({ ...editingProject, structure: e.target.value })}
                                  sx={{ borderRadius: styleMode === 'glassy' ? undefined : 0 }}
                                >
                                  {PROJECT_STRUCTURES.map((struct) => (
                                    <MenuItem key={struct} value={struct}>
                                      {struct}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
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
                                  Save Changes
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={project.type || 'Web client'}
                                size="small"
                                sx={{
                                  backgroundColor: styleMode === 'glassy' ? 'rgba(144, 202, 249, 0.12)' : 'transparent',
                                  color: '#90caf9',
                                  border: `1px solid ${styleMode === 'glassy' ? 'rgba(144, 202, 249, 0.25)' : '#90caf9'}`,
                                  borderRadius: styleMode === 'glassy' ? undefined : 0,
                                  fontWeight: 500,
                                }}
                              />
                              <Chip
                                label={project.structure || 'Single Repo'}
                                size="small"
                                sx={{
                                  backgroundColor: styleMode === 'glassy' ? 'rgba(244, 143, 177, 0.12)' : 'transparent',
                                  color: '#f48fb1',
                                  border: `1px solid ${styleMode === 'glassy' ? 'rgba(244, 143, 177, 0.25)' : '#f48fb1'}`,
                                  borderRadius: styleMode === 'glassy' ? undefined : 0,
                                  fontWeight: 500,
                                }}
                              />
                            </Box>
                          )}

                          <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            📅 Registered: {new Date(project.createdAt).toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    )
                  })}
                </List>
              ) : (
                <Typography color="textSecondary" sx={{ mt: 2 }}>
                  No registered projects yet. Use the form to add one.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default App
