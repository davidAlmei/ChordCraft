import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChordEntryPopover } from '@/components/chord-picker/ChordEntryPopover';

describe('ChordEntryPopover Component', () => {
  it('renders input with initial symbol and quick root chips', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ChordEntryPopover
        isOpen={true}
        initialSymbol="Am"
        position={{ x: 100, y: 100 }}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    const input = screen.getByPlaceholderText(/e\.g\. Am7/i) as HTMLInputElement;
    expect(input.value).toBe('Am');

    // Click quick quality chip "7"
    const quality7 = screen.getByText('7');
    fireEvent.click(quality7);
    expect(input.value).toBe('Am7');

    // Click Save button
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    expect(handleConfirm).toHaveBeenCalledWith('Am7', 0, 0);
  });

  it('triggers delete callback when delete button is clicked', () => {
    const handleDelete = vi.fn();

    render(
      <ChordEntryPopover
        isOpen={true}
        initialSymbol="G7"
        position={{ x: 100, y: 100 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onDelete={handleDelete}
      />
    );

    const deleteBtn = screen.getByTitle('Delete Chord');
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalled();
  });
});
