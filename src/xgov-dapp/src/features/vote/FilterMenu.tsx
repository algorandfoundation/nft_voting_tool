import { MouseEvent, useMemo, useState } from 'react'
import { Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import { Question } from '../../../../dapp/src/shared/IPFSGateway'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

export type SelectedItem = {
  type: string
  name: string
}

export type FilterMenuProps = {
  questions?: Question[]
  selected?: SelectedItem[]
  onClose?: () => void
  onChange?: (category: string, name: string) => void
  onClear?: () => void
}
export function FilterMenu({
  questions = [],
  selected = [],
  onClose = () => {},
  onChange = () => {},
  onClear = () => {},
}: FilterMenuProps = {}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const focusAreas = useMemo<string[]>(() => {
    return questions.reduce((prev, curr) => {
      if (typeof curr?.metadata?.focus_area === 'string' && !prev.includes(curr.metadata.focus_area)) {
        prev.push(curr.metadata.focus_area)
      }
      return prev
    }, [] as string[])
  }, [questions])

  const categories = useMemo<string[]>(() => {
    return questions.reduce((prev, curr) => {
      if (typeof curr?.metadata?.category === 'string' && !prev.includes(curr.metadata.category)) {
        prev.push(curr.metadata.category)
      }
      return prev
    }, [] as string[])
  }, [questions])

  const isSelected = (type: string, name: string) => {
    return selected.some((s) => s.type === type && s.name === name)
  }
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
    if (typeof onClose === 'function') onClose()
  }

  return (
    <div>
      <IconButton
        id="proposal-filter-button"
        aria-controls={open ? 'proposal-filter-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <FilterAltIcon />
      </IconButton>
      <Menu
        id="proposal-filter-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'proposal-filter-button',
        }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          Focus
        </MenuItem>
        {focusAreas.map((fa) => (
          <MenuItem onClick={() => onChange('focus', fa)}>
            <ListItemIcon>{isSelected('focus', fa) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}</ListItemIcon>

            {fa}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          Category
        </MenuItem>
        {categories.map((fa) => (
          <MenuItem onClick={() => onChange('category', fa)}>
            <ListItemIcon>
              {isSelected('category', fa) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon/> }
            </ListItemIcon>
            {fa}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={onClear}>Clear</MenuItem>
      </Menu>
    </div>
  )
}
