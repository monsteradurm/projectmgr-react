import { BehaviorSubject, combineLatest, tap, map, of, shareReplay, switchMap, take, expand, reduce, EMPTY } from "rxjs";
import { ajax } from "rxjs/ajax";
import { GraphEndpoints } from "@Environment/Graph.environment";
import * as _ from 'underscore';
import { MondayService } from "@Services/Monday.service";

const PrimaryColors = {
    'Projects' : '#008577',
    'default' : 'gray'
}

export const ApplicationState = {
    User: null,
    PrimaryColor: 'gray',
    Titles: [],
    AllUsers: null,
    Photo: null,
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
            : EMPTY
        ),
        take(1),
        shareReplay(1)
    );

    static AllUsers$ = ApplicationObservables.AuthToken$.pipe(
        switchMap(token => ajax.get(GraphEndpoints.users, {Authorization: 'Bearer ' + token}).pipe(
            expand((result, i) => result.response['@odata.nextLink'] ? 
                ajax.get(result.response['@odata.nextLink'], {Authorization: 'Bearer ' + token}) : EMPTY),
            reduce((acc, result) => {
                return acc.concat(result.response.value);
                }, []),
            )
        ),
        map(users => _.filter(users, u => u.givenName && u.surname && u.mail)),
        map(users => _.filter(users,
            u => u.mail.indexOf('liquidanimation.com') > 0)),
        map(users => users.map(u => ({...u, 
            mail: u.mail.toLowerCase(), 
            initials: u.displayName.split(' ').map(n => n[0]).join('')
        }))),
        switchMap(graphUsers => MondayService.AllUsers$().pipe(
            map(mondayUsers => {
                const monday = _.groupBy(mondayUsers, (u) => u.name.toLowerCase());
                const graph = _.groupBy(graphUsers, (u) => u.displayName.toLowerCase());
                return _.reduce(Object.keys(monday), (acc, name) => {
                    if (graph[name])
                        acc[name] = {graph: graph[name][0], monday: monday[name][0]}
                    return acc;
                }, {})
            })
        )),
    )

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

        case 'AllUsers' : 
            return { ...state,
                AllUsers: action.value
            }
        case 'User' : 
            return { ...state, 
                User: action.value
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