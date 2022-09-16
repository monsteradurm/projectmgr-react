
import { createSignal, partitionByKey } from "@react-rxjs/utils";
import { bind, SUSPENSE } from "@react-rxjs/core"
import { map, switchMap, take, tap, debounceTime, delay } from "rxjs/operators";
import { BehaviorSubject, combineLatest, EMPTY, merge, of, scan } from "rxjs";
import _ from "underscore";
import { ReadyOrSuspend$ } from "./Helpers/Context.helper";

/*
*   Message Queue Observables, used to display messages across
*       loading screens
*/

export const [addMessageEvent$, AddQueueMessage] = createSignal((id,key,message) => ({id, key, message, event: 'Add'}));
export const [removeMessageEvent$, RemoveQueueMessage] = createSignal((id, key) => ({id, key, event: 'Remove'}));

// store messages by calling id, such as component
export const [MessageQueueById, MessageQueueIds$] = partitionByKey(
    merge(addMessageEvent$, removeMessageEvent$),
    (evt) => evt.id,
    (q$, id) => q$.pipe(
        scan((acc, {message, key, event}) => event === 'Add' ? 
            [...acc, {key, message}] : [...acc.filter(m => m.key !== key)], []),
    )
)

// retrieve the message queue by id
export const [, MessageQueue$] = bind(
    id => 
    MessageQueueIds$.pipe(
        switchMap(ids => {
            if (ids.indexOf(id) >= 0)
                return MessageQueueById(id)
            return of(null);
        })
    ), SUSPENSE
)

// retrieve the top message (oldest)
export const [useBusyMessage, ] = bind(
    id => 
    MessageQueue$(id).pipe(
        map(messages => messages?.length ? messages[0] : null),
    ), null
)

