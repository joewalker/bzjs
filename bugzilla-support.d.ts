export interface BugzillaConstructorOptions {
  readonly origin?: string;
  readonly apiKey?: string;
}

export type BugStatusEnum =
  | 'UNCONFIRMED'
  | 'NEW'
  | 'ASSIGNED'
  | 'REOPENED'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED';

export type BugFieldEnum = 'bug_status' | 'cf_webcompat_priority';

export type MatchTypeEnum =
  | 'equals'
  | 'notequals'
  | 'anyexact'
  | 'substring'
  | 'casesubstring'
  | 'notsubstring'
  | 'anywordssubstr'
  | 'allwordssubstr'
  | 'nowordssubstr'
  | 'regexp'
  | 'notregexp'
  | 'lessthan'
  | 'lessthaneq'
  | 'greaterthan'
  | 'greaterthaneq'
  | 'anywords'
  | 'allwords'
  | 'nowords'
  | 'everchanged'
  | 'changedbefore'
  | 'changedafter'
  | 'changedfrom'
  | 'changedto'
  | 'changedby'
  | 'matches'
  | 'notmatches'
  | 'isempty'
  | 'isnotempty';

/**
 * @see index.js#search
 */
export interface SearchParams {
  /**
   * Write the queries to stdout just before they're sent
   */
  readonly logQuery?: boolean;

  /**
   * Don't actually query bugzilla, instead return an empty set
   */
  readonly dryRun?: boolean;

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
   * For advanced searches
   * TODO: We can AND/OR these searches, but there is no syntax for that
   */
  readonly advanced?: ReadonlyArray<{
    readonly field: BugFieldEnum;
    readonly matchType: MatchTypeEnum;
    readonly value: string;
  }>;
}

export interface Bug {
  qaContact: string;
  id: number;
  creatorDetail: Detail;
  summary: string;
  assignedTo: string;
  targetMilestone: string;
  cfFxPoints: CF;
  cfStatusThunderbirdEsr91: CF;
  isCreatorAccessible: boolean;
  cfTrackingFirefox92: CF;
  platform: Platform;
  cfCrashSignature: string;
  dependsOn: number[];
  whiteboard: string;
  cfTrackingFirefoxEsr78: CF;
  seeAlso: string[];
  cfFxIteration: CF;
  cfTrackingFirefoxEsr91: CF;
  cfQAWhiteboard: CFQAWhiteboard;
  cfStatusFirefoxEsr91: CFStatusEnum;
  isOpen: boolean;
  regressedBy: number[];
  component: string;
  cfHasStr: CF;
  severity: string;
  alias: null;
  cfTrackingFirefox93: CF;
  duplicates: number[];
  cfTrackingFirefoxRelnote: CF;
  cfRootCause: CF;
  cfStatusFirefoxEsr78: CFStatusEnum;
  cfRank: null;
  mentors: any[];
  votes: number;
  cfStatusFirefox92: CFStatusEnum;
  cfLastResolved: Date;
  version: string;
  cfUserStory: string;
  commentCount: number;
  cfStatusThunderbirdEsr78: CF;
  cfA11YReviewProjectFlag: CF;
  isConfirmed: boolean;
  cfTrackingFirefox94: CF;
  isCcAccessible: boolean;
  cfWebcompatPriority: Priority;
  priority: Priority;
  assignedToDetail: Detail;
  cfFissionMilestone: CF;
  mentorsDetail: any[];
  regressions: number[];
  cfTrackingThunderbirdEsr78: CF;
  flags: Flag[];
  cfHasRegressionRange: CF;
  creationTime: Date;
  cfTrackingFirefoxSumo: CF;
  blocks: number[];
  groups: any[];
  url: string;
  ccDetail: Detail[];
  cfTrackingThunderbirdEsr91: CF;
  creator: string;
  lastChangeTime: Date;
  resolution: string;
  type: Type;
  dupeOf: number | null;
  keywords: string[];
  status: Status;
  cfStatusFirefox93: CFStatusEnum;
  classification: Classification;
  opSys: string;
  product: Product;
  cfStatusFirefox94: CF;
  cc: string[];
  cfStatusFirefox78?: string;
  cfStatusFirefoxEsr68?: CFStatusEnum;
  cfStatusFirefox75?: string;
  cfStatusFirefox74?: CFStatusEnum;
  cfStatusFirefox73?: CFStatusEnum;
  cfStatusFirefox76?: string;
  cfTrackingFirefox75?: string;
  cfStatusFirefox83?: CFStatusEnum;
  cfStatusFirefox68?: CFStatusEnum;
  cfStatusFirefox52?: CFStatusEnum;
  cfStatusFirefox57?: CFStatusEnum;
  cfTrackingFirefox87?: string;
  cfStatusFirefox87?: CFStatusEnum;
  cfStatusFirefox90?: CFStatusEnum;
  cfTrackingFirefox89?: string;
  cfStatusFirefox89?: CFStatusEnum;
  cfStatusFirefox91?: string;
  cfStatusFirefox86?: CFStatusEnum;
  cfStatusFirefox85?: CFStatusEnum;
  cfStatusFirefox62?: CFStatusEnum;
  cfStatusFirefox63?: CFStatusEnum;
}

export interface Detail {
  name: string;
  email: string;
  nick: string;
  realName: string;
  id: number;
}

export enum CF {
  Empty = '---',
  Yes = 'yes',
}

export enum CFQAWhiteboard {
  Empty = '',
  QANotActionable = 'qa-not-actionable',
  QATriaged = '[qa-triaged]',
}

export enum CFStatusEnum {
  Affected = 'affected',
  Empty = '---',
  Wontfix = 'wontfix',
  Unaffected = 'unaffected',
  Fixed = 'fixed',
}

export enum Priority {
  Empty = '--',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

export enum Classification {
  Components = 'Components',
}

export interface Flag {
  id: number;
  status: string;
  name: string;
  creationDate: Date;
  modificationDate: Date;
  requestee?: string;
  setter: string;
  typeID: number;
}

export enum Platform {
  All = 'All',
  Desktop = 'Desktop',
  Unspecified = 'Unspecified',
  X8664 = 'x86_64',
}

export enum Product {
  Core = 'Core',
}

export enum Status {
  Assigned = 'ASSIGNED',
  Reopened = 'REOPENED',
  Resolved = 'RESOLVED',
  Verified = 'VERIFIED',
}

export enum Type {
  Defect = 'defect',
  Enhancement = 'enhancement',
  Task = 'task',
}
