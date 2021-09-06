/**
 * bugzilla.d.ts is generated from bugzilla.js
 */
/**
 * @typedef {import('./bugzilla-support.js').BugzillaConstructorOptions} BugzillaConstructorOptions
 * @typedef {import('./bugzilla-support.js').BugStatusEnum} BugStatusEnum
 * @typedef {import('./bugzilla-support.js').BugFieldEnum} BugFieldEnum
 * @typedef {import('./bugzilla-support.js').MatchTypeEnum} MatchTypeEnum
 * @typedef {import('./bugzilla-support.js').SearchParams} SearchParams
 * @typedef {import('./bugzilla-support.js').Bug} Bug
 */
/**
 * @type {Record<string, BugStatusEnum>}
 */
export const BugStatus: Record<string, BugStatusEnum>;
/**
 * This full list of bug fields is way too large, so we copy across the ones we
 * need.
 * @see bug-field.js
 * @type {Record<string, BugFieldEnum>}
 */
export const BugField: Record<string, BugFieldEnum>;
/**
 * The ways we do matching for advanced searches
 * @type {Record<string, MatchTypeEnum>}
 */
export const MatchType: Record<string, MatchTypeEnum>;
/**
 * The real implementation
 */
export class Bugzilla {
  /**
   * @param {BugzillaConstructorOptions} options
   */
  constructor(options?: BugzillaConstructorOptions);
  origin: string;
  apiKey: string;
  /**
   * @param {SearchParams} params
   * @returns {Promise<{ readonly bugs: ReadonlyArray<Bug> }>}
   */
  search(params: SearchParams): Promise<{
    readonly bugs: ReadonlyArray<Bug>;
  }>;
  /**
   * @returns {Promise<ReadonlyArray<string>>}
   */
  getTeams(): Promise<ReadonlyArray<string>>;
  /**
   * @param {string} team
   * @returns {Promise<{}>}
   */
  getComponentsForTeam(team: string): Promise<{}>;
}
export type BugzillaConstructorOptions =
  import('./bugzilla-support.js').BugzillaConstructorOptions;
export type BugStatusEnum = import('./bugzilla-support.js').BugStatusEnum;
export type BugFieldEnum = import('./bugzilla-support.js').BugFieldEnum;
export type MatchTypeEnum = import('./bugzilla-support.js').MatchTypeEnum;
export type SearchParams = import('./bugzilla-support.js').SearchParams;
export type Bug = import('./bugzilla-support.js').Bug;
