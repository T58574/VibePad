import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaaSProductivityModal } from './SaaSProductivityModal';
import { FileItem } from '../utils/ipcBridge';

describe('SaaSProductivityModal Component Suite', () => {
  const mockTabs: FileItem[] = [
    {
      id: 'tab-1',
      name: 'index.ts',
      path: 'index.ts',
      content: 'const x = 10;\nconsole.log(x);',
      encoding: 'UTF-8',
      lineEnding: 'LF',
    },
  ];

  it('should render analytics modal with stats and SAST Security Guard', () => {
    const handleClose = vi.fn();

    render(
      <SaaSProductivityModal
        tabs={mockTabs}
        activeFile={mockTabs[0]}
        onClose={handleClose}
      />
    );

    expect(screen.getByText(/VibePad Analytics & Productivity Dashboard/i)).toBeTruthy();
    expect(screen.getByText(/SAST Сканер Безопасности/i)).toBeTruthy();
    expect(screen.getByText(/Maintainability:/i)).toBeTruthy();
  });

  it('should trigger onClose callback when close button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <SaaSProductivityModal
        tabs={mockTabs}
        activeFile={mockTabs[0]}
        onClose={handleClose}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
