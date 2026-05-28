import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusCard from '../src/components/StatusCard.jsx';

describe('StatusCard', () => {
  // Fragile-by-design: change the label in src/utils/status.js (e.g. 'OK' -> 'OKAY')
  // and this test will fail — perfect for the failing-tests classroom demo.
  it('renders the exact label for the current status', () => {
    render(<StatusCard status="ok" onCycle={() => {}} />);
    expect(screen.getByTestId('status-label')).toHaveTextContent('OK');
  });

  it('calls onCycle when the button is clicked', async () => {
    const onCycle = vi.fn();
    render(<StatusCard status="warn" onCycle={onCycle} />);
    await userEvent.click(screen.getByRole('button', { name: /cycle status/i }));
    expect(onCycle).toHaveBeenCalledTimes(1);
  });
});
