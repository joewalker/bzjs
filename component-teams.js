// @ts-check

import { promises as pfs } from 'fs';

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
  static async createFromBugzilla(bugzilla) {
    const teamList = await bugzilla.getTeams();

    /** @type {Components} */
    const components = {};

    /** @type {Teams} */
    const teams = {};

    for (const team of teamList) {
      const reply = await bugzilla.getComponentsForTeam(team);
      const productMap = reply[team];
      const productNames = /** @type {Array<Product>} */ (
        Object.keys(productMap)
      );
      for (const productName of productNames) {
        for (const component of productMap[productName]) {
          const fullComponentName = /** @type {FullComponent} */ (
            `${productName}::${component}`
          );
          components[fullComponentName] = team;

          if (teams[team] == null) {
            teams[team] = [];
          }
          teams[team].push([productName, component]);
        }
      }
    }

    return new ComponentTeamMap(components, teams);
  }

  /**
   * @param {string} filename
   * @returns {Promise<ComponentTeamMap>}
   */
  static async createFromCache(filename) {
    const raw = await pfs.readFile(filename, 'utf8');
    const { components, teams } = /** @type {CacheData} */ (JSON.parse(raw));
    return new ComponentTeamMap(components, teams);
  }

  /**
   * @param {CreateOptions} options
   */
  static async create(options) {
    const { bugzilla, cacheFilename, debug, useNetwork } = options;

    /** @type {ComponentTeamMap} */
    let componentTeamMap;

    if (useNetwork) {
      if (debug) {
        console.log('Querying bugzilla for the component/team map...');
      }
      componentTeamMap = await ComponentTeamMap.createFromBugzilla(bugzilla);
      await componentTeamMap.writeToCache(cacheFilename);
    } else {
      if (debug) {
        console.log(`Reading component/team cache at ${cacheFilename}`);
      }
      componentTeamMap = await ComponentTeamMap.createFromCache(cacheFilename);
    }

    if (debug) {
      console.log(`-> Found ${Object.keys(componentTeamMap).length} mappings`);
    }
    return componentTeamMap;
  }

  /** @type {Components} */
  #components;

  /** @type {Teams} */
  #teams;

  /**
   * @param {Components} components
   * @param {Teams} teams
   */
  constructor(components, teams) {
    this.#components = components;
    this.#teams = teams;
  }

  /**
   * @param {string} product
   * @param {string} component
   * @returns {string | undefined}
   */
  getTeamForComponent(product, component) {
    return this.#components[
      /** @type {FullComponent} */ (`${product}::${component}`)
    ];
  }

  /**
   * @param {Team} team
   * @returns {ReadonlyArray<[product: Product, component: Component]>}
   */
  getComponentsForTeam(team) {
    return this.#teams[team];
  }

  /**
   * @returns {ReadonlyArray<Team>}
   */
  getTeams() {
    // @ts-expect-error The TS definition of Object.keys is poor
    return Object.keys(this.#teams);
  }

  /**
   * @param {string} filename
   * @returns {Promise<void>}
   */
  async writeToCache(filename) {
    const cacheData = this.toJSON();
    const output = JSON.stringify(cacheData, null, '  ');
    await pfs.writeFile(filename, output);
  }

  /**
   * @returns {CacheData}
   */
  toJSON() {
    return {
      components: this.#components,
      teams: this.#teams,
    };
  }
}
