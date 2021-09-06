import { Bug } from './bugzilla-support';

// Taken from https://app.quicktype.io/


// To parse this data:
//
//   import { Convert, Bug } from "./file";
//
//   const welcome = Convert.toBug(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toBug(json: string): Bug {
        return cast(JSON.parse(json), r("Bug"));
    }

    public static welcomeToJson(value: Bug): string {
        return JSON.stringify(uncast(value, r("Bug")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Bug": o([
        { json: "qa_contact", js: "qaContact", typ: "" },
        { json: "id", js: "id", typ: 0 },
        { json: "creator_detail", js: "creatorDetail", typ: r("Detail") },
        { json: "summary", js: "summary", typ: "" },
        { json: "assigned_to", js: "assignedTo", typ: "" },
        { json: "target_milestone", js: "targetMilestone", typ: "" },
        { json: "cf_fx_points", js: "cfFxPoints", typ: r("CF") },
        { json: "cf_status_thunderbird_esr91", js: "cfStatusThunderbirdEsr91", typ: r("CF") },
        { json: "is_creator_accessible", js: "isCreatorAccessible", typ: true },
        { json: "cf_tracking_firefox92", js: "cfTrackingFirefox92", typ: r("CF") },
        { json: "platform", js: "platform", typ: r("Platform") },
        { json: "cf_crash_signature", js: "cfCrashSignature", typ: "" },
        { json: "depends_on", js: "dependsOn", typ: a(0) },
        { json: "whiteboard", js: "whiteboard", typ: "" },
        { json: "cf_tracking_firefox_esr78", js: "cfTrackingFirefoxEsr78", typ: r("CF") },
        { json: "see_also", js: "seeAlso", typ: a("") },
        { json: "cf_fx_iteration", js: "cfFxIteration", typ: r("CF") },
        { json: "cf_tracking_firefox_esr91", js: "cfTrackingFirefoxEsr91", typ: r("CF") },
        { json: "cf_qa_whiteboard", js: "cfQAWhiteboard", typ: r("CFQAWhiteboard") },
        { json: "cf_status_firefox_esr91", js: "cfStatusFirefoxEsr91", typ: r("CFStatusEnum") },
        { json: "is_open", js: "isOpen", typ: true },
        { json: "regressed_by", js: "regressedBy", typ: a(0) },
        { json: "component", js: "component", typ: "" },
        { json: "cf_has_str", js: "cfHasStr", typ: r("CF") },
        { json: "severity", js: "severity", typ: "" },
        { json: "alias", js: "alias", typ: null },
        { json: "cf_tracking_firefox93", js: "cfTrackingFirefox93", typ: r("CF") },
        { json: "duplicates", js: "duplicates", typ: a(0) },
        { json: "cf_tracking_firefox_relnote", js: "cfTrackingFirefoxRelnote", typ: r("CF") },
        { json: "cf_root_cause", js: "cfRootCause", typ: r("CF") },
        { json: "cf_status_firefox_esr78", js: "cfStatusFirefoxEsr78", typ: r("CFStatusEnum") },
        { json: "cf_rank", js: "cfRank", typ: null },
        { json: "mentors", js: "mentors", typ: a("any") },
        { json: "votes", js: "votes", typ: 0 },
        { json: "cf_status_firefox92", js: "cfStatusFirefox92", typ: r("CFStatusEnum") },
        { json: "cf_last_resolved", js: "cfLastResolved", typ: Date },
        { json: "version", js: "version", typ: "" },
        { json: "cf_user_story", js: "cfUserStory", typ: "" },
        { json: "comment_count", js: "commentCount", typ: 0 },
        { json: "cf_status_thunderbird_esr78", js: "cfStatusThunderbirdEsr78", typ: r("CF") },
        { json: "cf_a11y_review_project_flag", js: "cfA11YReviewProjectFlag", typ: r("CF") },
        { json: "is_confirmed", js: "isConfirmed", typ: true },
        { json: "cf_tracking_firefox94", js: "cfTrackingFirefox94", typ: r("CF") },
        { json: "is_cc_accessible", js: "isCcAccessible", typ: true },
        { json: "cf_webcompat_priority", js: "cfWebcompatPriority", typ: r("Priority") },
        { json: "priority", js: "priority", typ: r("Priority") },
        { json: "assigned_to_detail", js: "assignedToDetail", typ: r("Detail") },
        { json: "cf_fission_milestone", js: "cfFissionMilestone", typ: r("CF") },
        { json: "mentors_detail", js: "mentorsDetail", typ: a("any") },
        { json: "regressions", js: "regressions", typ: a(0) },
        { json: "cf_tracking_thunderbird_esr78", js: "cfTrackingThunderbirdEsr78", typ: r("CF") },
        { json: "flags", js: "flags", typ: a(r("Flag")) },
        { json: "cf_has_regression_range", js: "cfHasRegressionRange", typ: r("CF") },
        { json: "creation_time", js: "creationTime", typ: Date },
        { json: "cf_tracking_firefox_sumo", js: "cfTrackingFirefoxSumo", typ: r("CF") },
        { json: "blocks", js: "blocks", typ: a(0) },
        { json: "groups", js: "groups", typ: a("any") },
        { json: "url", js: "url", typ: "" },
        { json: "cc_detail", js: "ccDetail", typ: a(r("Detail")) },
        { json: "cf_tracking_thunderbird_esr91", js: "cfTrackingThunderbirdEsr91", typ: r("CF") },
        { json: "creator", js: "creator", typ: "" },
        { json: "last_change_time", js: "lastChangeTime", typ: Date },
        { json: "resolution", js: "resolution", typ: "" },
        { json: "type", js: "type", typ: r("Type") },
        { json: "dupe_of", js: "dupeOf", typ: u(0, null) },
        { json: "keywords", js: "keywords", typ: a("") },
        { json: "status", js: "status", typ: r("Status") },
        { json: "cf_status_firefox93", js: "cfStatusFirefox93", typ: r("CFStatusEnum") },
        { json: "classification", js: "classification", typ: r("Classification") },
        { json: "op_sys", js: "opSys", typ: "" },
        { json: "product", js: "product", typ: r("Product") },
        { json: "cf_status_firefox94", js: "cfStatusFirefox94", typ: r("CF") },
        { json: "cc", js: "cc", typ: a("") },
        { json: "cf_status_firefox78", js: "cfStatusFirefox78", typ: u(undefined, "") },
        { json: "cf_status_firefox_esr68", js: "cfStatusFirefoxEsr68", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox75", js: "cfStatusFirefox75", typ: u(undefined, "") },
        { json: "cf_status_firefox74", js: "cfStatusFirefox74", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox73", js: "cfStatusFirefox73", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox76", js: "cfStatusFirefox76", typ: u(undefined, "") },
        { json: "cf_tracking_firefox75", js: "cfTrackingFirefox75", typ: u(undefined, "") },
        { json: "cf_status_firefox83", js: "cfStatusFirefox83", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox68", js: "cfStatusFirefox68", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox52", js: "cfStatusFirefox52", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox57", js: "cfStatusFirefox57", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_tracking_firefox87", js: "cfTrackingFirefox87", typ: u(undefined, "") },
        { json: "cf_status_firefox87", js: "cfStatusFirefox87", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox90", js: "cfStatusFirefox90", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_tracking_firefox89", js: "cfTrackingFirefox89", typ: u(undefined, "") },
        { json: "cf_status_firefox89", js: "cfStatusFirefox89", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox91", js: "cfStatusFirefox91", typ: u(undefined, "") },
        { json: "cf_status_firefox86", js: "cfStatusFirefox86", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox85", js: "cfStatusFirefox85", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox62", js: "cfStatusFirefox62", typ: u(undefined, r("CFStatusEnum")) },
        { json: "cf_status_firefox63", js: "cfStatusFirefox63", typ: u(undefined, r("CFStatusEnum")) },
    ], false),
    "Detail": o([
        { json: "name", js: "name", typ: "" },
        { json: "email", js: "email", typ: "" },
        { json: "nick", js: "nick", typ: "" },
        { json: "real_name", js: "realName", typ: "" },
        { json: "id", js: "id", typ: 0 },
    ], false),
    "Flag": o([
        { json: "id", js: "id", typ: 0 },
        { json: "status", js: "status", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "creation_date", js: "creationDate", typ: Date },
        { json: "modification_date", js: "modificationDate", typ: Date },
        { json: "requestee", js: "requestee", typ: u(undefined, "") },
        { json: "setter", js: "setter", typ: "" },
        { json: "type_id", js: "typeID", typ: 0 },
    ], false),
    "CF": [
        "---",
        "yes",
    ],
    "CFQAWhiteboard": [
        "",
        "qa-not-actionable",
        "[qa-triaged]",
    ],
    "CFStatusEnum": [
        "affected",
        "---",
        "wontfix",
        "unaffected",
        "fixed",
    ],
    "Priority": [
        "--",
        "P1",
        "P2",
        "P3",
    ],
    "Classification": [
        "Components",
    ],
    "Platform": [
        "All",
        "Desktop",
        "Unspecified",
        "x86_64",
    ],
    "Product": [
        "Core",
    ],
    "Status": [
        "ASSIGNED",
        "REOPENED",
        "RESOLVED",
        "VERIFIED",
    ],
    "Type": [
        "defect",
        "enhancement",
        "task",
    ],
};
