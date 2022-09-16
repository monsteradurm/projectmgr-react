import { map, of, take } from "rxjs";
import * as _ from 'underscore';
import { bind } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { MessageQueue } from "./App.MessageQueue.context";
import { setToastReference, SendToastError, SendToastSuccess,
         SendToastInfo, SendToastWarning } from "./App.Toasts.context";
import { useMyBoards, useAllUsers, useMondayUser, SetAuthentication, useMyAvatar,
         useLoggedInUser } from "./App.Users.context";

const PrimaryColors = {
    'Project' : '#008577',
    'default' : 'gray'
}


// --- Header Display ---
const [TitlesChanged$, SetTitles] = createSignal();
const [useTitles, Titles$] = bind(TitlesChanged$, [])

const [usePrimaryColor, PrimaryColor$] = bind(
    Titles$.pipe(
        map(t => t && Array.isArray(t) && t.length > 0 ? t[0] : 'default'),
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
}