// @vitest-environment jsdom
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render } from '@testing-library/react';

import { CruiseResultFileInput, type CruiseResultFileInputHandle } from './CruiseResultFileInput';

describe('CruiseResultFileInput', () => {
  it('opens the file picker via imperative handle', () => {
    const ref = createRef<CruiseResultFileInputHandle>();
    const { container } = render(<CruiseResultFileInput ref={ref} onFileSelect={vi.fn()} />);
    const input = container.querySelector('input')!;
    const click = vi.spyOn(input, 'click');

    ref.current?.open();

    expect(click).toHaveBeenCalled();
  });

  it('forwards selected file and resets the input value', () => {
    const onFileSelect = vi.fn();
    const { container } = render(<CruiseResultFileInput onFileSelect={onFileSelect} />);
    const input = container.querySelector('input')!;
    const file = new File(['{}'], 'cruise-result.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledWith(file);
    expect(input).toHaveValue('');
  });

  it('ignores empty file selection', () => {
    const onFileSelect = vi.fn();
    const { container } = render(<CruiseResultFileInput onFileSelect={onFileSelect} />);
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { files: [] } });

    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
