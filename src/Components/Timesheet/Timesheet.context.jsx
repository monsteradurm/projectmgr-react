import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, concatMap, EMPTY, map, merge, of, shareReplay, switchMap, take, tap, withLatestFrom } from "rxjs";
import { SendToastError, SendToastSuccess } from "../../App.Toasts.context";
import { IsAdmin$, LoggedInUser$, Managers$, MondayUser$ } from "../../App.Users.context";
import { FirebaseService } from "../../Services/Firebase.service";
import moment from 'moment';
import * as _ from 'underscore';
import { IntegrationsService } from "../../Services/Integrations.service";

export const [TimelogProjectIdChanged$, SetTimelogProjectId] = createSignal(id => id);
export const [TimelogBoardIdChanged$, SetTimelogBoardId] = createSignal(id => id);
export const [TimelogGroupIdChanged$, SetTimelogGroupId] = createSignal(id => id);
export const [TimelogItemIdChanged$, SetTimelogItemId] = createSignal(id => id);
export const [TimelogReviewIdChanged$, SetTimelogReviewId] = createSignal(id => id);
export const [TimesheetDateChanged$, SetTimesheetDate] = createSignal(id => id);
export const [TimesheetRangeChanged$, SetTimesheetRange] = createSignal(id => id);

export const [TimeSheetFollowingChanged$, ShowTimesheetFollowingDlg] = createSignal(vis => vis);
export const [useTimesheetFollowingDlg, ] = bind (
    TimeSheetFollowingChanged$, false
)

export const ThisWeek = [moment(moment.now()).startOf('week').toDate(),
    moment(moment.now()).endOf('week').toDate()];

export const ThisMonth = [moment(moment.now()).startOf('month').toDate(),
    moment(moment.now()).endOf('month').toDate()];

export const [useTimesheetRange, TimesheetRange$] = bind(
    TimesheetRangeChanged$, ThisWeek
)

export const [useTimesheetDate, TimeSheetDate$] = bind(
    TimesheetDateChanged$.pipe(
    ), new Date()
);
TimeSheetDate$.subscribe((d) => { 
    console.log("Timesheet date changed: ", d);
}) // keep the date subscribed;

export const[useTimesheetArtist, TimesheetArtist$] = bind(
    MondayUser$.pipe(
        tap(t => console.log("logged in user", t)),
        map(u => u?.name)
    ), null
)

export const [useTimelogProjectId, TimelogProjectId$] = bind(
    TimelogProjectIdChanged$.pipe(
        tap(() => {
            SetTimelogBoardId(null);
            SetTimelogGroupId(null);
            SetTimelogItemId(null);
            SetTimelogReviewId(null);
        })
    ), null
)
export const [useTimelogProjectOptions, TimelogProjectOptions$] = bind(
    FirebaseService.AllProjects$.pipe(
        map(options => options.map(o => ({label: o.name, value: o.name}))),
        map(options => options ? _.sortBy(options, o => o.label) : null)
    ), null
)
export const [useTimelogBoardId, TimelogBoardId$] = bind(
    TimelogBoardIdChanged$.pipe(
        tap(() => {
            SetTimelogGroupId(null);
            SetTimelogItemId(null);
            SetTimelogReviewId(null);
        })
    ), null
)
export const [useTimelogBoardOptions, TimelogBoardOptions$] = bind(
    TimelogProjectId$.pipe(
        switchMap(projectId => projectId ? FirebaseService.AllBoardsFromProject$(projectId) : of(null)),
        map(options => options ? _.sortBy(options, o => o.name) : null)
    ), null
)


export const [useTimelogGroupId, TimelogGroupId$] = bind(
    TimelogGroupIdChanged$.pipe(
        tap(() => {
            SetTimelogItemId(null);
            SetTimelogReviewId(null);
        })
    ), null
)

export const [useTimelogGroupOptions, TimelogGroupOptions$] = bind(
    combineLatest([TimelogProjectId$, TimelogBoardId$]).pipe(
        switchMap(params => params.indexOf(null) < 0 ? 
            FirebaseService.AllGroups$(params[0], params[1]) : of(null)),
        map(options => options ? _.sortBy(options, o => o.name) : null)
    ), null
)

export const [useTimelogItemId, TimelogItemId$] = bind(
    TimelogItemIdChanged$.pipe(
        tap( () => SetTimelogReviewId(null))
    ), null
)

export const [useTimelogItemOptions, TimelogItemOptions$] = bind(
    combineLatest([TimelogProjectId$, TimelogBoardId$, TimelogGroupId$]).pipe(
        switchMap(params => params.indexOf(null) < 0 ? 
            FirebaseService.AllItems$(params[0], params[1], params[2]) : of(null)),
        map(options => options ? _.sortBy(options, o => o.name) : null)
    ), null
)

export const [useTimelogReviewId, TimelogReviewId$] = bind(
    TimelogReviewIdChanged$, null
)

export const SetTimelineDialogParameters = (projectId, boardId, groupId, itemId, reviewId, showDlg) => {
    SetTimelogProjectId(projectId);
    SetTimelogBoardId(boardId);
    SetTimelogGroupId(groupId);
    SetTimelogItemId(itemId);
    SetTimelogReviewId(reviewId);

    if (showDlg)
        ShowTimelogDialog(true);
}

export const [useTimelogItem, TimelogItem$] = bind(
    combineLatest([TimelogProjectId$, TimelogBoardId$, TimelogGroupId$, TimelogItemId$]).pipe(
        switchMap(params => params.indexOf(null) >= 0 ? EMPTY : 
            FirebaseService.GetBoardItem$({projectId: params[0], boardId: params[1], groupId: params[2], itemId: params[3]})
        ),
    ), null
)
export const [useTimelogReviewOptions, TimelogReviewOptions$] = bind(
    TimelogItem$.pipe(
        map(item => {
            if (!item) return null;

            if (!item.subitems || item.subitems.length < 1)
                return null;

            return item.subitems;
        }),
    map(options => options ? _.sortBy(options, o => o.name) : null)
    ), null
)

export const [NewTimelogDlgEvent$, ShowTimelogDialog] = createSignal(visible => {
    if (!visible) {
        SetTimelogProjectId(null);
    }
    return visible;
});

export const [useTimelogDlg] = bind(
    NewTimelogDlgEvent$, false
)

export const [useTimelogItemDepartment, TimelogItemDepartment$] = bind(
    TimelogItem$.pipe(
        map(item => item?.Department?.text || null)
    ), null
)

export const [useTimelogReview, TimelogReview$] = bind(
    combineLatest([TimelogReviewId$, TimelogItem$]).pipe(
        map(([reviewId, item]) => {
            if (!reviewId || !item || reviewId === SUSPENSE || item === SUSPENSE || !item.subitems?.length)
                return null;
                
            let review = _.find(item.subitems, i => i.id.toString() === reviewId.toString());
            return review || null;
        })
    ), null
)

export const [useTimelogFeedbackItemDepartment, TimelogFeedbackItemDepartment$] = bind(
    TimelogReview$.pipe(
        map(review => {
            if (!review) return null;
            
            let dep = review['Feedback Department'];
            
            return dep?.text || null;
        })
    ), null
)

export const [useTimelogReviewName, TimelogReviewName$] = bind(
    TimelogReview$.pipe(
        map(review => review?.name || null)
    ), null
)

export const [useTimelogItemName, TimelogItemName$] = bind(
    TimelogItem$.pipe(
        map(item => item?.name)
    ), null
)

export const [useTimelogElementTask, TimelogElementTask$] = bind(
    TimelogItem$.pipe(
        map(item => {
            if (!item) return [null, null];
            if (item.name?.indexOf('/')) return [item?.name, null]
            let itemArr = item?.name?.split('/');
            return [_.first(itemArr), _.last(itemArr)];
            
        })
    ), [null, null]
)

export const [useTimelogBoardName, TimelogBoardName$] = bind(
    combineLatest([TimelogBoardId$, TimelogBoardOptions$]).pipe(
        map(([id, options]) => (id !== null && options !== null) ? 
            _.find(options, o => o.id.toString() === id.toString()) : null
        ),
        map(board => board?.name || null)
    ), null
)

export const [useTimelogGroupName, TimelogGroupName$] = bind(
    combineLatest([TimelogGroupId$, TimelogGroupOptions$]).pipe(
        map(([id, options]) => (id !== null && options !== null) ? 
            _.find(options, o => o.id.toString() === id.toString()) : null
        ),
        map(group => group?.name || null)
    ), null
)

export const [useTimesheet, Timesheet$] = bind(
    combineLatest([TimesheetArtist$, TimeSheetDate$.pipe(
        map(date => moment(date).format('YYYY-MM-DD'))
    )]).pipe(
        concatMap(params => 
            params.indexOf(null) >= 0 || params.indexOf(undefined) >= 0 || params.indexOf(SUSPENSE) >= 0 ? 
                EMPTY : FirebaseService.GetTimesheet$(...params).pipe(
                    map(ts => ts ? ts: ({
                        artist: params[0],
                        date: params[1],
                        logs: [],
                        tomorrow: '',
                        approved: [],
                        updated: null,
                        submitted: null
                        }))
                    )
        )
    ), SUSPENSE
)

export const useTimeLogReviews = (item) => {
    const subitems = item?.subitems;
    if (!subitems || subitems.length < 1) return null;

    return subitems.map(i => ({label: i.name, id: i.id}));
}

export const SubmitTimeEntry = (entry) => {
    Timesheet$.pipe(
        switchMap(res => res === SUSPENSE ? EMPTY : of(res)),
        map(ts => {
            let result = {...ts};
            if (result.logs?.length) {
                result.logs = result.logs.filter(l => l.id !== entry.id)
            }
            result.logs.push(entry);
            result.updated = moment(moment.now()).format('YYYY-MM-DD HH:mm:ss')
            return result;
        }),
        switchMap(sheet => FirebaseService.StoreTimesheet$(sheet)),
        take(1)
    ).subscribe(res => {
        if (!res) {
            SendToastError("Error Saving Timesheet");
        } else {

            TimeSheets$.pipe(take(1)).subscribe((sheets) => {
                const result = [...sheets.filter(s => s.date !== res.date), res]
                UpdateTimeSheets(result);
            })

            SendToastSuccess("Timesheet: " + res.date + " Updated!");
            ShowTimelogDialog(false);
        }
    })
}

export const SubmitFollowing = (following) => {
    Timesheet$.pipe(
        switchMap(res => res === SUSPENSE ? EMPTY : of(res)),
        map(ts => {
            let result = {...ts};
            result.tomorrow = following;
            return result;
        }),
        switchMap(sheet => FirebaseService.StoreTimesheet$(sheet)),
        take(1)
    ).subscribe(res => {
        if (!res) {
            SendToastError("Error Saving Timesheet");
        } else {

            TimeSheets$.pipe(take(1)).subscribe((sheets) => {
                const result = [...sheets.filter(s => s.date !== res.date), res]
                UpdateTimeSheets(result);
            })

            SendToastSuccess("Timesheet: " + res.date + " Updated!");
            ShowTimesheetFollowingDlg(false);
        }
    })
}

export const [, RangeArray$] = bind(
    TimesheetRange$.pipe(
        map(range => range.map(d => moment(d))),
        map(([startDate, endDate]) => {
            let now = startDate.clone(), dates = [];
        
            while (now.isSameOrBefore(endDate)) {
                dates.push(now.format('YYYY-MM-DD'));
                now.add(1, 'days');
            }
            return dates.reverse();
        })
    ), []
)

export const [SelectedSheetChanged$, SetSelectedSheet] = createSignal(sheet => sheet);
export const [useSelectedSheet, SelectedSheet$] = bind(
    SelectedSheetChanged$, null
)

export const [useSheetContextMenu, SheetContextMenu$] = bind(
    SelectedSheet$.pipe(
        map((sheet) => {
            if (sheet?.date)
                SetTimesheetDate(moment(sheet.date).toDate());
            
            let menu = [{label: 'Add', items: [
                        {label: 'Entry', command: () => {
                                ShowTimelogDialog(true)}},
                        {label: 'Next Day', command: () => ShowTimesheetFollowingDlg(true)}
                ]}]
            if (sheet?.tomorrow || sheet?.logs?.length)
                menu = menu.concat([,
                    {separator: true},
                    {label: 'Submit For Review', command: () => SubmitTimesheetForReview(sheet)}])

            return menu;
        })
    ), [{label: 'Loading...'}]
)

export const [SelectedLogChanged$, SetSelectedLog] = createSignal((sheet, log) => ({sheet, log}));
export const [useSelectedLog, SelectedLog$] = bind(
    SelectedLogChanged$, {log: null, sheet: null}
)
export const [SheetsUpdatedEvent$, UpdateTimeSheets] = createSignal(sheets => sheets);

export const [useLogContextMenu, SheetLogMenu$] = bind(
    SelectedLog$.pipe(
        map(({sheet, log}) => {
            if (!sheet || !log ) return [{label: 'Error'}]
            let menu = [
                        {label: 'Edit', items: [
                            {label: 'Entry', command: () => {
                                SetTimesheetDate(sheet.date);
                                SetTimelogProjectId(log.ProjectId);
                                SetTimelogBoardId(log.BoardId);
                                SetTimelogGroupId(log.GroupId);
                                SetTimelogItemId(log.ItemId);
                                SetTimelogReviewId(log.ReviewId);
                                ShowTimelogDialog(true);
                            }},
                            {label: 'Next Day', command: () => {
                                SetTimesheetDate(sheet.date);
                                ShowTimesheetFollowingDlg(true)
                            }}
                        ]},
                        {separator: true},
                        {label: 'Remove Entry', command: () => RemoveLogEntry(sheet, log) }]
            return menu;
        })
    ), [{label: 'Loading...'}]
)

export const RemoveLogEntry = (sheet, log) => {
        if (!sheet || !log ) {
            console.log("Cannot be null value", sheet, log)
            return of(null);
        }

        const entry = _.find(sheet.logs, l => l.id === log.id);
        if (!entry) {
            console.log("Could not find entry", sheet, log)
            return of(null);
        }

        const result = {...sheet, logs: sheet.logs.filter(l => l.id !== log.id)};
        const now = moment(moment.now()).format('YYYY-MM-DD HH:mm:ss');
        result.updated = now;
        return FirebaseService.StoreTimesheet$(result).pipe(
            take(1)
        ).subscribe((update) => { 
            if (update) {
                TimeSheets$.pipe(take(1)).subscribe((sheets) => {
                    const result = [...sheets.filter(s => s.date !== update.date)]
                    UpdateTimeSheets(result);
                })
                
                SendToastSuccess("Removed Log Entry from Timesheet!");
                ShowTimelogDialog(false);
            } else {
                SendToastError("Error Removing Log from TimeSheet");
            }

    })
}
const FetchTimeSheets$ = RangeArray$.pipe(
    withLatestFrom(TimesheetArtist$),
    switchMap(([range, artist]) => FirebaseService.GetTimesheets$(artist, range)),
)

export const [useTimesheets, TimeSheets$] = bind(
    merge(FetchTimeSheets$, SheetsUpdatedEvent$), SUSPENSE
) 

export const SubmitTimesheetForReview = (sheet) => {
    const emails$ = Managers$.pipe(
        map(users => _.pluck(users, 'email')),
        map(emails => emails.join('; ')),
        take(1)
    );

    emails$.pipe(
        switchMap(emails => IntegrationsService.Email_EndOfDay$(sheet, emails))
    ).pipe(
        take(1)
    ).subscribe(res => {
        if (res.status === 200) {
            SendToastSuccess("Timmesheet " + sheet.date + " Submitted for Review!");
            const now = moment(moment.now()).format('YYYY-MM-DD HH:mm:ss');
            sheet.submitted = now;
            sheet.updated = now;
            FirebaseService.StoreTimesheet$(sheet).pipe(take(1)).subscribe((res) => { 
                if (!res) SendToastError("Error Updating Timesheet \"Submission Status\"");
                else {
                    TimeSheets$.pipe(take(1)).subscribe((sheets) => {
                        const result = [...sheets.filter(s => s.date !== sheet.date)]
                        UpdateTimeSheets(result);
                    })
                }
            })
        }
    });
}

export const SheetRibbonColor = (sheet) => {
    const date = sheet?.date;
    const dayOfWeek = moment(date).format('d');
    const isWeekend = dayOfWeek === '0' || dayOfWeek === '6';

    const today = moment();
    const isToday = moment(date).isSame(today, 'day');
    const isAfter = moment(date).isAfter(today);
    let background = 'red';
    if (isToday) 
        background = 'rgb(0, 156, 194)';

    if (isAfter && !isWeekend)
        background = '#555';

    if (!isToday && !sheet?.submitted && !isAfter && !isWeekend)
        background = 'rgb(180 0 86)';
    else if (!isToday && isWeekend)
        background = '#ccc';
    else if (sheet?.submitted)
        background = 'rgb(0, 133, 119)';

    return background;
}
