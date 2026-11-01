// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import en from '@/i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';
import { setDataOwnerGeneration } from '@/contexts/dataOwnerGeneration';

import { SharedProviderGroupStatus } from '../SharedProviderGroupStatus';

const catalogs = { en, fr };
const i18n = createInstance();
const invoke = vi.fn();
const payload = (states: unknown[] | null = ['available', 'needs-update']) => ({
  providers: [{ id: 'anthropic', groupSize: 2, ...(states ? { groupStatus: states } : {}) }],
});
const element = (deviceId = 'share:one') => (
  <I18nextProvider i18n={i18n}>
    <SharedProviderGroupStatus key={deviceId} deviceId={deviceId} providerId="anthropic" initialSize={2} />
  </I18nextProvider>
);

beforeEach(async () => {
  vi.useFakeTimers();
  invoke.mockReset().mockResolvedValue(payload());
  setDataOwnerGeneration('test-owner', 0);
  Object.assign(window, { electronAPI: { deviceLink: { invoke } } });
  await i18n.init({
    lng: 'fr', fallbackLng: false, defaultNS: 'common',
    resources: Object.fromEntries(Object.entries(catalogs).map(([locale, common]) => [locale, { common }])),
    interpolation: { escapeValue: false },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('received provider group status', () => {
  it.each(Object.keys(catalogs) as Array<keyof typeof catalogs>)('renders real %s copy and only anonymous computer labels', async (locale) => {
    await i18n.changeLanguage(locale);
    await act(async () => { render(element()); });
    const copy = catalogs[locale].providerShare.received.groupStatus;
    expect(screen.getByText(copy.title)).toBeTruthy();
    expect(screen.getByText(copy.computer.replace('{{number}}', '1'))).toBeTruthy();
    expect(screen.getByText(copy.state['needs-update'])).toBeTruthy();
    expect(screen.getByText(copy.updateNote)).toBeTruthy();
    expect(screen.getByTestId('shared-provider-group-status').textContent).not.toContain('providerShare.');
    expect(screen.getByTestId('shared-provider-group-status').textContent).not.toContain('???');
    expect(invoke).toHaveBeenCalledWith('share:one', 'maker:provider:list', [{ includeSharedGroupStatus: true }]);
  });

  it('counts busy computers as usable and never renders injected identity or usage', async () => {
    invoke.mockResolvedValue(payload(['busy', { state: 'available', label: 'SECRET NAME', running: 777 }]));
    await act(async () => { render(element()); });
    expect(screen.getByRole('status').textContent).toBe('1 des 2 ordinateurs peuvent accepter des tâches');
    expect(screen.getByText('Occupé, peut accepter des tâches')).toBeTruthy();
    expect(screen.getByText('Statut inconnu')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/SECRET NAME|777/);
  });

  it('clears stale availability after a failed refresh and allows a retry', async () => {
    await act(async () => { render(element()); });
    invoke.mockRejectedValueOnce(new Error('offline'));
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.getByText("Impossible de lire l'état de l'ordinateur. Actualisez pour réessayer.")).toBeTruthy();
    expect(screen.queryByText('Disponible')).toBeNull();
    expect(screen.getAllByText('Statut inconnu')).toHaveLength(2);
    invoke.mockResolvedValue(payload(['cooling', 'paused']));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Actualiser le statut' })); });
    expect(screen.getByText('Aucun ordinateur ne peut accepter de tâches pour le moment. Demandez au partageur de vérifier.')).toBeTruthy();
    expect(screen.getByText('Refroidissement, pas de nouvelles tâches')).toBeTruthy();
  });

  it('does not call an old host healthy or unavailable when it supplies no statuses', async () => {
    invoke.mockResolvedValue(payload(null));
    await act(async () => { render(element()); });
    expect(screen.getByText(fr.providerShare.received.groupStatus.unsupported)).toBeTruthy();
    expect(screen.queryByText('Disponible')).toBeNull();
    expect(screen.queryByText(fr.providerShare.received.groupStatus.noneReady)).toBeNull();
  });

  it('pauses in the background, refreshes when visible, and stops after closing', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    let close!: () => void;
    await act(async () => { close = render(element()).unmount; });
    visibility.mockReturnValue('hidden');
    fireEvent(document, new Event('visibilitychange'));
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(invoke).toHaveBeenCalledTimes(1);
    visibility.mockReturnValue('visible');
    await act(async () => { fireEvent(document, new Event('visibilitychange')); });
    expect(invoke).toHaveBeenCalledTimes(2);
    close();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('ignores a late result from the previously selected share', async () => {
    let resolveOld!: (value: ReturnType<typeof payload>) => void;
    invoke.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    const view = render(element());
    invoke.mockResolvedValue(payload(['offline', 'paused']));
    await act(async () => { view.rerender(element('share:two')); });
    await act(async () => { resolveOld(payload(['available', 'available'])); });
    expect(screen.queryByText('Disponible')).toBeNull();
    expect(screen.getByText('Hors ligne ou inaccessible')).toBeTruthy();
  });

  it('discards an outdated owner snapshot and continues refreshing for the same owner', async () => {
    let resolveOld!: (value: ReturnType<typeof payload>) => void;
    invoke.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    render(element());
    setDataOwnerGeneration('test-owner', 1);
    await act(async () => { resolveOld(payload()); });
    expect(screen.queryByText('Disponible')).toBeNull();
    invoke.mockResolvedValue(payload(['busy', 'paused']));
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(screen.getByText('Occupé, peut accepter des tâches')).toBeTruthy();
  });
});
