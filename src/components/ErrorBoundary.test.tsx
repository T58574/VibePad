import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test Runtime Crash');
};

describe('ErrorBoundary Component Suite', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeTruthy();
  });

  it('should catch runtime error and render recovery UI', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Упс! В VibePad произошел сбой')).toBeTruthy();
    expect(screen.getByText('Error: Test Runtime Crash')).toBeTruthy();

    consoleSpy.mockRestore();
  });
});
