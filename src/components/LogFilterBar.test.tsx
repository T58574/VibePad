import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogFilterBar } from './LogFilterBar';

describe('LogFilterBar Component Suite', () => {
  it('should render filter input and tail toggle button', () => {
    const handleFilterChange = vi.fn();
    const handleToggleTail = vi.fn();

    render(
      <LogFilterBar
        filterQuery="[ERROR]"
        onFilterChange={handleFilterChange}
        isTailing={false}
        onToggleTail={handleToggleTail}
      />
    );

    const input = screen.getByPlaceholderText(/Filter lines by/i) as HTMLInputElement;
    expect(input.value).toBe('[ERROR]');

    expect(screen.getByText('Enable Log Tail')).toBeTruthy();
  });

  it('should trigger onFilterChange when input changes', () => {
    const handleFilterChange = vi.fn();
    const handleToggleTail = vi.fn();

    render(
      <LogFilterBar
        filterQuery=""
        onFilterChange={handleFilterChange}
        isTailing={false}
        onToggleTail={handleToggleTail}
      />
    );

    const input = screen.getByPlaceholderText(/Filter lines by/i);
    fireEvent.change(input, { target: { value: '[WARN]' } });

    expect(handleFilterChange).toHaveBeenCalledWith('[WARN]');
  });

  it('should toggle live tail state on button click', () => {
    const handleFilterChange = vi.fn();
    const handleToggleTail = vi.fn();

    render(
      <LogFilterBar
        filterQuery=""
        onFilterChange={handleFilterChange}
        isTailing={true}
        onToggleTail={handleToggleTail}
      />
    );

    expect(screen.getByText('Live Tail Active')).toBeTruthy();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleToggleTail).toHaveBeenCalledTimes(1);
  });
});
