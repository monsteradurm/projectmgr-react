import { BehaviorSubject, map, of, take, tap } from "rxjs";
import * as _ from 'underscore';
import { bind } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { MessageQueue } from "./App.MessageQueue.context";
import { setToastReference, SendToastError, SendToastSuccess,
         SendToastInfo, SendToastWarning } from "./App.Toasts.context";
import { useMyBoards, useAllUsers, useMondayUser, SetAuthentication, useMyAvatar,
         useLoggedInUser } from "./App.Users.context";

const PrimaryColors = {
    'Projects' : '#008577',
    'Home' : '#009cc2',
    'default' : 'gray'
}


// --- Header Display ---
const [TitlesChanged$, SetTitles] = createSignal();
const [useTitles, Titles$] = bind(TitlesChanged$, [])

const [RouteChangedEvent$, SetCurrentRoute] = createSignal(location => location);
const [useCurrentRoute, currentRoute$] = bind(
    RouteChangedEvent$, null
)

const [usePrimaryColor, PrimaryColor$] = bind(
    RouteChangedEvent$.pipe(
        map(location => {
            let route = location.split('/');
            route.splice(0, 3);

            if (route[0].indexOf('?') >= 1)
                route = route[0].split('?')[0]
            return route;
        }),
        tap(t => console.log("Route Changed: ", t)),
        map(t => PrimaryColors[t] ? PrimaryColors[t] : PrimaryColors['default']) 
    ), PrimaryColors.default)

const _M_RetrievingWorkspaces = ['get-workspaces', 'Retrieving Your Workspaces...'];
const _M_RetrievingUsers = ['get-users', 'Retrieving Users from Monday & ActiveDirectory...'];

export {
    SetTitles,
    useTitles,
    usePrimaryColor,
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