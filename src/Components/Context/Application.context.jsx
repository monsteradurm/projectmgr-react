import { BehaviorSubject, combineLatest, map, of, shareReplay, switchMap } from "rxjs";
import { ajax } from "rxjs/ajax";
import { GraphEndpoints } from "../../Environment/Graph.environment";

const PrimaryColors = {
    'Projects' : '#008577',
    'default' : 'gray'
}

export const ApplicationState = {
    PrimaryColor: 'gray',
    Titles: [],
    User: null
}

export class ApplicationObservables {
    static _Titles$ = new BehaviorSubject([]);
    static Titles$ = ApplicationObservables._Titles$.asObservable().pipe(shareReplay(1));

    static _PrimaryColor$ = new BehaviorSubject(PrimaryColors['default']);
    static PrimaryColor$ =  ApplicationObservables._PrimaryColor$.asObservable().pipe(shareReplay(1));

    static _authToken$ = new BehaviorSubject(null);
    static AuthToken$ = ApplicationObservables._authToken$.asObservable().pipe(shareReplay(1));

    static _authAccount$ = new BehaviorSubject(null);
    static AuthAccount$ = ApplicationObservables._authAccount$.asObservable().pipe(shareReplay(1));

    static User$ = combineLatest(
            [ApplicationObservables.AuthAccount$, ApplicationObservables.AuthToken$]
        ).pipe(
        switchMap(([account, token]) => account && token ? 
            ajax.get(GraphEndpoints.me, {Authorization: 'Bearer ' + token}).pipe(
                map(result => result.response)    
            )
            : of(null) 
        ),
        shareReplay(1)
    );

    static SetAuthToken = (token) => ApplicationObservables._authToken$.next(token);
    static SetAuthAccount = (account) => ApplicationObservables._authAccount$.next(account); 
    static SetPrimaryColor = (page) => ApplicationObservables._PrimaryColor$.next(
        PrimaryColors[page] ? PrimaryColors[page] : PrimaryColors['default']
    );
    static SetTitles = (titles) => ApplicationObservables._Titles$.next(titles);
}

export const DispatchApplicationState = (state, action) => {
    switch(action.type) {
        case 'Titles' : 
            return { ...state, 
                Titles: action.value
                }
        case 'PrimaryColor' : 
            return { ...state, 
                PrimaryColor: action.value
                }
        case 'User' : 
            return { ...state, 
                User: action.value
                }
        default: {
            console.log('Application State -- Error -- Could not find Action: ' + action);
            break;
        }
    }
}