import React, { useState, useCallback } from 'react';
import { Box, Slider, Typography, Alert, TextField } from '@mui/material';

interface FaderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    label?: string;
    description?: string;
    defaultValue?: number;
    onChange: (value: number) => void;
    onValidationError?: (error: string | null) => void;
}

export const Fader: React.FC<FaderProps> = ({
    value,
    min,
    max,
    step = 0.1,
    unit = '',
    label = '',
    description = '',
    defaultValue,
    onChange,
    onValidationError,
}) => {
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState<string>(value.toString());
    const [isEditing, setIsEditing] = useState(false);

    // Generate marks for the slider
    const marks = React.useMemo(() => {
        const count = 3;
        const range = max - min;
        return Array.from({ length: count }, (_, i) => {
            const value = min + (range * (i / (count - 1)));
            return {
                value,
                label: value.toFixed(step >= 1 ? 0 : Math.abs(Math.log10(step)))
            };
        });
    }, [min, max, step]);

    const validateValue = useCallback((val: number): string | null => {
        if (isNaN(val)) {
            return 'Invalid number';
        }

        if (val < min || val > max) {
            return `Value must be between ${min} and ${max}${unit ? ` ${unit}` : ''}`;
        }

        // For hertz values, we want to be more lenient with step validation
        if (unit === 'hertz') {
            const roundedValue = Math.round(val * 100) / 100;
            if (Math.abs(val - roundedValue) > 0.0001) {
                return null;
            }
        } else {
            // For other units, check if value is a multiple of step
            const steps = Math.round((val - min) / step);
            const nearestValidValue = min + (steps * step);
            const epsilon = step / 1000;

            if (Math.abs(val - nearestValidValue) > epsilon) {
                return `Value must be a multiple of ${step}${unit ? ` ${unit}` : ''}`;
            }
        }

        return null;
    }, [min, max, step, unit]);

    const handleChange = useCallback((_: Event, newValue: number | number[]) => {
        const val = newValue as number;
        const validationError = validateValue(val);
        
        setError(validationError);
        onValidationError?.(validationError);

        if (!validationError) {
            onChange(val);
            setInputValue(val.toFixed(step >= 1 ? 0 : Math.abs(Math.log10(step))));
        }
    }, [onChange, onValidationError, validateValue, step]);

    const handleDoubleClick = useCallback(() => {
        if (defaultValue !== undefined) {
            const validationError = validateValue(defaultValue);
            setError(validationError);
            onValidationError?.(validationError);

            if (!validationError) {
                onChange(defaultValue);
                setInputValue(defaultValue.toFixed(step >= 1 ? 0 : Math.abs(Math.log10(step))));
            }
        }
    }, [defaultValue, onChange, onValidationError, validateValue, step]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        const newValue = parseFloat(e.target.value);
        
        if (!isNaN(newValue)) {
            const validationError = validateValue(newValue);
            setError(validationError);
            onValidationError?.(validationError);

            if (!validationError) {
                onChange(newValue);
            }
        } else {
            setError('Invalid number');
            onValidationError?.('Invalid number');
        }
    }, [onChange, onValidationError, validateValue]);

    const handleInputBlur = useCallback(() => {
        setIsEditing(false);
        // Reset input value to current valid value if there was an error
        if (error) {
            setInputValue(value.toFixed(step >= 1 ? 0 : Math.abs(Math.log10(step))));
            setError(null);
            onValidationError?.(null);
        }
    }, [error, value, step, onValidationError]);

    const handleInputFocus = useCallback(() => {
        setIsEditing(true);
    }, []);

    // Update input value when external value changes
    React.useEffect(() => {
        if (!isEditing) {
            setInputValue(value.toFixed(step >= 1 ? 0 : Math.abs(Math.log10(step))));
        }
    }, [value, step, isEditing]);

    return (
        <Box
            sx={{
                py: 1,
                px: 1.5,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: error ? 'error.main' : 'divider',
                '&:hover': {
                    borderColor: 'primary.main',
                },
                position: 'relative',
                width: '100%',
                '& .MuiSlider-mark': {
                    width: '1px !important',
                    right: 'auto !important'
                }
            }}
            onDoubleClick={handleDoubleClick}
        >
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                height: 28,
                position: 'relative',
                zIndex: 1,
                width: '100%'
            }}>
                <Box sx={{ 
                    minWidth: 80, 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0
                }}>
                    {label && (
                        <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {label}
                        </Typography>
                    )}
                    {unit && (
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                flexShrink: 0
                            }}
                        >
                            {unit}
                        </Typography>
                    )}
                </Box>

                <TextField
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onFocus={handleInputFocus}
                    error={!!error}
                    size="small"
                    variant="standard"
                    inputProps={{
                        style: { 
                            width: '60px',
                            textAlign: 'right',
                            padding: '2px 4px',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem'
                        }
                    }}
                    sx={{
                        flexShrink: 0,
                        '& .MuiInput-root': {
                            margin: 0,
                        },
                        '& .MuiInput-input': {
                            padding: 0,
                        }
                    }}
                />

                <Box sx={{ 
                    flex: 1,
                    mx: 1,
                    minWidth: 100,
                    position: 'relative',
                    '& .MuiSlider-root': {
                        padding: '10px 0',
                        margin: '0 -2px',
                        width: 'calc(100% + 4px)'
                    },
                    '& .MuiSlider-mark': {
                        backgroundColor: 'text.secondary',
                        opacity: 0.4,
                        width: '1px !important',
                        right: 'auto !important',
                        height: 8
                    },
                    '& .MuiSlider-markActive': {
                        backgroundColor: 'text.secondary',
                        opacity: 0.8
                    }
                }}>
                    <Slider
                        value={value}
                        min={min}
                        max={max}
                        step={step}
                        marks={marks}
                        onChange={handleChange}
                        size="small"
                        sx={{
                            '& .MuiSlider-markLabel': {
                                fontSize: '0.65rem',
                                color: 'text.secondary',
                                transform: 'translate(-50%, 20px)',
                                whiteSpace: 'nowrap'
                            },
                            '& .MuiSlider-thumb': {
                                width: 12,
                                height: 12,
                                '&:hover, &.Mui-focusVisible': {
                                    boxShadow: '0 0 0 6px rgba(74, 144, 226, 0.16)'
                                },
                                '&.Mui-active': {
                                    boxShadow: '0 0 0 8px rgba(74, 144, 226, 0.24)'
                                }
                            },
                            '& .MuiSlider-rail': {
                                opacity: 0.3
                            },
                            '& .MuiSlider-track': {
                                border: 'none'
                            }
                        }}
                    />
                </Box>

                {description && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ 
                            cursor: 'help',
                            fontSize: '0.7rem',
                            opacity: 0.7,
                            flexShrink: 0,
                            '&:hover': {
                                opacity: 1
                            }
                        }}
                        title={description}
                    >
                        ℹ️
                    </Typography>
                )}
            </Box>

            {error && (
                <Typography 
                    variant="caption" 
                    color="error"
                    sx={{ 
                        display: 'block',
                        mt: 0.5,
                        fontSize: '0.65rem'
                    }}
                >
                    {error}
                </Typography>
            )}
        </Box>
    );
};
