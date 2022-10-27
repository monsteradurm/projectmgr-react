import { BehaviorSubject, combineLatest, map, of, take, tap, withLatestFrom, EMPTY } from "rxjs";
import * as _ from 'underscore';
import { bind, SUSPENSE } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { MessageQueue } from "./App.MessageQueue.context";
import { setToastReference, SendToastError, SendToastSuccess,
         SendToastInfo, SendToastWarning } from "./App.Toasts.context";
import { useMyBoards, useAllUsers, useMondayUser, SetAuthentication, useMyAvatar,
         useLoggedInUser } from "./App.Users.context";

const PrimaryColors = {
    'Projects' : '#008577',
    'Timesheets' : '#009cc2',
    'Home' : '#009cc2',
    'Allocations' : '#009cc2',
    'Support' : '#86b64b',
    'Users' : '#964cc9',
    'Applications' : '#964cc9',
    'Gallery' : '#FF9616',
    'GalleryUpdate' : '#FF9616',
    'default' : 'gray'
}


// --- Header Display ---
const [TitlesChanged$, SetTitles] = createSignal();
const [useTitles, Titles$] = bind(TitlesChanged$, [])

const findGetParameter = (parameterName) => {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

const [RouteChangedEvent$, SetCurrentRoute] = createSignal((location, searchParams) => {
    let url = location;
    let simulating = null;

    if (searchParams?.get && searchParams?.get('Simulating')) {
        simulating = searchParams.get('Simulating')
    } else {
        simulating = findGetParameter('Simulating');
    }
    if (simulating) {
        if (url.indexOf('?') < 0)
            url += '?'
        else url += '&'
        url += 'Simulating=' + simulating;
    }

    return url;
});

const [useCurrentRoute, currentRoute$] = bind(
    RouteChangedEvent$, null
)

const [NavigationHandlerChanged$, SetNavigationHandler] = createSignal(navigate => navigate);
const [useNavigationHandler, NavigationHandler$] = bind(
    RouteChangedEvent$.pipe(
        withLatestFrom(NavigationHandlerChanged$),
        tap(console.log)
    ), [SUSPENSE, SUSPENSE]
)

const [usePrimaryColor, PrimaryColor$] = bind(
    RouteChangedEvent$.pipe(
        map(location => {
            if (location === '' || location === '/')
                return 'Home'
            let route = location;
            if (location[0] === '/')
                route = location.split('/')[1];

            if (route.indexOf('?') >= 1)
                route = route.split('?')[0]
            return route;
        }),
        tap(t => console.log("Route Changed: ", t)),
        map(t => PrimaryColors[t] ? PrimaryColors[t] : PrimaryColors['default']) 
    ), EMPTY)

const _M_RetrievingWorkspaces = ['get-workspaces', 'Retrieving Your Workspaces...'];
const _M_RetrievingUsers = ['get-users', 'Retrieving Users from Monday & ActiveDirectory...'];

export {
    SetTitles,
    useTitles,
    usePrimaryColor,
    useNavigationHandler,
    SetNavigationHandler,
    SendToastError,
    SendToastSuccess,
    SendToastInfo,
    SendToastWarning,
    useMyAvatar,
    useMyBoards,
    useAllUsers,
    useMondayUser,
    useLoggedInUser,
    SetAuthentication,
    useCurrentRoute,
    SetCurrentRoute
}