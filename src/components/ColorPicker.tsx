import { Box, Tooltip } from '@mui/material'

const COLORS = [
  '#3f51b5',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
  '#6d4c41',
  '#546e7a',
  '#d81b60',
  '#7cb342',
  '#039be5',
  '#ffb300',
]

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {COLORS.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase()
        return (
          <Tooltip key={c} title={c}>
            <Box
              onClick={() => onChange(c)}
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                bgcolor: c,
                cursor: 'pointer',
                boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.12)' },
              }}
            />
          </Tooltip>
        )
      })}
    </Box>
  )
}