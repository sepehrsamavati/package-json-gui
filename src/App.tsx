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
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import { Project, OsInfo } from '../electron/types.js'

function App() {
  const [osInfo, setOsInfo] = useState<OsInfo | null>(null)
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')

  useEffect(() => {
    // Fetch initial data from Electron main process
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
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 2,
              name: 'react-mui-app',
              path: '/users/jules/projects/react-mui-app',
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
        const newProject = await window.ipcApi.createProject(projectName, projectPath)
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
        createdAt: new Date().toISOString(),
      }
      setProjects((prev) => [mockProject, ...prev])
      setProjectName('')
      setProjectPath('')
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        package-json-gui (Base Setup)
      </Typography>

      <Grid container spacing={3}>
        {/* OS Info Section */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            {osInfo ? (
              <Box>
                <Typography><strong>Platform:</strong> {osInfo.platform}</Typography>
                <Typography><strong>Release:</strong> {osInfo.release}</Typography>
                <Typography><strong>Architecture:</strong> {osInfo.arch}</Typography>
                <Typography><strong>Uptime:</strong> {Math.floor(osInfo.uptime / 3600)} hours</Typography>
              </Box>
            ) : (
              <Typography color="textSecondary">Loading OS information...</Typography>
            )}
          </Paper>
        </Grid>

        {/* Add Project Section */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Register New Project
            </Typography>
            <Box component="form" onSubmit={handleAddProject} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Project Name"
                variant="outlined"
                size="small"
                fullWidth
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <TextField
                label="Project Path"
                variant="outlined"
                size="small"
                fullWidth
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
              />
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Add Project
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Projects List Section */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, minHeight: 240 }}>
            <Typography variant="h6" gutterBottom>
              Stored Projects (SQLite)
            </Typography>
            {projects.length > 0 ? (
              <List>
                {projects.map((project, index) => (
                  <Box key={project.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={project.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {project.path}
                            </Typography>
                            {` — Registered: ${new Date(project.createdAt).toLocaleString()}`}
                          </>
                        }
                      />
                    </ListItem>
                    {index < projects.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary">No registered projects yet. Use the form to add one.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default App
