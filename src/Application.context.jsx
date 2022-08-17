import { BehaviorSubject, combineLatest, tap, map, delay, shareReplay, switchMap, take, expand, reduce, EMPTY, catchError, of } from "rxjs";
import { ajax } from "rxjs/ajax";
import { GraphEndpoints } from "@Environment/Graph.environment";
import * as _ from 'underscore';
import { MondayService } from "@Services/Monday.service";
import { FirebaseService } from "./Services/Firebase.service";

const PrimaryColors = {
    'Projects' : '#008577',
    'default' : 'gray'
}

export const ApplicationState = {
    User: null,
    MyBoards: null,
    PrimaryColor: 'gray',
    Titles: [],
    AllUsers: null,
    Photo: null,
    ProgressMessage: 'Logging in User...'
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

    static _progressMessage$ = new BehaviorSubject('Logging in User...');
    static ProgressMessage$ = ApplicationObservables._progressMessage$.asObservable().pipe(shareReplay(1));

    static User$ = combineLatest(
            [ApplicationObservables.AuthAccount$, ApplicationObservables.AuthToken$]
        ).pipe(
        switchMap(([account, token]) => account && token ? 
            ajax.get(GraphEndpoints.me, {Authorization: 'Bearer ' + token}).pipe(
                map(result => result.response)    
            )
            : EMPTY
        ),
        take(1),
        shareReplay(1)
    );

    static AllUsers$ = ApplicationObservables.AuthToken$.pipe(
        switchMap(token => token? of(token) : EMPTY),
        switchMap(token => ajax.get(GraphEndpoints.users, {Authorization: 'Bearer ' + token}).pipe(
            catchError(t => {
                console.log(t)
                return EMPTY
            }),
            expand((result, i) => result.response['@odata.nextLink'] ? 
                ajax.get(result.response['@odata.nextLink'], {Authorization: 'Bearer ' + token}) : EMPTY),
            reduce((acc, result) => {
                return acc.concat(result.response.value);
                }, []),
            )
        ),
        map(users => _.filter(users, u => !!u.givenName && !!u.surname && !!u.mail)),
        map(users => _.filter(users,
            u => u.mail.indexOf('liquidanimation.com') > 0)),
        map(users => users.map(u => ({...u, 
            mail: u.mail.toLowerCase(), 
            initials: u.displayName.split(' ').map(n => n[0]).join('')
        }))),
        switchMap(graphUsers => MondayService.AllUsers$().pipe(
            tap(t => console.log("MONDAY USERS")),
            map(mondayUsers => (
                {monday: _.groupBy(mondayUsers, (u) => u.name.toLowerCase()),
                 graph: _.groupBy(graphUsers, (u) => u.displayName.toLowerCase())
                })),
            take(1)
        )),
        map(({monday, graph}) =>  _.reduce(Object.keys(monday), (acc, name) => {
            if (graph[name])
                acc[name] = {graph: graph[name][0], monday: monday[name][0]}
            return acc;
        }, {})),
        tap(t => console.log("All Users", t)),
        shareReplay(1)
    )

    static MondayUser$ = combineLatest([ApplicationObservables.User$, ApplicationObservables.AllUsers$]).pipe(
        switchMap(([user, allUsers]) => {
            if (!user || !allUsers) return EMPTY;
            ApplicationObservables._progressMessage$.next('Retrieving Monday Identity...');

            const result = allUsers[user.displayName.toLowerCase()];
            if (!result || !result.monday) return EMPTY;

            return of(result.monday);
        }),
        shareReplay(1)
    )

    static MyBoards$ = ApplicationObservables.MondayUser$.pipe(
        switchMap(user => {
            if (!user) return EMPTY;
            ApplicationObservables._progressMessage$.next('Retrieving Board Subscriptions...');

            return FirebaseService.MyBoards$(user.id);
        }),
        tap(t => ApplicationObservables._progressMessage$.next(null)),
        take(1)
    )



    static SetAuthToken = (token) => {
        ApplicationObservables._authToken$.next(token)
    };
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

        case 'AllUsers' : 
            return { ...state,
                AllUsers: action.value
            }

        case 'MyBoards' : 
            return {...state,
                MyBoards: action.value 
            }

        case 'User' : 
            return { ...state, 
                User: action.value
            }

        case 'ProgressMessage': 
            return { ...state, 
                ProgressMessage: action.value
            }

        case 'Photo' : 
            return { ...state, 
                Photo: action.value 
            }

        default: {
            console.log('Application State -- Error -- Could not find Action: ' + action);
            break;
        }
    }
}