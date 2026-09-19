// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { createAppPanelsLayoutStorage } from './createAppPanelsLayoutStorage';

describe('createAppPanelsLayoutStorage', () => {
  it('reads and writes under the app storage prefix without the group id', () => {
    localStorage.clear();
    const storage = createAppPanelsLayoutStorage('app.panels', 'app-panels');
    const libraryKey = 'react-resizable-panels:app-panels:sidebar:graph';
    const layout = JSON.stringify({ sidebar: 20, graph: 80 });

    storage.setItem(libraryKey, layout);

    expect(localStorage.getItem('app.panels:sidebar:graph')).toBe(layout);
    expect(storage.getItem(libraryKey)).toBe(layout);
  });

  it('uses different keys for different panel combinations', () => {
    localStorage.clear();
    const storage = createAppPanelsLayoutStorage('app.panels', 'app-panels');
    const twoPanels = 'react-resizable-panels:app-panels:sidebar:graph';
    const threePanels = 'react-resizable-panels:app-panels:sidebar:graph:dependencies';

    storage.setItem(twoPanels, JSON.stringify({ sidebar: 20, graph: 80 }));
    storage.setItem(threePanels, JSON.stringify({ sidebar: 15, graph: 50, dependencies: 35 }));

    expect(storage.getItem(twoPanels)).toBe(JSON.stringify({ sidebar: 20, graph: 80 }));
    expect(storage.getItem(threePanels)).toBe(JSON.stringify({ sidebar: 15, graph: 50, dependencies: 35 }));
    expect(localStorage.getItem('app.panels:sidebar:graph')).toBe(JSON.stringify({ sidebar: 20, graph: 80 }));
    expect(localStorage.getItem('app.panels:sidebar:graph:dependencies')).toBe(
      JSON.stringify({ sidebar: 15, graph: 50, dependencies: 35 }),
    );
  });
});
