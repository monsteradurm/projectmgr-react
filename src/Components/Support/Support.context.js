import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, EMPTY, of, switchMap, map, take, from, tap, shareReplay, merge, withLatestFrom } from "rxjs";
import { MondayService } from "../../Services/Monday.service";
import * as _ from 'underscore';
import { AllUsers$, MondayUser$ } from "../../App.Users.context";

const defaultSupport = {Board: null, Group:null, View: null}
const supportMap = (Board, Group, View) => ({Board, Group, View});

export const [SupportParamsChanged$, SetSupportParams] = createSignal(supportMap);
export const [NewTicketDialogEvent$, ShowNewTicketDialog] = createSignal(board => board);

export const [useRequestorOptions, RequestorOptions$] = bind(
    AllUsers$.pipe(
        switchMap(users => users && users !== SUSPENSE ? of(users) : EMPTY),
        map(users => Object.values(users)),
        map(users => users.map(u => u.monday)),
        map(users => users.map(u => ({label: u.name, id: u.id, user: u}))),
    ), []
)

export const [RequestorsChanged$, SetRequestors] = createSignal(r => {
   console.log("Setting Requestors", r);
   return r;
});

export const [useRequestors, Requestors$] = bind(
    merge(RequestorsChanged$, MondayUser$.pipe(
        map(user => user ? [{id: user.id, label: user.name, user}] : null)
    ).pipe(
        tap(T => console.log("REQUESTORS", T))
    )), []
)
export const [useNewTicketDialog, ] = bind(
    NewTicketDialogEvent$, null
)

export const [useSupportParams, SupportParams$] = bind(
    SupportParamsChanged$, defaultSupport
)


export const [NewTicketNameChanged$, SetNewTicketName] = createSignal(n => n);
export const [useNewTicketName, NewTicketName$] = bind(
    NewTicketNameChanged$, ''
)


export const [MachineNameChanged$, SetMachineName] = createSignal(n => n);
export const [useMachineName, MachineName$] = bind(
    MachineNameChanged$, ''
)

export const [MachineIPChanged$, SetMachineIP] = createSignal(n => n);
export const [useMachineIP, MachineIP$] = bind(
    MachineIPChanged$, ''
)

const Fetch_SupportOptions$ = (type) => {
    const key = '/PM/Support/' + type;
    try {
        const data = sessionStorage.getItem(key)
        if (data) {
            console.info("Found Cached " + type + " Support Options...")
            const stored = JSON.parse(data);
            if (stored) {
                console.info("Parsed Cached " + type + " Support Options...")
                return of(stored);
            }
        }
    } catch (err) { console.log(err) }

    let $;

    if (type === 'Management')
        $ = MondayService.Support_ManagementGroups$;
    else if (type === 'Technical')
        $ = MondayService.Support_TechnicalGroups$;
    else 
        $ = MondayService.Support_SoftwareGroups$;

    return $.pipe(
        tap(res => {
            console.info("Caching " + type + " Support Options...")
            sessionStorage.setItem(key, JSON.stringify(res))
        })
    )
}

const FetchSupportOptions$ = combineLatest([
    Fetch_SupportOptions$('Management'), 
    Fetch_SupportOptions$('Technical'),
    Fetch_SupportOptions$('Software')]).pipe(
        shareReplay(1)
    );

export const [useSupportOptions, SupportOptions$] = bind(
    FetchSupportOptions$, SUSPENSE
) 

export const [useSupportGroups, SupportGroups$] = bind(
    board => 
    of(board).pipe(
        switchMap(b => !b ? of([]) : 
            SupportOptions$.pipe(
                map(options => _.find(options, o => o.label === board)),
                map(board => board?.groups ? board.groups : [])
            )
        )
    ), null
)

export const [useSupportBoard, SupportBoard$] = bind(
    board =>
    SupportOptions$.pipe(
        map(options =>
            options !== SUSPENSE ?
                options ? _.find(options, o => o.label === board) : null
                : SUSPENSE
            )
    ), SUSPENSE
) 

export const [useSupportSettings, SupportSettings$] = bind(
    board => 
    SupportBoard$(board).pipe(
        map(board => 
            board !== SUSPENSE ?
                board?.settings ? board.settings : []
                : SUSPENSE
            ),
        tap(t => console.log("Support Board Settings", t))
    ), SUSPENSE
)

export const [, PriorityColumn$] = bind(
    board =>
    SupportSettings$(board).pipe(
        map(columns => 
            columns !== SUSPENSE ?
                columns ? _.find(columns, c => c.title === 'Priority') : null
                : SUSPENSE
            ),
    ), SUSPENSE
)

export const [, StatusColumn$] = bind(
    board =>
    SupportSettings$(board).pipe(
        map(columns => 
            columns !== SUSPENSE ?
                columns ? _.find(columns, c => c.title === 'Status') : null
                : SUSPENSE
            ),
    ), SUSPENSE
)

const ParseStatusOptions = (options) => {
    if (options === SUSPENSE)
        return SUSPENSE;
    if (!options || !options.labels || !options.labels_colors)
        return [];

    return Object.keys(options.labels).map(index => ({
            index, 
            label: options.labels[index], 
            color: options.labels_colors[index]?.color
        })
    );
}

export const [usePriorityOptions, PriorityOptions$] = bind(
    board =>
    PriorityColumn$(board).pipe(
        map(column => 
            column !== SUSPENSE ?
                column?.settings_str ?  column.settings_str : null
                : SUSPENSE
            ),
        map(settings => settings !== SUSPENSE ?
            settings ?  ParseStatusOptions(JSON.parse(settings)) : null
            : SUSPENSE
        ),
    ), SUSPENSE
)

export const [useStatusOptions, StatusOptions$] = bind(
    board =>
    StatusColumn$(board).pipe(
        map(column => 
            column !== SUSPENSE ?
                column?.settings_str ?  column.settings_str : null
                : SUSPENSE
            ),
        map(settings => settings !== SUSPENSE ?
            settings ?  ParseStatusOptions(JSON.parse(settings)) : null
            : SUSPENSE
        ),
        tap(t => console.log("Status Options", t, board))
    ), SUSPENSE
)

export const [useSupportTickets, SupportTickets$] = bind(
    groupid =>
    of([]), []
    /*SupportParams$.pipe(
        switchMap(([board, ,]) => {
            if (!board || !groupId) return EMPTY;
            else if ([board, groupId].indexOf(SUSPENSE) >= 0) return EMPTY;
            return MondayService.Support_Tickets$(boardId, groupId);
        })
    ), SUSPENSE*/
)

/*
    TicketName, MachineName, Priority, Description, Group, MachineIP, Requestors
*/

export const CreateTicket = (board, ticket) => {

}