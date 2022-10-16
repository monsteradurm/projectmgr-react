import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, EMPTY, of, switchMap, map, take, from, pairwise, tap, timeout, 
    shareReplay, merge, withLatestFrom, scan, debounceTime, catchError } from "rxjs";
import { MondayService } from "../../Services/Monday.service";
import * as _ from 'underscore';
import { AllUsers$, MondayUser$ } from "../../App.Users.context";
import { SendToastSuccess, SendToastError } from "./../../App.Toasts.context";
import { FirebaseService } from "../../Services/Firebase.service";
import moment from 'moment';

const defaultSupport = {Board: null, Group:null, View: null}
const supportMap = (Board, Group, View) => ({Board, Group, View});

export const [SupportParamsChanged$, SetSupportParams] = createSignal(supportMap);
export const [NewTicketDialogEvent$, ShowNewTicketDialog] = createSignal(board => board);
export const [TicketItemInfoChanged$, ShowTicketItemInfo] = createSignal(
    (ticketId, searchParams, setSearchParams) => {
        if (ticketId && searchParams && setSearchParams) {
            searchParams.set('SelectedTicket', ticketId);
            setSearchParams(searchParams);
        } else if (!ticketId && searchParams && !setSearchParams) {
            searchParams.delete('SelectedTicket');
            setSearchParams(searchParams);
        }
    return ticketId;
});

export const [useTicketItemInfo,] = bind(
    TicketItemInfoChanged$, null
)

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
const supportSearchMap = (val, searchParams, setSearchParams) => {
    if (setSearchParams && searchParams) {
        searchParams.set('Search', val);
        setSearchParams(searchParams);
    }
    return val;
}
export const [SupportSearchFilterChanged$, SetSupportSearchFilter] = createSignal(supportSearchMap);
export const [useSupportSearchFilter, SupportSearchFilter$] = bind(
    SupportSearchFilterChanged$, ''
)

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

export const useTypeOptions = () => ['Problem', 'Incident', 'Question', 'Task'];

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
    (board, group) =>
    SupportBoard$(board).pipe(
        switchMap(Board => {
            if (Board === SUSPENSE)
                return EMPTY;
            else if (!Board)
                return of(null);

            const groups = Board.groups;

            if (!groups) return of(null);

            const Group = _.find(groups, g => g.title === group);
            if (!Group && group !== 'All Groups') return of(null);

            return FirebaseService.SubscribeToSupportGroup$(Board.id).pipe(
                scan((acc, cur) => {
                    let result = acc.filter(i => i.id !== cur.id);
                    if (cur.change != 'removed' && (group === 'All Groups' || cur.group.id === Group.id))
                        result.push(cur);
                    return result;
                }, []),
                debounceTime(100),
            )
        }),
        catchError((err) => of([])),
        tap(t => console.log("Support Tickets: ", t))
    ), SUSPENSE
)

const DefaultStatus = { color: '#222', label: 'New'}
const useTicketColumn = (ticket, title) => {
    const columns = ticket?.column_values;

    if (!columns) return null;
    const col = _.find(columns, c => c.title === title);
    return col ? col : null;
}
export const useTicketContent = (ticket) => {
    if (!ticket) return null;

   return ticket.updates?.length > 0 ? ticket.updates[0] : null
}

export const useTicketReplies = (ticket) => {
    if (!ticket) return []
    const content = useTicketContent(ticket);
    if (!content?.replies) return [];

    return content.replies
 }

export const useTicketLastUpdated = (ticket) => {
    if (!ticket) return null;
    let updated_at = ticket.updated_at ? ticket.updated_at : ticket.created_at;
    const replies = useTicketReplies(ticket);

    if (replies.length > 0) {
        const last = _.last(replies);
        const reply_updated = last.updated_at ? last.updated_at : last.created_at;
        
        if (reply_updated > updated_at)
            updated_at = reply_updated;
    }

    return moment(updated_at).format('MMM DD, YYYY HH:mm')
}

export const useTicketType = (ticket) => {
    if (!ticket) return DefaultType;
    const Type = useTicketColumn(ticket, 'Type');
    return Type?.text;
}
export const useTicketStatus = (ticket) => {
    if (!ticket) return DefaultStatus;
    const Status = useTicketColumn(ticket, 'Status');
    const info = Status?.additional_info;
    if (info) {
        try {
            const data = JSON.parse(info);
            if (data.label === 'New')
                return DefaultStatus;
            return data;
        } catch { }
    }
    return DefaultStatus;
}

const DefaultPriority = {color: 'gray', label: ''}
export const useTicketPriority = (ticket) => {
    if (!ticket) return DefaultPriority
    const Status = useTicketColumn(ticket, 'Priority');
    const info = Status?.additional_info;

    try {
        const result = JSON.parse(info)
        return result;
    } catch { }
    return DefaultPriority;
    
}
export const useTicketMachineName = (ticket) => {
    if (!ticket) return ''
    const col = useTicketColumn(ticket, 'Machine Name');
    if (!col) return '';
    return col?.text;
}

export const useTicketMachineIP = (ticket) => {
    if (!ticket) return ''
    const col = useTicketColumn(ticket, 'Machine IP');
    if (!col) return '';
    return col?.text;
}

export const useTicketRequestor = (ticket) => {
    if (!ticket) return [];

    const col = useTicketColumn(ticket, 'Requestor');
    if (!col) return [];
    const people = col.text;
    if (people.indexOf(', ') >= 0)
        return people.split(', ');
    return [people];
}

export const SupportSortOptions = ['Last Updated', 'Title', 'Type', 'Priority', 'Status', 'Machine Name']
export const [SupportSortByChanged$, SetSupportSortBy] = createSignal(n => n);
export const [useSupportSortBy, ] = bind(
    SupportSortByChanged$, 'Last Updated'
)

export const [SupportSortReversedChanged$, SetSupportSortReversed] = createSignal(n => n);
export const [useSupportSortReversed, ] = bind(
    SupportSortReversedChanged$, false
)

export const useTicketAssignee = (ticket) => {
    if (!ticket) return [];
    const col = useTicketColumn(ticket, 'Assignee');
    if (!col) return [];
    const people = col.text;
    if (people.indexOf(', ') >= 0)
        return peoples.split(', ');
    return [people];
}

export const CreateTicket = (board, ticket) => {
    combineLatest([
        SupportBoard$(board), SupportSettings$(board)
    ]).pipe(
        switchMap(([board, settings]) => {
            console.log(board.id, settings, ticket);
            return MondayService.CreateSupportItem(board.id, settings, ticket)
        }),
        take(1)
    ).subscribe((res) => { 
        if (res?.create_update?.id) {
            SendToastSuccess("Ticket Created Successfully!");
            ShowNewTicketDialog(null);
            SetNewTicketName('');
        } else {
            SendToastError("Error Creating new Ticket!");
        }
    })
}