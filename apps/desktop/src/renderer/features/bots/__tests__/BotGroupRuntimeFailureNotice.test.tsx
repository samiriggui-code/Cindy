// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '@/i18n/locales/fr/common.json';
import { BotGroupRuntimeFailureNotice } from '../BotGroupRuntimeFailureNotice';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, { name }: { name: string }) => {
  const code = key.split('.').at(-1)!;
  return fr.bots.groupChat.notice.runtimeFailure[code as keyof typeof fr.bots.groupChat.notice.runtimeFailure].replace('{{name}}', name);
} }) }));
afterEach(cleanup);

describe('group failure notice', () => {
  it('shows the image failure and the actual recovery settings', () => {
    render(<BotGroupRuntimeFailureNotice name="m" code="IMAGE_INPUT_UNSUPPORTED" />);
    expect(screen.getByText(/ne prend pas en charge les images/).textContent).toContain('Paramètres → Personnalisation');
    expect(screen.getByText(/ne prend pas en charge les images/).textContent).toContain('envoyez à nouveau votre message');
  });
  // #6835: unit render entry must show the limit and recovery, not an unavailable notice.
  it.each([
    ['REMOTE_DEVICE_LIMIT', 'appareil'],
    ['REMOTE_TOTAL_LIMIT', 'limite totale'],
  ])('explains %s with a recovery action', (code, reason) => {
    render(<BotGroupRuntimeFailureNotice name="Bot" code={code} />);
    const text = screen.getByText(/a atteint sa limite/).textContent;
    expect(text).toContain('Bot');
    expect(text).toContain(reason);
    expect(text).toContain('Remote');
  });
  it('does not render an unknown or private diagnostic as group content', () => {
    const { container } = render(<BotGroupRuntimeFailureNotice name="m" code="private-token-and-path" />);
    expect(container.textContent).toBe('');
  });
  it('explains upstream capacity and offers a retry without attributing it to request frequency', () => {
    render(<BotGroupRuntimeFailureNotice name="m" code="UPSTREAM_OVERLOADED" />);
    expect(screen.getByText(/temporairement surchargé/).textContent).toContain('Réessayez plus tard');
    expect(screen.getByText(/temporairement surchargé/).textContent).toContain('un autre modèle disponible');
  });
});
