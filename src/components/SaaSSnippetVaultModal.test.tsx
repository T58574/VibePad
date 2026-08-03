import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaaSSnippetVaultModal } from './SaaSSnippetVaultModal';

describe('SaaSSnippetVaultModal Component Suite', () => {
  it('should render snippet vault header and categories', () => {
    const handleClose = vi.fn();
    const handleInsertSnippet = vi.fn();
    const handleLoadPresetWorkspace = vi.fn();

    render(
      <SaaSSnippetVaultModal
        onClose={handleClose}
        onInsertSnippet={handleInsertSnippet}
        onLoadPresetWorkspace={handleLoadPresetWorkspace}
      />
    );

    expect(screen.getByText(/SaaS Snippet Vault & Templates/i)).toBeTruthy();
    expect(screen.getByText(/Fullstack Node/i)).toBeTruthy();
    expect(screen.getAllByText(/Python FastAPI/i).length).toBeGreaterThan(0);
  });

  it('should trigger onLoadPresetWorkspace when preset environment is selected', () => {
    const handleClose = vi.fn();
    const handleInsertSnippet = vi.fn();
    const handleLoadPresetWorkspace = vi.fn();

    render(
      <SaaSSnippetVaultModal
        onClose={handleClose}
        onInsertSnippet={handleInsertSnippet}
        onLoadPresetWorkspace={handleLoadPresetWorkspace}
      />
    );

    const fullstackPresetBtn = screen.getByText(/Fullstack Node/i);
    fireEvent.click(fullstackPresetBtn);

    expect(handleLoadPresetWorkspace).toHaveBeenCalledWith('FullstackNode');
    expect(handleClose).toHaveBeenCalled();
  });
});
