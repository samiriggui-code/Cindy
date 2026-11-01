// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { CindyMakeSourceDetails } from '../CindyMakeSourceDetails';
import type {
  MakeSourceLatestVersion,
  MakeSourcePreparation,
} from '../../../../shared/cindyMakeDoctor';
import en from '@/i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';

const source: MakeSourcePreparation = {
  status: 'ready',
  path: 'managed-source',
  branch: 'cindy-personal',
  currentBranch: 'feature/active',
  ref: 'main',
  commit: 'a'.repeat(40),
  baseCommit: 'b'.repeat(40),
  mainCommit: 'c'.repeat(40),
  mainRemoteCommit: 'd'.repeat(40),
  mainBehind: 7,
  mainAhead: 2,
};

const locales = { en, fr };
async function show(
  overrides: Partial<MakeSourcePreparation> = {},
  locale: keyof typeof locales = 'fr',
  latestVersion?: MakeSourceLatestVersion,
) {
  const i18n = createInstance();
  await i18n.init({ lng: locale, resources: { [locale]: { translation: locales[locale] } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <CindyMakeSourceDetails source={{ ...source, ...overrides }} latestVersion={latestVersion} />
    </I18nextProvider>,
  );
}

afterEach(cleanup);

describe('Cindy Make source summary', () => {
  it.each([
    [0, 0, 'Même SHA que le principal local'],
    [0, 6, 'Le principal local comporte 6 enregistrements de modifications non encore inclus'],
    [2, 0, 'Inclut la source locale principale · personnelle contenant 2 enregistrements de modifications supplémentaires'],
    [2, 6, 'La source principale locale contient 6 enregistrements de modifications non encore inclus · la source personnelle contient 2 enregistrements de modifications supplémentaires'],
    [undefined, undefined, 'SHA différent du principal local ; différence inconnue'],
  ] as const)(
    'summarizes the verified local comparison (%s ahead, %s behind)',
    async (personalAhead, personalBehind, expected) => {
      const commit =
        personalAhead === 0 && personalBehind === 0 ? source.mainCommit : source.commit;
      await show({ commit, personalAhead, personalBehind }, 'fr', {
        status: 'unavailable',
        channel: 'dev',
      });
      expect(screen.getByText(expected)).toBeTruthy();
      expect(screen.getByRole('status').getAttribute('aria-label')).toBe(
        'cindy-personnel · État de la version non vérifié',
      );
      expect(screen.getByRole('status').className).not.toContain('--status-success');
      expect(screen.queryByTitle(source.commit!)).toBeNull();
      expect(screen.getAllByTitle(source.mainCommit!).length).toBeGreaterThan(0);
      expect(screen.queryByText(source.baseCommit!.slice(0, 12))).toBeNull();
      expect(screen.queryByText(source.currentBranch!)).toBeNull();
      expect(screen.queryByText(source.mainRemoteCommit!.slice(0, 12))).toBeNull();
      expect(screen.getByText('La recherche a échoué')).toBeTruthy();
    },
  );
  it.each(Object.keys(locales) as (keyof typeof locales)[])(
    'shows live latest main and verified comparison counts in %s',
    async (locale) => {
      const { container } = await show({}, locale, {
        status: 'ready',
        channel: 'dev',
        ref: 'main',
        commit: 'e'.repeat(40),
        ahead: 0,
        behind: 9,
      });
      expect(screen.getByText('e'.repeat(12)).title).toBe('e'.repeat(40));
      expect(screen.getByText(locales[locale].cindyMake.source.details.latest.dev)).toBeTruthy();
      expect(
        screen.getByText(
          locales[locale].cindyMake.source.details.latest.behind_other.replace('{{count}}', '9'),
        ),
      ).toBeTruthy();
      expect(container.textContent).not.toMatch(/cindyMake\.source|\{\{/);
    },
  );

  it.each(['beta', 'release'] as const)(
    'labels the latest %s tag separately from local main',
    async (channel) => {
      const ref = channel === 'beta' ? 'v2.0.0-beta' : 'v2.0.0';
      await show({}, 'fr', { status: 'ready', channel, ref, commit: 'e'.repeat(40) });
      expect(screen.getByText(fr.cindyMake.source.details.latest[channel])).toBeTruthy();
      expect(screen.getByText(ref)).toBeTruthy();
      expect(screen.getByText(source.mainCommit!.slice(0, 12))).toBeTruthy();
      expect(screen.queryByText(/Principal local \(en retard/)).toBeNull();
    },
  );

  it('collapses matching main hashes into one green value without an arrow or stale counts', async () => {
    await show({}, 'fr', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: source.mainCommit!,
      ahead: 0,
      behind: 0,
    });
    const hash = screen.getByTitle(source.mainCommit!);
    expect(hash.className).toContain('--status-success');
    expect(screen.getAllByTitle(source.mainCommit!)).toHaveLength(1);
    expect(screen.getByText('Principal local').className).toContain('--status-success');
    expect(hash.closest('dd')?.querySelector('svg')).toBeNull();
    expect(screen.getByText("Correspond à Principal GitHub, 0 changement d'enregistrement derrière")).toBeTruthy();
    expect(screen.queryByText(/Le principal local est/)).toBeNull();
  });

  it.each(Object.keys(locales) as (keyof typeof locales)[])(
    'marks personal changes on top of the latest online version as up to date in %s',
    async (locale) => {
      const { container } = await show({ personalAhead: 1, personalBehind: 0 }, locale, {
        status: 'ready',
        channel: 'dev',
        ref: 'main',
        commit: source.mainCommit!,
      });
      const status = screen.getByRole('status');
      const copy = locales[locale].cindyMake.overview.personalStatus;
      const label = `${locales[locale].cindyMake.overview.personal}${copy.suffix.replace('{{status}}', copy.upToDate)}`;
      expect(status.textContent).toBe(label);
      expect(status.getAttribute('aria-label')).toBe(`${locales[locale].cindyMake.overview.personal} · ${copy.upToDate}`);
      expect(status.firstElementChild?.tagName.toLowerCase()).toBe('svg');
      expect(status.lastElementChild?.textContent).toBe(label);
      expect(status.className).toContain('--status-success');
      expect(
        screen.getByText(copy.suffix.replace('{{status}}', copy.upToDate).trim()),
      ).toBeTruthy();
      expect(screen.getByText(copy.personalChanges.replace('{{ahead}}', '1'))).toBeTruthy();
      expect(screen.getByText(locales[locale].cindyMake.overview.personal).closest('dt')).toBe(status.closest('dt'));
      expect(screen.queryByTitle(source.commit!)).toBeNull();
      expect(screen.getByText(copy.personalChanges.replace('{{ahead}}', '1')).closest('dd')).toBe(
        status.closest('dt')?.nextElementSibling,
      );
      expect(container.textContent).not.toMatch(/cindyMake[.]|[{][{]|[?][?]|�/);
      fireEvent.focus(status);
      expect((await screen.findByRole('tooltip')).textContent).toBe(
        `${copy.upToDate} · ${copy.upToDateDescription.replace(
          '{{target}}',
          locales[locale].cindyMake.source.details.latest.dev,
        )}`,
      );
    },
  );

  it.each([
    { personalAhead: 0, personalBehind: 2 },
    { personalAhead: 3, personalBehind: 2 },
  ])('marks missing official updates even with personal changes: %o', async (difference) => {
    await show(difference, 'fr', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: source.mainCommit!,
    });
    const status = screen.getByRole('status', { name: 'cindy-personnel · Mise à jour disponible' });
    expect(status.textContent).toBe('cindy-personnel (Mise à jour disponible)');
    expect(status.className).toContain('--upgrade-banner-fg');
    expect(status.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(screen.getByText('(Mise à jour disponible)')).toBeTruthy();
    fireEvent.focus(status);
    expect((await screen.findByRole('tooltip')).textContent).toBe('Mise à jour disponible');
  });

  it.each([
    [0, 0, 'Mise à jour disponible'],
    [1, 0, 'Mise à jour disponible'],
    [4, 1, 'Mise à jour disponible'],
    [4, 0, 'État de la version non vérifié'],
  ] as const)(
    'does not mistake an outdated local main for latest (%s ahead, %s behind)',
    async (personalAhead, personalBehind, expected) => {
      await show(
        {
          commit: personalAhead === 0 ? source.mainCommit : source.commit,
          personalAhead,
          personalBehind,
        },
        'fr',
        {
          status: 'ready',
          channel: 'dev',
          ref: 'main',
          commit: 'e'.repeat(40),
          ahead: 0,
          behind: 3,
        },
      );
      expect(screen.getByRole('status').getAttribute('aria-label')).toBe(
        `cindy-personnel · ${expected}`,
      );
      expect(screen.getByRole('status').className).not.toContain('--status-success');
    },
  );

  it.each([source.mainCommit, undefined])(
    'recognizes personal matching online directly when local main is %s',
    async (mainCommit) => {
      await show({ mainCommit }, 'fr', {
        status: 'ready',
        channel: 'dev',
        ref: 'main',
        commit: source.commit!,
      });
      expect(screen.getByRole('status', { name: 'cindy-personnel · À jour' })).toBeTruthy();
      expect(screen.queryByText(/enregistrements de modifications supplémentaires/)).toBeNull();
    },
  );

  it('recognizes a personal branch containing main ahead of the latest release', async () => {
    await show({ personalAhead: 1, personalBehind: 0 }, 'fr', {
      status: 'ready',
      channel: 'release',
      ref: 'v2.0.0',
      commit: 'e'.repeat(40),
      ahead: 3,
      behind: 0,
    });
    const status = screen.getByRole('status', { name: 'cindy-personnel · À jour' });
    fireEvent.focus(status);
    expect((await screen.findByRole('tooltip')).textContent).toBe(
      'À jour · La source personnelle inclut toutes les mises à jour de Dernière version',
    );
  });

  it('shows a lookup failure rather than treating cached origin/main as latest', async () => {
    const { container } = await show({}, 'fr', { status: 'unavailable', channel: 'dev' });
    expect(container.textContent).toContain('La recherche a échoué');
    expect(container.textContent).not.toContain(source.mainRemoteCommit!.slice(0, 12));
    expect(screen.getByText(source.mainCommit!.slice(0, 12))).toBeTruthy();
    expect(screen.getByText('La recherche a échoué').closest('[class*="--status-success"]')).toBeNull();
  });

  it.each([
    { ahead: 0, behind: 24, expected: 'Le principal local est 24 enregistrements de modifications derrière' },
    { ahead: 3, behind: 0, expected: "Le principal local est 3 modifier les enregistrements à l'avance" },
    { ahead: 2, behind: 7, expected: 'Local principal : 7 modifier les enregistrements en retard, 2 modifier les enregistrements en avance' },
  ])(
    'keeps the difference compact without hiding a nonzero side: $expected',
    async ({ ahead, behind, expected }) => {
      await show({}, 'fr', {
        status: 'ready',
        channel: 'dev',
        ref: 'main',
        commit: 'e'.repeat(40),
        ahead,
        behind,
      });
      expect(screen.getByText(expected)).toBeTruthy();
      expect(screen.getByText(expected).className).not.toContain('--status-success');
      expect(screen.queryByText(/(?:Le principal local est|Local principal :) 0/)).toBeNull();
    },
  );

  it('uses the singular form for one commit', async () => {
    await show({}, 'en', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: 'e'.repeat(40),
      ahead: 0,
      behind: 1,
    });
    expect(screen.getByText('Local main is 1 change record behind')).toBeTruthy();
  });

  it.each(Object.keys(locales) as (keyof typeof locales)[])(
    'keeps local and online main together above personal in %s',
    async (locale) => {
      const { container } = await show({}, locale);
      const labels = container.querySelectorAll('dt');
      expect(labels).toHaveLength(2);
      expect(labels[0].textContent).toBe(locales[locale].cindyMake.overview.localMain);
      expect(within(labels[1]).getByText(locales[locale].cindyMake.overview.personal)).toBeTruthy();
      expect(within(labels[1]).getByRole('status')).toBeTruthy();
      expect(labels[1].parentElement?.className).toContain('items-center');
      expect(labels[1].nextElementSibling?.className).toContain('items-center');
      expect(container.querySelectorAll('dl > div > dd')).toHaveLength(2);
      expect(
        screen.getByText(locales[locale].cindyMake.source.details.latest.dev).closest('dd'),
      ).toBe(screen.getByTitle(source.mainCommit!).closest('dd'));
      expect(screen.getByText(source.mainCommit!.slice(0, 12)).title).toBe(source.mainCommit);
      expect(screen.queryByText(source.commit!.slice(0, 12))).toBeNull();
      expect(screen.getByText(locales[locale].cindyMake.overview.personal).closest('dt')).toBe(labels[1]);
      expect(screen.queryByText('personal')).toBeNull();
      for (const hidden of [
        source.currentBranch!,
        source.baseCommit!.slice(0, 12),
        source.mainRemoteCommit!.slice(0, 12),
      ]) {
        expect(container.textContent).not.toContain(hidden);
      }
      expect(container.textContent).not.toMatch(/cindyMake\.source|\{\{/);
    },
  );

  it('keeps personal and upstream comparison counts separate', async () => {
    await show({ personalAhead: 3, personalBehind: 2 }, 'fr', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: 'e'.repeat(40),
      ahead: 0,
      behind: 23,
    });
    expect(screen.getByRole('status', { name: 'cindy-personnel · Mise à jour disponible' })).toBeTruthy();
    expect(
      screen.getByText(
        'La source principale locale contient 2 enregistrements de modifications non encore inclus · la source personnelle contient 3 enregistrements de modifications supplémentaires',
      ),
    ).toBeTruthy();
    const online = screen.getByText('e'.repeat(12)).closest('dd')!;
    expect(online.textContent).toContain('Le principal local est 23 enregistrements de modifications derrière');
    expect(within(online).queryByText(/Le principal local est 2 /)).toBeNull();
  });

  it('shows unknown counts even when the online hash is available', async () => {
    await show({}, 'fr', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: 'e'.repeat(40),
    });
    expect(screen.getByText('Comparaison principale locale indisponible')).toBeTruthy();
    expect(screen.queryByText(/Correspond à/)).toBeNull();
  });

  it('keeps missing local hashes unknown for old snapshots', async () => {
    await show({ mainCommit: undefined, currentBranch: undefined, ref: 'v1.2.3' });
    expect(screen.getByText('Principal local').nextElementSibling?.firstElementChild?.textContent).toBe(
      'Pas lu',
    );
    expect(screen.queryByText(source.commit!.slice(0, 12))).toBeNull();
    expect(screen.queryByText(source.baseCommit!.slice(0, 12))).toBeNull();
    expect(screen.queryByText(source.mainRemoteCommit!.slice(0, 12))).toBeNull();
    expect(screen.queryByText(/Correspond à/)).toBeNull();
  });

  it('recognizes matching hashes even without comparison counts', async () => {
    await show({ commit: source.mainCommit }, 'fr', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: source.mainCommit!,
    });
    expect(screen.getByRole('status', { name: 'cindy-personnel · À jour' })).toBeTruthy();
    expect(screen.getByText("Correspond à Principal GitHub, 0 changement d'enregistrement derrière")).toBeTruthy();
  });

  it('does not claim different hashes match because of inconsistent zero counts', async () => {
    await show({ personalAhead: 0, personalBehind: 0 }, 'fr', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: 'e'.repeat(40),
      ahead: 0,
      behind: 0,
    });
    expect(screen.getByRole('status', { name: 'cindy-personnel · État de la version non vérifié' })).toBeTruthy();
    expect(screen.getByText('SHA différent du principal local ; différence inconnue')).toBeTruthy();
    expect(screen.getByText('Comparaison principale locale indisponible')).toBeTruthy();
    expect(screen.queryByText(/Correspond à/)).toBeNull();
  });

  it('shows a gray local SHA pointing to the green online SHA on the same row', async () => {
    const { container } = await show({}, 'fr', {
      status: 'ready',
      channel: 'dev',
      ref: 'main',
      commit: 'e'.repeat(40),
      ahead: 0,
      behind: 3,
    });
    const local = screen.getByTitle(source.mainCommit!);
    const online = screen.getByTitle('e'.repeat(40));
    expect(local.closest('[class*="--status-success"]')).toBeNull();
    expect(local.closest('[class*="--text-secondary"]')).not.toBeNull();
    expect(online.closest('[class*="--status-success"]')).not.toBeNull();
    expect(online.closest('dd')).toBe(local.closest('dd'));
    expect(local.closest('dd')?.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('dl > div > dd')).toHaveLength(2);
    expect(screen.getByText('Le principal local est 3 enregistrements de modifications derrière')).toBeTruthy();
  });

  it.each(Object.keys(locales) as (keyof typeof locales)[])(
    'renders translated personal differences without unresolved text in %s',
    async (locale) => {
      const { container } = await show({ personalAhead: 1, personalBehind: 0 }, locale);
      expect(screen.getByRole('status').getAttribute('aria-label')).toBe(
        `${locales[locale].cindyMake.overview.personal} · ${locales[locale].cindyMake.overview.personalStatus.unverified}`,
      );
      expect(
        screen.getByText(
          locales[locale].cindyMake.overview.comparison.personalAhead.replace('{{ahead}}', '1'),
        ),
      ).toBeTruthy();
      expect(container.textContent).not.toMatch(/cindyMake\.|\{\{|\?\?|�/);
    },
  );
});
