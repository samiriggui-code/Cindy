// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { setDataOwnerGeneration } from '@/contexts/dataOwnerGeneration';
import en from '@/i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';
import type { CindyVersionsState } from '../../../../shared/cindyVersions';
import { CindyMakeVersionsPanel } from '../CindyMakeVersionsPanel';

vi.mock('@/components/ui/confirm-dialog-provider', () => ({
  useConfirmDialog: () => ({ confirm: async () => false }),
}));

const cases = [
  {
    locale: 'en',
    resource: en,
    title: 'My Versions',
    switchLabel: 'Switch and Restart',
    remove: 'Delete Version',
    update: 'Restart to Update',
  },
  {
    locale: 'fr',
    resource: fr,
    title: 'Mes versions',
    switchLabel: 'Changer et redémarrer',
    remove: 'Supprimer la version',
    update: 'Redémarrer pour mettre à jour',
  },
];

beforeEach(() => {
  setDataOwnerGeneration('versions-real-locales');
  const state: CindyVersionsState = {
    currentId: 'original',
    selectedId: 'original',
    switching: false,
    versions: [
      { id: 'original', kind: 'original', available: true, compatible: true },
      { id: 'personal', kind: 'personal', available: true, compatible: true },
    ],
  };
  vi.stubGlobal('electronAPI', {
    getCindyVersions: async () => state,
    actCindyVersion: async () => state,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Cindy Make versions with real translations', () => {
  it.each(cases)(
    'renders the personal update action in $locale',
    async ({ locale, resource, update }) => {
      const state: CindyVersionsState = {
        currentId: 'personal',
        selectedId: 'personal',
        switching: false,
        personalUpdateAvailable: true,
        versions: [
          { id: 'original', kind: 'original', available: true, compatible: true },
          {
            id: 'personal',
            kind: 'personal',
            title: 'Legacy task title',
            available: true,
            compatible: true,
          },
        ],
      };
      vi.stubGlobal('electronAPI', {
        getCindyVersions: async () => state,
        actCindyVersion: async () => state,
      });
      const i18n = createInstance();
      await i18n.use(initReactI18next).init({
        lng: locale,
        fallbackLng: false,
        defaultNS: 'common',
        resources: { [locale]: { common: resource } },
        interpolation: { escapeValue: false },
      });
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <CindyMakeVersionsPanel />
        </I18nextProvider>,
      );
      expect(await screen.findByRole('button', { name: update })).toBeTruthy();
      expect(screen.getAllByText(resource.cindyMake.versions.personal)).toHaveLength(1);
      expect(screen.queryByText('Legacy task title')).toBeNull();
      expect(container.textContent).not.toMatch(/cindyMake\.|\{\{|\?{2,}|\uFFFD/);
    },
  );
  it.each(cases)(
    'renders $locale labels without missing translations or damaged characters',
    async ({ locale, resource, switchLabel, remove }) => {
      const i18n = createInstance();
      await i18n.use(initReactI18next).init({
        lng: locale,
        fallbackLng: false,
        defaultNS: 'common',
        resources: { [locale]: { common: resource } },
        interpolation: { escapeValue: false },
      });
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <CindyMakeVersionsPanel />
        </I18nextProvider>,
      );
      fireEvent.click(
        await screen.findByRole('button', { name: resource.cindyMake.overview.switchVersion }),
      );
      expect(await screen.findByRole('button', { name: switchLabel })).toBeTruthy();
      expect(screen.getByRole('region', { name: resource.cindyMake.overview.title })).toBeTruthy();
      expect(screen.getByRole('button', { name: remove })).toBeTruthy();
      expect(screen.getByText(resource.cindyMake.versions.personal)).toBeTruthy();
      expect(container.textContent).not.toMatch(/cindyMake\.|\{\{|\?{2,}|\uFFFD/);
    },
  );
});
