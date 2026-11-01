// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarFilterPopover } from '../SidebarFilterPopover';
import type { UseSidebarFilterReturn } from '../../hooks/useSidebarFilter';
import translations from '@/i18n/locales/fr/common.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      const value = key
        .split('.')
        .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], translations);
      return String(value ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
        String(values?.[name] ?? ''),
      );
    },
  }),
}));
vi.mock('@/components/ui/tooltip', () => ({
  Tip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/hooks/useSidebarCardMode', () => ({
  useSidebarMainViewMode: () => ({ mode: 'list', setMode: vi.fn() }),
}));
vi.mock('../../hooks/useTaskInfoFields', () => ({
  useTaskInfoFields: () => ({ fields: ['pr'], toggleField: vi.fn() }),
}));
vi.mock('@/features/device-link/useMachineSwitcher', () => ({
  useEffectiveSelectedMachineId: () => 'all',
}));
vi.mock('../../hooks/useRemoteHostProjectOrders', () => ({
  useLocalHostProjectOrder: () => ({ snapshot: undefined }),
  useRemoteHostProjectOrders: () => ({ orders: new Map() }),
  projectOrderWriteScopeForSelection: () => ({ kind: 'viewer' }),
  controllerManualOrderForDevice: () => [],
}));
vi.mock('@cindy/maker-shared/project-order-sync', () => ({
  resolveDisplayedProjectOrder: (_scope: unknown, _snapshot: unknown, viewer: unknown) => viewer,
  projectOrderWriteLedger: () => 'viewer',
}));

function makeFilter(overrides: Partial<UseSidebarFilterReturn> = {}): UseSidebarFilterReturn {
  return {
    creators: 'all',
    creatorOptions: [],
    toggleCreator: vi.fn(),
    setCreatorsAll: vi.fn(),
    setCreatorsNone: vi.fn(),
    status: 'active',
    projects: 'all',
    projectsAsSet: null,
    vendor: 'all',
    lastActivity: 'all',
    groupBy: 'project',
    groupDialogue: true,
    groupDevice: true,
    sortBy: 'priority',
    projectOrder: 'activity',
    manualProjectOrder: [],
    isFilterActive: true,
    setVendor: vi.fn(),
    setStatus: vi.fn(),
    setSortBy: vi.fn(),
    resetContentFilters: vi.fn(),
    ...overrides,
  } as UseSidebarFilterReturn;
}
function Preview({ filter, remote = true }: { filter: UseSidebarFilterReturn; remote?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <SidebarFilterPopover
      filter={filter}
      allKnownProjects={[]}
      hasRemoteDevices={remote}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
async function openSubmenu(name: RegExp) {
  const trigger = screen.getByRole('menuitem', { name });
  fireEvent.keyDown(trigger, { key: 'ArrowRight' });
  return await screen.findByRole('menu', { name });
}
beforeEach(() => {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: { platform: 'darwin' },
  });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe('sidebar display settings menu', () => {
  it('does not enumerate project menu rows while closed, and uses fresh props on open', async () => {
    const projects = [] as NonNullable<
      React.ComponentProps<typeof SidebarFilterPopover>['allKnownProjects']
    >;
    const enumerate = vi.spyOn(projects, 'map');
    const filter = makeFilter();
    const { rerender } = render(
      <SidebarFilterPopover filter={filter} allKnownProjects={projects} open={false} />,
    );
    rerender(
      <SidebarFilterPopover filter={{ ...filter }} allKnownProjects={projects} open={false} />,
    );
    expect(enumerate).not.toHaveBeenCalled();
    rerender(<SidebarFilterPopover filter={filter} allKnownProjects={projects} open />);
    expect(enumerate).toHaveBeenCalled();
    const submenu = await openSubmenu(/^Tri de session/);
    fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Temps de création' }));
    expect(filter.setSortBy).toHaveBeenCalledWith('created');
  });

  it('presents seven summarized parent rows with icons, and three direct task sorting choices', async () => {
    const filter = makeFilter();
    render(<Preview filter={filter} />);
    const root = screen.getByRole('menu');
    const rows = within(root).getAllByRole('menuitem');
    expect(rows.map((row) => row.querySelector('span')?.textContent)).toEqual([
      'Regrouper par',
      'Tri de session',
      'Tri des projets',
      'Statut de la session',
      'Filtres',
      'Affichage',
      'Informations sur la séance',
    ]);
    for (const row of rows) expect(row.querySelector('svg')).not.toBeNull();
    expect(rows[3].querySelector('.lucide-list-checks')).not.toBeNull();
    expect(rows[0].textContent).toContain('Projet, Discuter, Appareil');
    expect(rows[2].textContent).toContain('Suivre les séances');
    const submenu = await openSubmenu(/^Tri de session/);
    // PR #6196: preserve the historical glass-menu clipping regression through
    // real unit DOM containment; content/click assertions alone miss a lost portal.
    expect(root.contains(submenu)).toBe(false);
    expect(document.body.contains(submenu)).toBe(true);
    expect(
      within(submenu)
        .getAllByRole('menuitem')
        .map((row) => row.textContent),
    ).toEqual(['Priorité', 'Activité récente', 'Temps de création']);
    fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Temps de création' }));
    expect(filter.setSortBy).toHaveBeenCalledWith('created');
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    expect(within(submenu).getByRole('menuitem', { name: 'Temps de création' })).not.toBeNull();
    const statusMenu = await openSubmenu(/^Statut de la session/);
    expect(
      within(statusMenu)
        .getByRole('menuitem', { name: 'Actif' })
        .querySelector('.lucide-circle-dot'),
    ).not.toBeNull();
  });

  it('keeps status independent from content filters and exposes a selectable Pi harness', async () => {
    const filter = makeFilter({ status: 'archived' });
    render(<Preview filter={filter} />);
    const submenu = await openSubmenu(/^Filtres/);
    expect(within(submenu).queryByText('Statut de la session')).toBeNull();
    expect(
      within(submenu).getByRole('menuitem', { name: 'Réinitialiser les filtres' }).getAttribute('data-disabled'),
    ).not.toBeNull();
    const harness = await openSubmenu(/^Harnais/);
    expect(
      within(harness)
        .getAllByRole('menuitem')
        .map((row) => row.textContent),
    ).toEqual(['Tout', 'Claude Code', 'Codex', 'Pi']);
    fireEvent.click(within(harness).getByRole('menuitem', { name: 'Pi' }));
    expect(filter.setVendor).toHaveBeenCalledWith('pi');
    expect(screen.getAllByRole('menu').length).toBeGreaterThan(1);
  });

  it('marks the trigger with a dot only while the list shows archived tasks', () => {
    // Dash 反馈:切到「已归档」后列表和平常几乎一样,误以为内容没更新。
    // 「全部」不提醒,所以不能用 status !== 'active' 代替。
    const dot = (status: 'active' | 'archived' | 'all') => {
      const { unmount } = render(
        <SidebarFilterPopover filter={makeFilter({ status })} allKnownProjects={[]} open={false} />,
      );
      const trigger = screen.getByRole('button', { name: /^Paramètres de la barre latérale/ });
      const found = trigger.querySelector('span[aria-hidden]') !== null;
      unmount();
      return found;
    };
    expect([dot('active'), dot('archived'), dot('all')]).toEqual([false, true, false]);
  });

  it('hides unavailable grouping choices and their summary without clearing saved device preference', async () => {
    const filter = makeFilter({ groupBy: 'flat' });
    render(<Preview filter={filter} remote={false} />);
    expect(screen.queryByRole('menuitem', { name: /^Tri des projets/ })).toBeNull();
    expect(screen.getByRole('menuitem', { name: /^Regrouper par/ }).textContent).toBe('Regrouper parDiscuter');
    const group = await openSubmenu(/^Regrouper par/);
    expect(
      within(group)
        .getAllByRole('menuitem')
        .map((row) => row.textContent),
    ).toEqual(['Projet', 'Discuter']);
    expect(filter.groupDevice).toBe(true);
  });
});

it('keeps the creator submenu open for multiple selections and exposes an all reset', async () => {
  const filter = makeFilter({ creators: ['[null,"a"]'], creatorOptions: [
    { id: 'a', name: 'Dash', avatar: '', avatarColor: 'blue' },
    { id: 'a', name: 'Dash', deviceId: 'remote', deviceName: 'Laptop', avatar: '', avatarColor: 'blue' },
  ] });
  render(<Preview filter={filter} />);
  await openSubmenu(/^Filtres/);
  const submenu = await openSubmenu(/^Coéquipiers/);
  expect(within(submenu).getByRole('menuitemcheckbox', { name: 'Dash' }).getAttribute('aria-checked')).toBe('true');
  fireEvent.click(within(submenu).getByRole('menuitemcheckbox', { name: 'Dash Laptop' }));
  expect(filter.toggleCreator).toHaveBeenCalledWith('["remote","a"]');
  expect(screen.getAllByRole('menu')).toHaveLength(3);
  fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Tout' }));
  expect(filter.setCreatorsAll).toHaveBeenCalledOnce();
  fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Tout cacher' }));
  expect(filter.setCreatorsNone).toHaveBeenCalledOnce();
});
