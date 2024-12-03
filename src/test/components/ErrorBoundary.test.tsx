import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../react/components/ErrorBoundary';

const ErrorComponent = () => {
  throw new Error('Test error');
  return null;
};

const CustomFallback = ({ error }: { error: Error }) => (
  <div data-testid="custom-fallback">
    Custom Error: {error.message}
  </div>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Test Child</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders default error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-details')).toHaveTextContent('Test error');
  });

  it('renders custom fallback component when provided', () => {
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Custom Error: Test error');
  });

  it('calls onError prop when an error occurs', () => {
    const handleError = jest.fn();
    
    render(
      <ErrorBoundary onError={handleError}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(handleError).toHaveBeenCalledWith(expect.any(Error));
    expect(handleError.mock.calls[0][0].message).toBe('Test error');
  });
});
