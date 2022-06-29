import { BehaviorSubject, from, of, shareReplay, switchMap, take, map, tap, combineLatest, EMPTY } from "rxjs"

import { GraphEndpoints, OAuthScopes } from "../Environment/Graph";
import { ajax } from 'rxjs/ajax';

export class UserService {
    
    static _authToken$ = new BehaviorSubject(null);
    static AuthToken$ = UserService._authToken$.asObservable().pipe(shareReplay(1));

    static _authAccount$ = new BehaviorSubject(null);
    static AuthAccount$ = UserService._authAccount$.asObservable().pipe(shareReplay(1));

    static SetAuthToken(token) { UserService._authToken$.next(token); }
    static SetAuthAccount(account) { UserService._authAccount$.next(account); }

    static AuthenticationInProgress = false;
    
    static User$ = combineLatest([UserService.AuthAccount$, UserService.AuthToken$]).pipe(
        switchMap(([account, token]) => account && token ? 
            ajax.get(GraphEndpoints.me, {Authorization: 'Bearer ' + token}).pipe(
                map(result => result.response)    
            )
            : of(null) 
        ),
        shareReplay(1)
    );

}