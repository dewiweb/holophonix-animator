import React from 'react';
import { Select as MuiSelect, MenuItem, Typography, Box, FormControl, InputLabel } from '@mui/material';

interface SelectProps {
  value: string;
  options: string[];
  label: string;
  description?: string;
  defaultValue: string;
  onChange: (value: string) => void;
  onValidationError?: (error: string) => void;
}

export function Select({
  value,
  options,
  label,
  description,
  defaultValue,
  onChange,
  onValidationError
}: SelectProps) {
  const handleChange = (event: { target: { value: string } }) => {
    const newValue = event.target.value;
    
    if (!options.includes(newValue)) {
      onValidationError?.(`Invalid option: ${newValue}`);
      return;
    }

    onChange(newValue);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      {description && (
        <Typography variant="caption" color="textSecondary" paragraph>
          {description}
        </Typography>
      )}
      <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <MuiSelect
          value={value}
          onChange={handleChange}
          label={label}
          variant="outlined"
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>
    </Box>
  );
}
