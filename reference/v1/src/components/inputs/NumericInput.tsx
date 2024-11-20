import React from 'react';
import { TextField, Typography, Box } from '@mui/material';

interface NumericInputProps {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  description?: string;
  defaultValue: number;
  onChange: (value: number) => void;
  onValidationError?: (error: string) => void;
}

export function NumericInput({
  value,
  min,
  max,
  step,
  label,
  description,
  defaultValue,
  onChange,
  onValidationError
}: NumericInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    
    if (isNaN(newValue)) {
      onValidationError?.('Value must be a number');
      return;
    }

    if (newValue < min || newValue > max) {
      onValidationError?.(`Value must be between ${min} and ${max}`);
      return;
    }

    if (Math.abs((newValue - min) % step) > Number.EPSILON) {
      onValidationError?.(`Value must be in steps of ${step}`);
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
      <TextField
        type="number"
        value={value}
        onChange={handleChange}
        inputProps={{
          min,
          max,
          step
        }}
        fullWidth
        size="small"
        variant="outlined"
      />
    </Box>
  );
}
