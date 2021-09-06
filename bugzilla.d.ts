/**
 * bugzilla.d.ts is generated from bugzilla.js
 */
/**
 * @typedef {import('./bugzilla-support.js').BugzillaConstructorOptions} BugzillaConstructorOptions
 * @typedef {import('./bugzilla-support.js').BugStatusEnum} BugStatusEnum
 * @typedef {import('./bugzilla-support.js').BugFieldEnum} BugFieldEnum
 * @typedef {import('./bugzilla-support.js').SearchParams} SearchParams
 * @typedef {import('./bugzilla-support.js').Bug} Bug
 */
/**
 * @type {BugStatusEnum}
 */
export const BugStatus: BugStatusEnum;
/**
 * @type {BugFieldEnum}
 */
export const BugField: BugFieldEnum;
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
     * @returns {Promise<ReadonlyArray<Bug>>}
     */
    search(params: SearchParams): Promise<ReadonlyArray<Bug>>;
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
export type BugzillaConstructorOptions = import('./bugzilla-support.js').BugzillaConstructorOptions;
export type BugStatusEnum = import('./bugzilla-support.js').BugStatusEnum;
export type BugFieldEnum = import('./bugzilla-support.js').BugFieldEnum;
export type SearchParams = import('./bugzilla-support.js').SearchParams;
export type Bug = import('./bugzilla-support.js').Bug;
