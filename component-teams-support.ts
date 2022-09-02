import { Component, Product, Team } from './bugzilla-support';

import { Bugzilla } from './bugzilla';

/**
 * ComponentTeamMap uses a `${product}::${component}` string to be the key
 * in a lookup map.
 */
export type FullComponent = string & { __full_component: true };

export type Components = Record<FullComponent, Team>;

export type Teams = Record<
  Team,
  Array<[product: Product, component: Component]>
>;

/**
 * Private interface for ComponentTeamMap which defines the cache file layout
 */
export interface CacheData {
  readonly teams: Teams;
  readonly components: Components;
}

export interface CreateOptions {
  readonly bugzilla: Bugzilla;
  readonly cacheFilename: string;
  readonly useNetwork: boolean;
  readonly debug?: boolean;
}
