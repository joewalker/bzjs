import fetch from 'node-fetch';

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
export const BugStatus = Object.freeze({
  unconfirmed: 'UNCONFIRMED',
  new: 'NEW',
  assigned: 'ASSIGNED',
  reopened: 'REOPENED',
  resolved: 'RESOLVED',
  verified: 'VERIFIED',
  closed: 'CLOSED',
});

/**
 * @type {BugFieldEnum}
 */
export const BugField = Object.freeze({
  status: 'bug_status',
});

/**
 * The real implementation
 */
export class Bugzilla {
  /**
   * @param {BugzillaConstructorOptions} options
   */
  constructor(options = {}) {
    const {
      origin = 'https://bugzilla.mozilla.org',
      apiKey,
    } = options;

    this.origin = origin;
    this.apiKey = apiKey;
  }

  /**
   * @param {SearchParams} params
   * @returns {Promise<ReadonlyArray<Bug>>}
   */
  async search(params) {
    /**
     * Here we collect the search parameters as bugzilla wants them (as opposed
     * to the input which is as we want to specify them) but they're not
     * formatted for transmission over the internet (urlencoded, etc). Using an
     * array of tuples instead of an object allows repeated params
     * @type {Array<[ key: string, value: string ]>}
     */
    const bzParams = [
    ];

    if (params.product != null) {
      bzParams.push([ 'product', params.product ]);
    }

    if (params.components != null) {
      /** @type {Array<[ key: string, value: string ]>} */
      const x = params.components.map(value => ([ 'component', value ]));
      bzParams.push(...x);
    }

    if (params.bugStatus != null) {
      /** @type {Array<[ key: string, value: string ]>} */ // @ts-ignore-error
      const x = params.bugStatus.map(bugStatus => ([ 'bug_status', bugStatus ]));
      bzParams.push(...x);
    }

    if (params.keywords != null) {
      bzParams.push([ 'keywords', params.keywords.join(', ') ]);
      bzParams.push([ 'keywords_type', 'anywords' ]);
    }

    if (params.assignedTo != null) {
      bzParams.push([ 'email1', params.assignedTo ]);
      bzParams.push([ 'emailassigned_to1', '1' ]);
      bzParams.push([ 'emailtype1', 'exact' ]);
    }

    const outputParams = bzParams.map(([ key, value ]) => {
      return `${key}=${encodeURIComponent(value)}`;
    });
    const url = `${this.origin}/rest/bug?${outputParams.join('&')}`;

    const headers = [];
    if (this.apiKey != null) {
      headers.push([ 'X-BUGZILLA-API-KEY', this.apiKey ]);
    }

    if (params.logQuery) {
      console.log(url);
    }

    const response = await fetch(url, {
      headers,
    });

    // @ts-expect-error
    return response.json();
  }

  /**
   * @returns {Promise<ReadonlyArray<string>>}
   */
  async getTeams() {
    const url = `${this.origin}/rest/config/component_teams`;

    const headers = [];
    if (this.apiKey != null) {
      headers.push([ 'X-BUGZILLA-API-KEY', this.apiKey ]);
    }

    const response = await fetch(url, {
      headers,
    });

    // @ts-expect-error
    return response.json();
  }

  /**
   * @param {string} team
   * @returns {Promise<{}>}
   */
  async getComponentsForTeam(team) {
    const url = (
      `${this.origin}/rest/config/component_teams/${encodeURIComponent(team)}`
    );

    const headers = [];
    if (this.apiKey != null) {
      headers.push([ 'X-BUGZILLA-API-KEY', this.apiKey ]);
    }

    const response = await fetch(url, {
      headers,
    });

    return response.json();
  }
}
