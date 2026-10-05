import { useState } from 'react'
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material'
import { ProjectManager } from '../projects/ProjectManager'
import { TagManager } from '../tags/TagManager'

export function Manage() {
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Projects &amp; tags
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Projects" />
        <Tab label="Tags" />
      </Tabs>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {tab === 0 ? <ProjectManager /> : <TagManager />}
      </Paper>
    </Box>
  )
}