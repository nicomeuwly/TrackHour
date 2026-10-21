import { describe, it, expect, afterEach, vi } from 'vitest';
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, applyTheme } from './theme';

function stubBrowser({ stored, systemDark }: { stored: string | null; systemDark: boolean }) {
  const classes = new Set<string>();
  const storage = new Map<string, string>(stored === null ? [] : [[THEME_STORAGE_KEY, stored]]);
  const classList = {
    add: (c: string) => classes.add(c),
    remove: (...cs: string[]) => cs.forEach(c => classes.delete(c)),
  };
  vi.stubGlobal('document', { documentElement: { classList } });
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  });
  vi.stubGlobal('window', { matchMedia: () => ({ matches: systemDark }) });
  return { classes, storage };
}

function runInitScript() {
  new Function(THEME_INIT_SCRIPT)();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('THEME_INIT_SCRIPT', () => {
  it('applies the stored theme even when it differs from the system preference', () => {
    const { classes } = stubBrowser({ stored: 'light', systemDark: true });
    runInitScript();
    expect([...classes]).toEqual(['light']);
  });

  it('falls back to the system preference when nothing is stored', () => {
    const { classes } = stubBrowser({ stored: null, systemDark: true });
    runInitScript();
    expect([...classes]).toEqual(['dark']);
  });

  it('ignores an invalid stored value', () => {
    const { classes } = stubBrowser({ stored: 'sepia', systemDark: false });
    runInitScript();
    expect([...classes]).toEqual(['light']);
  });

  it('does not throw when storage is unavailable', () => {
    stubBrowser({ stored: null, systemDark: false });
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); } });
    expect(runInitScript).not.toThrow();
  });
});

describe('applyTheme', () => {
  it('replaces the theme class and mirrors it to storage for the next load', () => {
    const { classes, storage } = stubBrowser({ stored: 'light', systemDark: false });
    classes.add('light');
    applyTheme('dark');
    expect([...classes]).toEqual(['dark']);
    expect(storage.get(THEME_STORAGE_KEY)).toBe('dark');
  });
});
