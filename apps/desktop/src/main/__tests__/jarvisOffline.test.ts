import { afterEach, describe, expect, it } from 'vitest';

import { parseClientEndpointManifest } from '@cindy/maker-shared/client-endpoints';

import { buildJarvisOfflineManifestText, isJarvisOffline } from '../jarvisOffline';

describe('jarvisOffline', () => {
  const original = process.env.JARVIS_CLOUD;
  afterEach(() => {
    if (original === undefined) delete process.env.JARVIS_CLOUD;
    else process.env.JARVIS_CLOUD = original;
  });

  it('is offline unless JARVIS_CLOUD=1', () => {
    delete process.env.JARVIS_CLOUD;
    expect(isJarvisOffline()).toBe(true);
    process.env.JARVIS_CLOUD = '0';
    expect(isJarvisOffline()).toBe(true);
    process.env.JARVIS_CLOUD = '1';
    expect(isJarvisOffline()).toBe(false);
  });

  it('builds a manifest where every service endpoint is blank', () => {
    const parsed = parseClientEndpointManifest(buildJarvisOfflineManifestText('global'), {
      expectedRegion: 'global',
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.region).toBe('global');
    for (const value of Object.values(parsed.endpoints)) expect(value).toBe('');
  });
});
