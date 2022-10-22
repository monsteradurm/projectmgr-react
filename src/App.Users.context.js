import { bind, SUSPENSE } from "@react-rxjs/core";
import { BehaviorSubject, combineLatest, of, EMPTY, catchError, distinctUntilChanged, from, scan, merge, combineLatestWith, debounceTime, withLatestFrom } from "rxjs";
import { switchMap, take, map, tap, concatMap } from "rxjs";
import { MondayService } from "@Services/Monday.service";
import { FirebaseService } from "@Services/Firebase.service";

import * as UserService from "@Services/User.service";
import * as _ from 'underscore';
import { combineKeys, createSignal, partitionByKey } from "@react-rxjs/utils";
import { AddQueueMessage, RemoveQueueMessage } from "./App.MessageQueue.context";
import { APP_QID } from "./Application.component";

// --- Queue / Messages ---
const _M_LoggingInUser = ['user-login', 'Logging in User...'];
const _M_GetAllUsers = ['get-users', 'Retrieving All Users...'];

// --- Authentication ---
const _authenticationMap = (token, account) => ({ token, account });
const [AuthenticationChanged$, SetAuthentication] = createSignal(_authenticationMap);

const Authentication$ = bind(
    AuthenticationChanged$, null
).pop()

const AuthToken$ = bind(
    Authentication$.pipe(
        tap(console.log),
        map(auth => auth?.token ? auth.token : null)
    ), null
).pop()

const AuthAccount$ = bind(
    Authentication$.pipe(
        map(auth => auth?.account ? auth.account : null)
    ), null
).pop()

const standardizeName = (name) => {
    if (name.indexOf(' ') < 0)
        return name.toLowerCase();
    
    const nameArr = name
        .replace(/'/g, '')
        .toLowerCase()
        .replace('(', '')
        .replace(')', '')
        .split(' ');


    const first = nameArr.shift();
    const last = nameArr.pop();
    return first + " " + last;

}


// --- All Users in Account ---
const FetchAllUsers$ = AuthToken$.pipe(
    tap(() => AddQueueMessage(APP_QID, ..._M_GetAllUsers)),
    switchMap(token => token? of(token) : EMPTY),
    switchMap(token => UserService.FetchAllUsers$(token).pipe(take(1))),
    map(users => _.filter(users, u => !!u.givenName && !!u.surname && !!u.mail)),
    map(users => _.filter(users,
        u => u.mail.indexOf('liquidanimation.com') > 0 || 
        u.mail.indexOf('liquidanimationcom.onmicrosoft.com') > 0)),
    map(users => users.map(u => ({...u, 
        mail: u.mail.toLowerCase()
    }))),
    switchMap(graphUsers => MondayService.AllUsers$().pipe(
        map(mondayUsers => (
            {monday: _.groupBy(mondayUsers, (u) => standardizeName(u.name)),
             graph: _.groupBy(graphUsers, (u) => standardizeName(u.displayName))
            })),
        take(1)
    )),
    map(({monday, graph}) =>  _.reduce(Object.keys(monday), (acc, name) => {
        if (graph[name])
            acc[name] = {graph: graph[name][0], monday: monday[name][0]}
        return acc;
    }, {})),
    distinctUntilChanged((a, b) => JSON.stringify(a) !== JSON.stringify(b)),
    tap(allUsers => sessionStorage.setItem('AllUsers', JSON.stringify(allUsers))),
    tap(() => RemoveQueueMessage(APP_QID,_M_GetAllUsers[0])),
)

const [RecachedUsersEvent$, refreshUsersCache] = createSignal();

const [, OnCacheRefresh$] = bind(
    RecachedUsersEvent$.pipe(
        tap(() => sessionStorage.removeItem('AllUsers')),
        map(() => 'AllUsers')
    )
)

const [useAllUsers, AllUsers$] = bind(
    merge(of('AllUsers'), OnCacheRefresh$).pipe(
        switchMap(key => {
            console.log("Retrieving Cached User List...")
            const stored = sessionStorage.getItem(key);
            if (stored) {
                try {
                    const data = JSON.parse(stored);

                    console.log("Using Cached User List...")
                    return of(data);
                } catch { }
            }
            return FetchAllUsers$;
        }),
    )
    , SUSPENSE);

// --- User from full name ie. Nina Campbell

// partition users based on full name
const [useUserByName, UserByName$] = bind(
    (name) => 
    AllUsers$.pipe(
        map(allUsers => {
            if (name === SUSPENSE || allUsers === SUSPENSE)
                return SUSPENSE
            else if (!allUsers[name.toLowerCase()])
                return null;
            return allUsers[name.toLowerCase()];
        })
    ), SUSPENSE
)
const [useUserPhotoByName, UserPhotoByName$] = bind(
    (name) =>
    of(name).pipe(
        switchMap(name => {
            if (name === SUSPENSE)
                return of(SUSPENSE);
            else if (!name)
                return of(null);
            return UserByName$(name).pipe(
                map(user => {
                    if (user === SUSPENSE)
                        return SUSPENSE;
                    else if (user === null)
                        return null;
                    else if (!user?.graph?.id)
                        return null;
                    return user.graph.id;
                })
            )
        }),
        switchMap(id => {
            if (!id) return of(null);
            if (id === SUSPENSE) return of(SUSPENSE);
            return _allAvatars$.pipe(
                switchMap(allAvatars => {
                    if (allAvatars[id])
                        return of(allAvatars[id]);
                    
                        return AuthToken$.pipe(
                            switchMap(token => 
                                UserService.UserPhoto$(id, token).pipe(
                                    take(1),
                                    tap(avatar => {
                                       if (avatar) {
                                           const result = {...allAvatars};
                                           result[id] = avatar;
                                           _allAvatars$.next(result)
                                       }
                                   })
                                )
                            ),
                            catchError(err => of(null))
                        )
                })
            )
        })
    ), SUSPENSE
)

// --- Logged in User ---
const [useLoggedInUser, LoggedInUser$] = bind(
    Authentication$.pipe(
        switchMap((auth) => {
            if (!auth?.account || !auth?.token)
                return of(null);
            
            AddQueueMessage(APP_QID, ..._M_LoggingInUser)
            const key = auth.account.username;
            const stored = sessionStorage.getItem(key);

            if (stored) {
                try {
                const data = JSON.parse(stored);
                if (data) {
                    console.log("Retrieving Cached User...", data);
                    return of(data);
                }
                } catch {
                    console.log("Could not retrieve Cached User");
                 }
            }
            
            return UserService.Me$(auth).pipe(
                tap((me) => {
                    sessionStorage.setItem(key, JSON.stringify(me))
                })
            )
            }),
            tap(t => RemoveQueueMessage(APP_QID, _M_LoggingInUser[0]))
    ), null
)

// --- User Avatar Store ---
const _allAvatars$ = new BehaviorSubject({});

// --- Logged in User's Avatar ---
const [useMyAvatar, MyAvatar$] = bind(
    Authentication$.pipe(
        switchMap((auth) => auth?.token && auth?.account ? 
            of(auth) : EMPTY),

        // check if the user's avatar has already been stored
        switchMap((auth) => _allAvatars$.pipe(
                switchMap(avatars => avatars[auth.account.username] ?
                   of(avatars[auth.account.username]) :

                   // retrieve and store
                   UserService.UserPhoto$(auth.account.username, auth.token).pipe(
                       take(1),
                       tap(avatar => {
                           if (avatar) {
                               const result = {...avatars};
                               result[auth.account.username] = avatar;
                               _allAvatars$.next(result)
                           }
                       })
                   )
                ),
                take(1)
            )
        ),
    ), null
);

const [simulatedUserEvent$, SimulateUser] = createSignal((name, searchParams, setSearchParams) => {
    const result = name ? name.toLowerCase() : null;
    if (searchParams && setSearchParams) {
        if (!result)
            searchParams.delete('Simulating');
        else 
            searchParams.set('Simulating', name);
        setSearchParams(searchParams);
    }
    return result;
});

const [useSimulatedUser, SimulatedUser$] = bind(
    combineLatest([simulatedUserEvent$, AllUsers$]).pipe(
        map(([su, allUsers]) => su && allUsers[su] ? allUsers[su] : null),
        tap(t => console.log("Simulated User: ", t))
    ), null
)


// --- Logged in User's respective Monday Account details ---
const [useMondayUser, MondayUser$] = bind(
    combineLatest([LoggedInUser$, AllUsers$, SimulatedUser$]).pipe(
        switchMap(([user, allUsers, simUser]) => {
            if (!user || !allUsers) return EMPTY;
            const name = standardizeName(user.displayName);
            
            let result = allUsers[name];

            if (simUser?.monday?.name && allUsers[simUser.monday.name.toLowerCase()]) {
                result = allUsers[simUser.monday.name.toLowerCase()];
            }
            if (!result || !result.monday) return EMPTY;
            return of(result.monday);
        }),
    ), null
)


const [useManagers, Managers$] = bind(
    MondayService.ApplicationsTeam$, []
)

const [useApplicationTeam, ApplicationTeam$] = bind(
    MondayService.ManagementTeam$, []
)

const [useCanReviewApplications, ] = bind(
    combineLatest([LoggedInUser$, ApplicationTeam$]).pipe(
        map(([user, reviewers]) => {
            if (!user || !reviewers)
                return false;

            const u = user.displayName;
            const mgt = _.pluck(reviewers, 'name');
            return mgt.indexOf(u) >= 0
        }),
    ), false
)

const [useIsAdmin, IsAdmin$,] = bind(
    combineLatest([LoggedInUser$, Managers$]).pipe(
        map(([user, managers]) => {
            if (!user || !managers)
                return false;

            const u = user.displayName;
            const mgt = _.pluck(managers, 'name');
            return mgt.indexOf(u) >= 0
        }),
    ), false
)

const [, userIsAdmin$] = bind(
    user => Managers$.pipe(
        map(managers => {
            if (!user || !managers)
                return false;
            const mgt = _.pluck(managers, 'name');
            return mgt.indexOf(user) >= 0
        }),
    )
)


// --- Monday Boards that Logged in User is subsribed to ---
const M_GET_BOARD_SUBSCRIPTIONS = ['get-board-subsriptions', 'Retrieving Your Monday Boards...']
const [useMyBoards, MyBoards$] = bind(
    MondayUser$.pipe(
        switchMap(user => {
            if (!user) return EMPTY;
            
            AddQueueMessage(APP_QID, ...M_GET_BOARD_SUBSCRIPTIONS);
            return userIsAdmin$(user.name).pipe(
                switchMap(isAdmin => isAdmin ? FirebaseService.AllBoards$().pipe(take(1)) : 
                    FirebaseService.MyBoards$(user.id)
                )
            );
        }),
        tap(t => RemoveQueueMessage(APP_QID, M_GET_BOARD_SUBSCRIPTIONS[0])),
    ), []
)
/*
const [useMyBoardsByWorkspace, MyWorkspaceIds$] = partitionByKey(
    MyBoards$.pipe(
        map(itemArr => _.groupBy(itemArr, i => i.projectId)),
        map(projectMap => _.reduce(Object.keys(projectMap), (acc, id) => { 
                const boards = projectMap[id].map(b => b.boardId);
                acc.push({id, boards});
                return acc;
        }, [])),
        concatMap(itemArray => from(itemArray)),
    ),
    w => w.id
)*/
const [useAllWorkspaces, AllWorkspaces$] = bind(
    FirebaseService.AllWorkspaces$, []
) 

const [useMyBoardIds, MyBoardIds$] = bind(
    projectId =>
    useMyBoardsByWorkspace(projectId).pipe(
        map(project => project?.boards),
    ), []
)

//const MyWorkspaces$ = combineKeys(MyWorkspaceIds$, useMyBoardsByWorkspace);
const [useMyWorkspaces, MyWorkspaces$] = bind(
    combineLatest([MyBoards$, AllWorkspaces$]).pipe(
        map(([myBoards, allWS]) => {
            const myWS = _.uniq(_.pluck(myBoards, 'projectId'));
            return _.filter(allWS, ws => 
                !!_.find(ws.nesting, n => myWS.indexOf(n) >= 0))
        }),
    ), SUSPENSE
)

const [useGroupedUsers, GroupedUsers$] = bind(
    AllUsers$.pipe(
        map(allUsers => {
            const users = Object.keys(allUsers);
            const keys = [['a', 'b', 'c', 'd'],
                    ['e', 'f', 'g', 'h'],
                    ['i', 'j', 'k', 'l'],
                    ['m', 'n', 'o', 'p'],
                    ['q', 'r', 's', 't'],
                    ['u', 'v', 'w', 'x', 'y', 'z']]
            const result = []
            
            keys.forEach(k => {
                const label = (k[0] + ' - ' + k[k.length - 1]).toUpperCase();
                const group = users.filter(u => k.indexOf(u[0]) >= 0).sort().map(u => allUsers[u]);
                result.push({label, users: group}) 
            })
            return result;
        }),
    ), SUSPENSE
)

// retrieve active tab from id
//const [useMyWorkspaces, ActiveTab$] = bind((id) => ActiveTabById(id), SUSPENSE);

const [useAllUsersByGraphId, ] = bind(
    AllUsers$.pipe(
        map(users => Object.entries(users).map(
            ([key, obj]) => [obj.graph.id, obj]) 
        ),
        map(users => Object.fromEntries(users)),
    ), SUSPENSE
) 

export {
    AllUsers$,
    MondayUser$,
    LoggedInUser$,
    MyBoards$,
    useMyBoards,
    useAllUsers,
    useGroupedUsers,
    useMondayUser,
    useLoggedInUser,
    useMyAvatar,
    useUserByName,
    useUserPhotoByName,
    useMyWorkspaces,
    useMyBoardIds,
    SetAuthentication,
    SimulateUser,
    useSimulatedUser,
    useIsAdmin,
    IsAdmin$,
    useManagers,
    refreshUsersCache,
    useAllUsersByGraphId,
    useCanReviewApplications
}
