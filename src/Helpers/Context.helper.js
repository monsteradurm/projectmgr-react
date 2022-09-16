
// validate the paramaters of a function (param) are not suspended or null

import { SUSPENSE } from "@react-rxjs/core";
import { map, of, switchMap } from "rxjs";

// only switch to the observable if neither
export const ReadyOrSuspend$ = (param, $) => {
    return of(param).pipe(
        switchMap(r => {
            if (Array.isArray(r)) {
                if (param.filter(p => p === SUSPENSE).length)
                    return of(SUSPENSE);
                else if (param.filter(p => !p))
                    return of(null);
                return $(...param);
            } else {
                if (!r) return of(null);
                else if (r === SUSPENSE) return of(SUSPENSE);
                
                return $(param);
            }
        })
    )
}

export const FirstIfNotSecond = (first, second) => {
    if (first === SUSPENSE || second === SUSPENSE)
        return SUSPENSE;
    else if (!first && !second)
        return null;
    else if (!!second)
        return second;

    return first;
}

export const AttrOrSuspend = (obj, attr) => {
    if (obj === SUSPENSE) return SUSPENSE
    if (!obj) return null;
    if (!obj[attr]) return null;
    return obj[attr]
}
export const AttrOrSuspend$ = ($, attr) => $.pipe(
    map(obj => AttrOrSuspend(obj, attr))
)

export const CombineOrSuspend = (arr, parent) => {
    if (!parent) throw 'Cannot combine or suspend null: ' + JSON.stringify(arr);

    if (arr === SUSPENSE || parent === SUSPENSE) return SUSPENSE;

    if (!arr) return parent;

    return parent.concat(arr);
}