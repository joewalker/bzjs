/**
 * @typedef {import('./bugzilla-support').Bug} Bug
 * @typedef {import('./bugzilla-support').BugFieldEnum} BugFieldEnum
 * @typedef {import('./bugzilla-support').BugStatusEnum} BugStatusEnum
 * @typedef {import('./bugzilla-support').BugzillaConstructorOptions} BugzillaConstructorOptions
 * @typedef {import('./bugzilla-support').ComponentsForTeam} ComponentsForTeam
 * @typedef {import('./bugzilla-support').CountResults} CountResults
 * @typedef {import('./bugzilla-support').MatchTypeEnum} MatchTypeEnum
 * @typedef {import('./bugzilla-support').SearchParams} SearchParams
 * @typedef {import('./bugzilla-support').SearchResults} SearchResults
 * @typedef {import('./bugzilla-support').Team} Team
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
    apiKey: string | undefined;
    /**
     * @param {SearchParams} params
     * @returns {Promise<SearchResults>}
     */
    search(params: SearchParams): Promise<SearchResults>;
    /**
     * @param {SearchParams} params
     * @returns {Promise<CountResults>}
     */
    count(params: SearchParams): Promise<CountResults>;
    /**
     * Here we collect the search parameters as bugzilla wants them (as opposed
     * to the input which is as we want to specify them) but they're not
     * formatted for transmission over the internet (urlencoded, etc). Using an
     * array of tuples instead of an object allows repeated params
     * @param {SearchParams} params
     * @returns {Array<[ key: string, value: string ]>}
     */
    buildQuery(params: SearchParams): Array<[key: string, value: string]>;
    /**
     * @returns {Promise<ReadonlyArray<Team>>}
     */
    getTeams(): Promise<ReadonlyArray<Team>>;
    /**
     * @param {string} team
     * @returns {Promise<ComponentsForTeam>}
     */
    getComponentsForTeam(team: string): Promise<ComponentsForTeam>;
}
export type Bug = import('./bugzilla-support').Bug;
export type BugFieldEnum = import('./bugzilla-support').BugFieldEnum;
export type BugStatusEnum = import('./bugzilla-support').BugStatusEnum;
export type BugzillaConstructorOptions = import('./bugzilla-support').BugzillaConstructorOptions;
export type ComponentsForTeam = import('./bugzilla-support').ComponentsForTeam;
export type CountResults = import('./bugzilla-support').CountResults;
export type MatchTypeEnum = import('./bugzilla-support').MatchTypeEnum;
export type SearchParams = import('./bugzilla-support').SearchParams;
export type SearchResults = import('./bugzilla-support').SearchResults;
export type Team = import('./bugzilla-support').Team;
