import fetch from 'node-fetch';
import { format } from 'date-fns';

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
 * This full list of bug fields is way too large, so we copy across the ones we
 * need.
 * @see bug-field.js
 * @type {Record<string, BugFieldEnum>}
 */
export const BugField = Object.freeze({
  status: 'bug_status',
  webcompatPriority: 'cf_webcompat_priority',
});

/**
 * The ways we do matching for advanced searches
 * @type {Record<string, MatchTypeEnum>}
 */
export const MatchType = Object.freeze({
  /** is equal to */
  equals: 'equals',
  /** is not equal to */
  notequals: 'notequals',
  /** is equal to any of the strings */
  anyexact: 'anyexact',
  /** contains the string */
  substring: 'substring',
  /** contains the string (exact case) */
  casesubstring: 'casesubstring',
  /** does not contain the string */
  notsubstring: 'notsubstring',
  /** contains any of the strings */
  anywordssubstr: 'anywordssubstr',
  /** contains all of the strings */
  allwordssubstr: 'allwordssubstr',
  /** contains none of the strings */
  nowordssubstr: 'nowordssubstr',
  /** matches regular expression */
  regexp: 'regexp',
  /** does not match regular expression */
  notregexp: 'notregexp',
  /** is less than */
  lessthan: 'lessthan',
  /** is less than or equal to */
  lessthaneq: 'lessthaneq',
  /** is greater than */
  greaterthan: 'greaterthan',
  /** is greater than or equal to */
  greaterthaneq: 'greaterthaneq',
  /** contains any of the words */
  anywords: 'anywords',
  /** contains all of the words */
  allwords: 'allwords',
  /** contains none of the words */
  nowords: 'nowords',
  /** ever changed */
  everchanged: 'everchanged',
  /** changed before */
  changedbefore: 'changedbefore',
  /** changed after */
  changedafter: 'changedafter',
  /** changed from */
  changedfrom: 'changedfrom',
  /** changed to */
  changedto: 'changedto',
  /** changed by */
  changedby: 'changedby',
  /** matches */
  matches: 'matches',
  /** does not match */
  notmatches: 'notmatches',
  /** is empty */
  isempty: 'isempty',
  /** is not empty */
  isnotempty: 'isnotempty',
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
   * @returns {Promise<{ readonly bugs: ReadonlyArray<Bug> }>}
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

    if (params.change != null) {
      bzParams.push([ 'chfield', params.change.field ]);
      bzParams.push([ 'chfieldfrom', format(params.change.from, 'yyyy-MM-dd') ]);
      bzParams.push([ 'chfieldto', format(params.change.to, 'yyyy-MM-dd') ]);
      bzParams.push([ 'chfieldvalue', params.change.value ]);
    }

    if (params.advanced != null) {
      for (let i = 0; i < params.advanced.length; i++) {
        bzParams.push([ `f${i + 1}`, params.advanced[i].field ]);
        bzParams.push([ `o${i + 1}`, params.advanced[i].matchType ]);
        bzParams.push([ `v${i + 1}`, params.advanced[i].value ]);
      }
      bzParams.push([ 'query_format', 'advanced' ]);
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

    if (params.dryRun) {
      return { bugs: [] };
    }
    else {
      const response = await fetch(url, {
        headers,
      });

      // @ts-expect-error
      return response.json();
    }
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
