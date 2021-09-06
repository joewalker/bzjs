
export interface BugzillaConstructorOptions {
  readonly origin?: string;
  readonly apiKey?: string;
}

export interface BugStatusEnum {
  readonly unconfirmed: 'UNCONFIRMED',
  readonly new: 'NEW',
  readonly assigned: 'ASSIGNED',
  readonly reopened: 'REOPENED',
  readonly resolved: 'RESOLVED',
  readonly verified: 'VERIFIED',
  readonly closed: 'CLOSED',
}

export interface BugFieldEnum {
  readonly status: 'bug_status',
}

/**
 * @see index.js#search
 */
export interface SearchParams {
  /**
   * This is an 'OR' criteria so any of these keywords must match
   */
  readonly components?: ReadonlyArray<string>;

  /**
   * This is an 'OR' criteria so any of these keywords must match
   */
  readonly bugStatus?: ReadonlyArray<BugStatusEnum>;

  /**
   * Detecting changes in bugs
   */
  readonly change?: {
    readonly field: BugFieldEnum;
    readonly from: Date;
    readonly to: Date;
    readonly value: string;
  };

  /**
   * This is an 'OR' criteria so any of these keywords must match
   */
  readonly keywords?: ReadonlyArray<string>;

  /**
   * Restrict the search to a single product (component names can be
   * duplicated across different products (e.g. 'Untriaged'))
   */
  readonly product?: string;

  /**
   *
   */
  readonly assignedTo?: string;

  /**
   * console.log the URL just before we send it
   */
  readonly logQuery?: boolean;
}

export interface Bug {
  readonly id: string;
}
