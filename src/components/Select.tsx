import React, { useCallback } from 'react';
import { FormControl, InputLabel, Select as MuiSelect, MenuItem, SelectChangeEvent } from '@mui/material';

interface SelectProps {
    value: string;
    options: string[];
    label: string;
    description: string;
    defaultValue: string;
    onChange: (value: string) => void;
    onValidationError?: (error: string | null) => void;
}

export const Select: React.FC<SelectProps> = ({
    value,
    options,
    label,
    description,
    defaultValue,
    onChange,
    onValidationError
}) => {
    const handleChange = useCallback((event: SelectChangeEvent<string>) => {
        const newValue = event.target.value;
        if (!options.includes(newValue)) {
            onValidationError?.(`Value "${newValue}" is not a valid enum option`);
            return;
        }
        onChange(newValue);
        onValidationError?.(null);
    }, [options, onChange, onValidationError]);

    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <MuiSelect
                value={value}
                defaultValue={defaultValue}
                onChange={handleChange}
                title={description}
            >
                {options.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </MuiSelect>
        </FormControl>
    );
};
