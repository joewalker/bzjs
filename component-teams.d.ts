/**
 * @typedef {import('./bugzilla-support').Component} Component
 * @typedef {import('./bugzilla-support').Product} Product
 * @typedef {import('./bugzilla-support').Team} Team
 * @typedef {import('./bugzilla').Bugzilla} Bugzilla
 * @typedef {import('./component-teams-support').CacheData} CacheData
 * @typedef {import('./component-teams-support').Components} Components
 * @typedef {import('./component-teams-support').CreateOptions} CreateOptions
 * @typedef {import('./component-teams-support').FullComponent} FullComponent
 * @typedef {import('./component-teams-support').Teams} Teams
 */
/**
 *
 */
export class ComponentTeamMap {
    /**
     * @param {Bugzilla} bugzilla
     * @returns {Promise<ComponentTeamMap>}
     */
    static createFromBugzilla(bugzilla: Bugzilla): Promise<ComponentTeamMap>;
    /**
     * @param {string} filename
     * @returns {Promise<ComponentTeamMap>}
     */
    static createFromCache(filename: string): Promise<ComponentTeamMap>;
    /**
     * @param {CreateOptions} options
     */
    static create(options: CreateOptions): Promise<ComponentTeamMap>;
    /**
     * @param {Components} components
     * @param {Teams} teams
     */
    constructor(components: Components, teams: Teams);
    /**
     * @param {string} product
     * @param {string} component
     * @returns {string | undefined}
     */
    getTeamForComponent(product: string, component: string): string | undefined;
    /**
     * @param {Team} team
     * @returns {ReadonlyArray<[product: Product, component: Component]>}
     */
    getComponentsForTeam(team: Team): ReadonlyArray<[product: Product, component: Component]>;
    /**
     * @returns {ReadonlyArray<Team>}
     */
    getTeams(): ReadonlyArray<Team>;
    /**
     * @param {string} filename
     * @returns {Promise<void>}
     */
    writeToCache(filename: string): Promise<void>;
    /**
     * @returns {CacheData}
     */
    toJSON(): CacheData;
    #private;
}
export type Component = import('./bugzilla-support').Component;
export type Product = import('./bugzilla-support').Product;
export type Team = import('./bugzilla-support').Team;
export type Bugzilla = import('./bugzilla').Bugzilla;
export type CacheData = import('./component-teams-support').CacheData;
export type Components = import('./component-teams-support').Components;
export type CreateOptions = import('./component-teams-support').CreateOptions;
export type FullComponent = import('./component-teams-support').FullComponent;
export type Teams = import('./component-teams-support').Teams;
