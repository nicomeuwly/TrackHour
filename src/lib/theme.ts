// Settings.theme lives in IndexedDB, which is only readable asynchronously after
// hydration. A synchronous localStorage mirror lets an inline <head> script set the
// theme class before first paint, avoiding a flash of the wrong theme.
export const THEME_STORAGE_KEY = 'trackhour-theme';

export function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the class is still applied.
  }
}

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.add(t)}catch(e){}})()`;
