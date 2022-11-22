import { bind, SUSPENSE } from "@react-rxjs/core";
import { BehaviorSubject, combineLatest, of, EMPTY, catchError, distinctUntilChanged, from, scan, merge, combineLatestWith, debounceTime, withLatestFrom } from "rxjs";
import { switchMap, take, map, tap, concatMap } from "rxjs";
import { MondayService } from "@Services/Monday.service";
import { FirebaseService } from "@Services/Firebase.service";

import * as UserService from "@Services/User.service";
import * as _ from 'underscore';
import { combineKeys, createSignal, partitionByKey } from "@react-rxjs/utils";

export const [BoardWebhooksChanged$, SetBoardWebhooks] = createSignal(n => n);

export const [useBoardWebhooks, BoardWebhooks$] = bind(
    BoardWebhooksChanged$, null
)
export const FetchWebhooks = (boardId) => {
    MondayService.Webhooks$(boardId).subscribe((res) => SetBoardWebhooks(res));
}

const FromMapping = (id, searchParams, setSearchParams) => {
    const current = searchParams.get('From');
    if (current != id) {
        searchParams.set('From', id)
        setSearchParams(searchParams);
    }
    return id;
}
const ToMapping = (id, searchParams, setSearchParams) => {
    const current = searchParams.get('To');
    if (current != id) {
        searchParams.set('To', id)
        setSearchParams(searchParams);
    }
    return id;
}
export const [WebhookFromBoardIdChanged$, SetWebhookFromBoardId] = createSignal(FromMapping);
export const [useWebhookFromBoardId, WebhookFromBoardId$] = bind(
    WebhookFromBoardIdChanged$, ''
)
export const [WebhookToBoardIdChanged$, SetWebhookToBoardId] = createSignal(ToMapping);
export const [useWebhookToBoardId, WebhookToBoardId$] = bind(
    WebhookToBoardIdChanged$, ''
)


MondayService.Webhooks$("3525971132").subscribe((res) => {
    const hooks = _.map(res, r => {
        const event = r.event;
        let config = r.config;
        return {event, config, url: ""}
    });

    console.log(hooks);
    FirebaseService.StoreWebhooks$({Hooks: hooks}).pipe(take(1)).subscribe(console.log)

});