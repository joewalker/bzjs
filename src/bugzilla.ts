import type { BugFieldValue } from './bug-fields.js';
import { toResponseFieldName } from './bug-fields.js';
import type {
  AttachmentReply,
  Bug,
  BugCommentsReply,
  BugReply,
  BugzillaConstructorOptions,
  CountResult,
  QueryParam,
  QueryParams,
  SearchParams,
  SearchResult,
} from './bugzilla-types.js';
export { BugField } from './bug-fields.js';
export { BugStatus, MatchType } from './bugzilla-literals.js';
export {
  CF,
  CFQAWhiteboard,
  CFStatus,
  Classification,
  Platform,
  Priority,
  Product,
  Type,
} from './bugzilla-literals.js';

/**
 * Formats a Date as 'yyyy-MM-dd' for Bugzilla query parameters.
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Construct a single Bugzilla query parameter tuple.
 */
function createQueryParam(key: string, value: string): QueryParam {
  return [key, value];
}

/**
 * Append repeated query parameters using the same key.
 */
function appendRepeatedQueryParams(
  queryParams: Array<QueryParam>,
  key: string,
  values: ReadonlyArray<string>,
): void {
  for (const value of values) {
    queryParams.push(createQueryParam(key, value));
  }
}

/**
 * Append the selected Bugzilla fields for bug endpoints.
 */
function appendBugFieldSelection(
  queryParams: Array<QueryParam>,
  bugFields: ReadonlyArray<BugFieldValue> | undefined,
): void {
  if (bugFields == null || bugFields.length === 0) {
    return;
  }

  const responseNames = bugFields.map(toResponseFieldName);
  queryParams.push(createQueryParam('include_fields', responseNames.join(',')));
}

/**
 * Append fields that should be omitted from an API response.
 */
function appendFieldExclusion(
  queryParams: Array<QueryParam>,
  excludeFields: ReadonlyArray<string> | undefined,
): void {
  if (excludeFields == null || excludeFields.length === 0) {
    return;
  }

  queryParams.push(createQueryParam('exclude_fields', excludeFields.join(',')));
}

/** An HTTP error returned by the Bugzilla REST API. */
export class BugzillaApiError extends Error {
  readonly status: number;

  /** Create an error with the response status and user-facing message. */
  constructor(status: number, message: string) {
    super(message);
    this.name = 'BugzillaApiError';
    this.status = status;
  }
}

/**
 * The real implementation
 */
export class Bugzilla {
  readonly origin: string;
  readonly #apiKey: string | undefined;

  /**
   *
   */
  constructor(options: BugzillaConstructorOptions = {}) {
    const { origin = 'https://bugzilla.mozilla.org', apiKey } = options;

    this.origin = origin;
    this.#apiKey = apiKey;
  }

  /**
   *
   */
  async getBug(
    id: number,
    options: QueryParams & { readonly bugFields: ReadonlyArray<BugFieldValue> },
  ): Promise<Partial<Bug>>;
  async getBug(id: number, options?: QueryParams): Promise<Bug>;
  async getBug(id: number, options: QueryParams = {}): Promise<Partial<Bug>> {
    const queryParams: Array<QueryParam> = [];
    appendBugFieldSelection(queryParams, options.bugFields);
    appendFieldExclusion(queryParams, options.excludeFields);

    const reply = await this.#query<BugReply<Bug | Partial<Bug>>>(
      `/rest/bug/${id}`,
      queryParams,
      options.logQuery,
    );

    if (reply.bugs.length !== 1) {
      throw new Error(`Found ${reply.bugs.length} bugs matching ${id}`);
    }

    const [bug] = reply.bugs;
    if (bug == null) {
      throw new Error(`Found ${reply.bugs.length} bugs matching ${id}`);
    }

    return bug;
  }

  /**
   *
   */
  async comments(
    id: number,
    options: QueryParams = {},
  ): Promise<BugCommentsReply> {
    const queryParams: Array<QueryParam> = [];
    appendFieldExclusion(queryParams, options.excludeFields);
    return this.#query<BugCommentsReply>(
      `/rest/bug/${id}/comment`,
      queryParams,
      options.logQuery,
    );
  }

  /**
   *
   */
  async attachments(
    id: number,
    options: QueryParams = {},
  ): Promise<AttachmentReply> {
    const queryParams: Array<QueryParam> = [];
    appendFieldExclusion(queryParams, options.excludeFields);
    return this.#query<AttachmentReply>(
      `/rest/bug/${id}/attachment`,
      queryParams,
      options.logQuery,
    );
  }

  /**
   *
   */
  async search(
    params: SearchParams & {
      readonly bugFields: ReadonlyArray<BugFieldValue>;
    },
  ): Promise<SearchResult<Partial<Bug>>>;
  async search(params: SearchParams): Promise<SearchResult<Bug>>;
  async search(params: SearchParams): Promise<SearchResult<Partial<Bug>>> {
    /**
     * Here we collect the search parameters as bugzilla wants them (as opposed
     * to the input which is as we want to specify them) but they're not
     * formatted for transmission over the internet (urlencoded, etc). Using an
     * array of tuples instead of an object allows repeated params
     */
    const queryParams: Array<QueryParam> = [];

    if (params.product != null) {
      queryParams.push(createQueryParam('product', params.product));
    }

    appendBugFieldSelection(queryParams, params.bugFields);
    appendFieldExclusion(queryParams, params.excludeFields);

    if (params.components != null) {
      appendRepeatedQueryParams(queryParams, 'component', params.components);
    }

    if (params.ids != null) {
      appendRepeatedQueryParams(queryParams, 'id', params.ids.map(String));
    }

    if (params.bugStatus != null) {
      appendRepeatedQueryParams(queryParams, 'bug_status', params.bugStatus);
    }

    if (params.keywords != null) {
      queryParams.push(
        createQueryParam('keywords', params.keywords.join(', ')),
      );
      queryParams.push(createQueryParam('keywords_type', 'anywords'));
    }

    if (params.assignedTo != null) {
      queryParams.push(createQueryParam('email1', params.assignedTo));
      queryParams.push(createQueryParam('emailassigned_to1', '1'));
      queryParams.push(createQueryParam('emailtype1', 'exact'));
    }

    if (params.change != null) {
      queryParams.push(createQueryParam('chfield', params.change.field));
      queryParams.push(
        createQueryParam('chfieldfrom', formatDate(params.change.from)),
      );
      queryParams.push(
        createQueryParam('chfieldto', formatDate(params.change.to)),
      );
      queryParams.push(createQueryParam('chfieldvalue', params.change.value));
    }

    if (params.advanced != null) {
      for (let i = 0; i < params.advanced.length; i++) {
        queryParams.push(
          createQueryParam(`f${i + 1}`, params.advanced[i].field),
        );
        queryParams.push(
          createQueryParam(`o${i + 1}`, params.advanced[i].matchType),
        );
        queryParams.push(
          createQueryParam(`v${i + 1}`, params.advanced[i].value),
        );
      }
      queryParams.push(createQueryParam('query_format', 'advanced'));
    }

    if (params.bugSeverity != null) {
      appendRepeatedQueryParams(
        queryParams,
        'bug_severity',
        params.bugSeverity,
      );
    }

    if (params.limit != null) {
      queryParams.push(createQueryParam('limit', String(params.limit)));
    }

    if (params.offset != null) {
      queryParams.push(createQueryParam('offset', String(params.offset)));
    }

    const checkUrl = this.#checkUrl(queryParams);

    if (params.dryRun) {
      return { bugs: [], checkUrl };
    }

    const reply = await this.#query<BugReply<Bug | Partial<Bug>>>(
      `/rest/bug`,
      queryParams,
      params.logQuery,
    );
    return { bugs: reply.bugs, checkUrl };
  }

  /**
   * Count the number of bugs matching the given search parameters without
   * fetching the full bug records.
   */
  async count(params: SearchParams): Promise<CountResult> {
    const queryParams: Array<QueryParam> = [];

    if (params.product != null) {
      queryParams.push(createQueryParam('product', params.product));
    }

    if (params.components != null) {
      appendRepeatedQueryParams(queryParams, 'component', params.components);
    }

    if (params.ids != null) {
      appendRepeatedQueryParams(queryParams, 'id', params.ids.map(String));
    }

    if (params.bugStatus != null) {
      appendRepeatedQueryParams(queryParams, 'bug_status', params.bugStatus);
    }

    if (params.keywords != null) {
      queryParams.push(
        createQueryParam('keywords', params.keywords.join(', ')),
      );
      queryParams.push(createQueryParam('keywords_type', 'anywords'));
    }

    if (params.assignedTo != null) {
      queryParams.push(createQueryParam('email1', params.assignedTo));
      queryParams.push(createQueryParam('emailassigned_to1', '1'));
      queryParams.push(createQueryParam('emailtype1', 'exact'));
    }

    if (params.change != null) {
      queryParams.push(createQueryParam('chfield', params.change.field));
      queryParams.push(
        createQueryParam('chfieldfrom', formatDate(params.change.from)),
      );
      queryParams.push(
        createQueryParam('chfieldto', formatDate(params.change.to)),
      );
      queryParams.push(createQueryParam('chfieldvalue', params.change.value));
    }

    if (params.advanced != null) {
      for (let i = 0; i < params.advanced.length; i++) {
        queryParams.push(
          createQueryParam(`f${i + 1}`, params.advanced[i].field),
        );
        queryParams.push(
          createQueryParam(`o${i + 1}`, params.advanced[i].matchType),
        );
        queryParams.push(
          createQueryParam(`v${i + 1}`, params.advanced[i].value),
        );
      }
      queryParams.push(createQueryParam('query_format', 'advanced'));
    }

    if (params.bugSeverity != null) {
      appendRepeatedQueryParams(
        queryParams,
        'bug_severity',
        params.bugSeverity,
      );
    }

    queryParams.push(createQueryParam('count_only', 'true'));

    const checkUrl = this.#checkUrl(queryParams);

    if (params.dryRun) {
      return { bugCount: Number.POSITIVE_INFINITY, checkUrl };
    }

    const reply = await this.#query<{ bug_count: number }>(
      `/rest/bug`,
      queryParams,
      params.logQuery,
    );
    return { bugCount: reply.bug_count, checkUrl };
  }

  /**
   *
   */
  async getTeams(logQuery = false): Promise<ReadonlyArray<string>> {
    return this.#query<ReadonlyArray<string>>(
      `/rest/config/component_teams`,
      [],
      logQuery,
    );
  }

  /**
   *
   */
  async getComponentsForTeam(
    team: string,
    logQuery = false,
  ): Promise<Record<string, unknown>> {
    const encodedTeam = encodeURIComponent(team);
    return this.#query<Record<string, unknown>>(
      `/rest/config/component_teams/${encodedTeam}`,
      [],
      logQuery,
    );
  }

  /**
   * Build a buglist.cgi URL equivalent to the given query parameters,
   * useful for opening the same search in a browser.
   */
  #checkUrl(queryParams: ReadonlyArray<QueryParam>): string {
    const outputParams = queryParams.map(([key, value]) => {
      return `${key}=${encodeURIComponent(value)}`;
    });
    return `${this.origin}/buglist.cgi?${outputParams.join('&')}`;
  }

  /**
   * @param baseUrl This doesn't include any query parameters or the origin.
   * Example usage '/rest/bug'
   * @param queryParams This is the query parameters as bugzilla wants them
   * but they're not formatted for transmission over the internet (urlencoded,
   * etc). Using an array of tuples instead of an object allows repeated params
   */
  async #query<T = unknown>(
    baseUrl: string,
    queryParams: ReadonlyArray<QueryParam> = [],
    logQuery = false,
  ): Promise<T> {
    const outputParams = queryParams.map(([key, value]) => {
      return `${key}=${encodeURIComponent(value)}`;
    });
    const url = `${this.origin}${baseUrl}?${outputParams.join('&')}`;

    const headers: Record<string, string> = {};
    if (this.#apiKey != null) {
      headers['X-BUGZILLA-API-KEY'] = this.#apiKey;
    }

    if (logQuery) {
      // eslint-disable-next-line no-console
      console.log(url);
    }

    const response = await fetch(url, { headers });
    const text = await response.text();

    if (!response.ok) {
      let message = `Bugzilla API error ${response.status}`;
      try {
        const body = JSON.parse(text) as { error?: boolean; message?: string };
        if (body.message) {
          message += `: ${body.message}`;
        }
      } catch {
        if (text.length > 0) {
          message += `: ${text}`;
        }
      }
      throw new BugzillaApiError(response.status, message);
    }

    try {
      return JSON.parse(text) as T;
    } catch (ex) {
      console.error(text);
      throw ex;
    }
  }
}
