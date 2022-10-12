import { bind, SUSPENSE } from "@react-rxjs/core";
import { combineLatest, concatMap, debounceTime, distinctUntilChanged, EMPTY, from, map, merge, of, scan, switchMap, take, tap, timeout, toArray, withLatestFrom } from "rxjs";
import { AllUsers$, MyBoards$ } from "../../App.Users.context";
import { FirebaseService } from "../../Services/Firebase.service";
import * as _ from 'underscore';
import { NestedDropdown } from "../General/NestedDropDown.component";
import { Dropdown } from "react-bootstrap";
import { combineKeys, createKeyedSignal, createSignal, partitionByKey } from "@react-rxjs/utils";
import { Badge } from 'primereact/badge';
import { MondayService } from "../../Services/Monday.service";
import { ReadyOrSuspend$ } from "../../Helpers/Context.helper";
import { SyncsketchService } from "../../Services/Syncsketch.service";
import { SetCurrentRoute } from "../../Application.context";
import { SendToastError, SendToastSuccess } from "../../App.Toasts.context";

const _boardItemStatusMap = (boardItemId, text, color, index, column_id) => ({boardItemId, text, color, index, column_id});
const [ItemStatusChanged$, SetItemStatus] = createSignal(_boardItemStatusMap)

const homeSearchMap = (val, searchParams, setSearchParams) => {
    if (setSearchParams && searchParams) {
        searchParams.set('Search', val);
        setSearchParams(searchParams);
    }
    return val;
}
export const [HomeSearchFilterChanged$, SetHomeSearchFilter] = createSignal(homeSearchMap);
export const [useHomeSearchFilter, HomeSearchFilter$] = bind(
    HomeSearchFilterChanged$, ''
)
export const [HomeArtistFilterChanged$, SetHomeArtistFilter] = createSignal(homeSearchMap);
export const [useHomeArtistFilter, HomeArtistFilter$] = bind(
    HomeArtistFilterChanged$, ''
)

export const [HomeDirectorFilterChanged$, SetHomeDirectorFilter] = createSignal(homeSearchMap);
export const [useHomeDirectorFilter, HomeDirectorFilter$] = bind(
    HomeDirectorFilterChanged$, ''
)

export const [UpdatedStatusItem$, UpdateStatusItem] = createSignal((statusItem, label, change) => ({...statusItem, change, label}));
export const [useUpdatedStatusItems, ] = bind(
    status =>
    UpdatedStatusItem$.pipe(
        switchMap(item => item?.label?.indexOf(status) < 0 ? of(item) : EMPTY),
        scan((acc, item) => [...acc.filter(i => i != item.id), item], [])
    ), null
)

const NoticesURL = "/Home?View=Notices";

export const [ItemsByStatus, ItemsByStatus$] = bind(
    Status =>
    merge(FirebaseService.ItemsByStatus$(Status), UpdatedStatusItem$.pipe(
        concatMap(() => FirebaseService.ItemsByStatus$(Status))
    )).pipe(
        scan((acc, item) => {
            const result = [...acc.filter(i => i !== item.id)];
            if (item.change === 'removed')
                return result;
            return [...result, item]
        }, []),
        debounceTime(100)
    ), SUSPENSE
)

const [, MyStatusItems$] = bind(
    Status =>
    combineLatest([MyBoards$.pipe(
        map(boards => _.pluck(boards, 'boardId'))
    ), ItemsByStatus$(Status)]).pipe(
        switchMap(result => result.indexOf(SUSPENSE) >= 0 ? EMPTY : of(result)),
        map(([myBoards, items]) => {
            const boardIds = myBoards.map(b => b.toString());
            return items.filter(i => boardIds.indexOf(i.board.toString()) >= 0);
        }),
    ), SUSPENSE
)

export const [useProjectsByStatus, ProjectsByStatus$] = bind(
    Status =>
    MyStatusItems$(Status).pipe(
        switchMap(items => items === SUSPENSE ? EMPTY : of(items)),
        map(items => _.uniq(items, item => item.id)),
        map(items => _.reduce(items, (acc, item) => {
            let pNesting = [item.board_description];
            let bNesting = item.board_name;
            if (pNesting[0].indexOf('/'))
                pNesting = pNesting[0].split('/');
            
            if (bNesting.indexOf('/'))
                bNesting = bNesting.split('/')[0];

            const nesting  = [...pNesting, bNesting];

            let last = acc;
            let key = 'ItemsByStatus_'

            nesting.forEach(n => {
                key += n + '_';
                if (!last[n]) {
                    last[n] = {key};
                }
                last = last[n];
            })

            if (!last.items)
                last.items = [];

            last.nesting = nesting;
            last.items.push(item);

            return acc;
        },{}),
        ),
    ), SUSPENSE
)

const BuildInitialStatusMenu = (status, loadingText) => {
    return (
        <NestedDropdown key={`Initial${status}Menu`} title={status}>
            <Dropdown.Item>{loadingText}</Dropdown.Item>
        </NestedDropdown>

    )
}

const BuildEmptyStatusMenu = (status) => {
    return (
        <NestedDropdown key={`Empty${status}Menu`} title={status}>
            <Dropdown.Item>No {status} Items...</Dropdown.Item>
        </NestedDropdown>
    )
}

const BuildStatusDropdownMenu = (item, url) => {
    const keys = Object.keys(item);

    return keys.filter(k => k != 'key').map(title => {

        if (item[title].items?.length) {
            const color = item[title].items[0].color;
            const count = item[title].items.length
            const itemsURL = url + '&Nesting=' + item[title].nesting.join(',');
            StoreStatusItemsByURL(itemsURL, item[title].items);
            return <Dropdown.Item key={item[title].key} onClick={
                (e) => {
                    SetCurrentRoute(itemsURL)
            }}>
                {title}<Badge value={count} style={{marginLeft: 10, background: color}}></Badge>
            </Dropdown.Item>
        }
        return <NestedDropdown title={title} key={item[title].key}>
            { 
                BuildStatusDropdownMenu(item[title], url)
            }
        </NestedDropdown>
    })  
}

const InitialReviewMenu = BuildInitialStatusMenu('Reviews', 'Loading...');
const InitialFeedbackMenu = BuildInitialStatusMenu('Feedback', 'Loading...');
const InitialProgressMenu = BuildInitialStatusMenu('In Progress', 'Loading...');
const InitialAssistanceMenu = BuildInitialStatusMenu('Assistance', 'Loading...');

const InitialHomeMenu = [
    InitialReviewMenu, 
    InitialFeedbackMenu, 
    InitialProgressMenu,
    InitialAssistanceMenu,
    <Dropdown.Divider key="HomeMenu_Divider"/>,
    <Dropdown.Item key={NoticesURL} onClick={() => SetHomeNavigation(NoticesURL)}>Notices</Dropdown.Item>]


const [, ReviewMenu$] = bind(
    ProjectsByStatus$('Review').pipe(
        map(menu => {
            if (Object.keys(menu).length < 1)
                return BuildEmptyStatusMenu('Review');
            return (<NestedDropdown title="Reviews" key="Home/Reviews">
            { BuildStatusDropdownMenu(menu, '/Home?View=Reviews') }
            </NestedDropdown>)
        })
    ), InitialReviewMenu
)
const [, FeedbackMenu$] = bind(
    ProjectsByStatus$('Feedback').pipe(
        map(menu => {
            if (Object.keys(menu).length < 1)
                return BuildEmptyStatusMenu('Feedback');
            return (<NestedDropdown title="Feedback" key="Home/Feedback">
            { BuildStatusDropdownMenu(menu, '/Home?View=Feedback') }
            </NestedDropdown>)
        })
    ), InitialFeedbackMenu
)
const [, ProgressMenu$] = bind(
    ProjectsByStatus$('In Progress').pipe(
        map(menu => {
            if (Object.keys(menu).length < 1)
                return BuildEmptyStatusMenu('In Progress');
            return (<NestedDropdown title="In Progress" key="Home/In Progress">
            { BuildStatusDropdownMenu(menu, '/Home?View=In Progress') }
            </NestedDropdown>)
        }),
    ), InitialProgressMenu
)
const [, Assistance$] = bind(
    ProjectsByStatus$('Assistance').pipe(
        map(menu => {
            if (Object.keys(menu).length < 1)
                return BuildEmptyStatusMenu('Assistance');
            return (<NestedDropdown title="Assistance" key="Home/Assistance">
            { BuildStatusDropdownMenu(menu, '/Home?View=Assistance') }
            </NestedDropdown>)
        }),
    ), InitialAssistanceMenu
)
const [StoredStatusItemsChanged$, StoreStatusItemsByURL] = createSignal((key, items) => ({key, items}));
const [StatusItemsByURL, StatusItemURLs$] = partitionByKey(
    StoredStatusItemsChanged$,
    x => x.key,
    $ => $.pipe(
        map(x => _.uniq(x.items.reverse(), i => i.id).reverse()),
    )
)

export const [useStatusItemURLs, ] = bind(
    StatusItemURLs$, SUSPENSE
)

StatusItemURLs$.subscribe((res) => { })  // pre-fetch

const StatusItemMap$ = combineKeys(StatusItemURLs$, StatusItemsByURL);
export const [useAllStatusItemIds, AllStatusItemIds$] = bind(
    StatusItemMap$.pipe(
        map(m => Array.from(m.entries())),
        map(entries => entries.map(e => e[1])),
        map(values => _.flatten(values)),
        switchMap(values => values.length > 0 ? 
            FirebaseService.GetBatchedMondayItems(values) : EMPTY),
        concatMap(values => from(values)),
    ), SUSPENSE
) 

const [StatusItemById, StatusItemIds$] = partitionByKey(
    AllStatusItemIds$,
    x => x.id
)

export const [useStatusItem, StatusItem$] = bind(
    id => StatusItemById(id.toString()), SUSPENSE
)

export const [useBoardItemFromStatusItem, BoardItemFromStatusItem$] = bind(
    item => of(item).pipe(
        switchMap(item => {
            if (item === SUSPENSE)
                return of(SUSPENSE);
            else if (!item)
                return of(null);

            const {board, group, board_description} = item;

            let ws = board_description;
            try {
                if (board_description.indexOf('/') >= 0)
                    ws = board_description.split('/')[1];
            } catch (err) {
                console.log(err);
                console.log(item, board_description);
            }
            return FirebaseService.BoardItem$(ws, board, group, item.id)
        })
    ), SUSPENSE
)

export const [useStatusReview, StatusReview$] = bind(
    boarditem => of(boarditem).pipe(
        switchMap(item => item === SUSPENSE ? EMPTY : of(item)),
        map(item => item.subitems?.length ? item.subitems : []),
        map(subitems => _.sortBy(subitems, s => s.Index?.text ? s.Index?.text : -1)),
        map(subitems => subitems.length ? subitems.reverse()[0] : null)
    ), SUSPENSE
)

export const [useStatusReviewName, StatusReviewName$] = bind(
    review => of(review).pipe(
        switchMap(item => item === SUSPENSE ? EMPTY : of(item)),
        map(item => item?.name ?? null)
    ), SUSPENSE
)

export const [useStatusReviewLink, StatusReviewLink$] = bind(
    review => of(review).pipe(
        switchMap(item => item === SUSPENSE ? EMPTY : of(item)),
        map(item => item?.Link?.text?.length ? item.Link.text : null),
    ), SUSPENSE
)

const ItemIdFromSyncLink = (link) => {
    if (!link || link.length < 1)
        return null;

    const linkArr = link.split('/#/').filter(x => x && x.length > 0);
    return linkArr[1].indexOf('/') > 0 ? _.last(linkArr[1].split('/')) : linkArr[1];
}

export const [useStatusReviewThumbnail, StatusReviewThumbnail$] = bind(
    review => StatusReviewLink$(review).pipe(
        switchMap(link => {
            if (link === SUSPENSE)
                return EMPTY
            if (!link)
                return of(null);

            const id = ItemIdFromSyncLink(link);
            return SyncsketchService.ThumbnailFromId$(id)
        }),
    ), SUSPENSE
)
export const [useStatusReviewComments, StatusReviewComments] = bind(
    review => StatusReviewLink$(review).pipe(
        switchMap(link => {
            if (link === SUSPENSE)
                return EMPTY
            if (!link)
                return of(null);
            const id = ItemIdFromSyncLink(link);
            return SyncsketchService.AllFeedback$(id)
        }),
        switchMap(feedback => {
            if (feedback === SUSPENSE)
                return EMPTY
            if (!feedback)
                return of([]);
            return of(feedback.filter(f => f.type === 'comment'))
        })
    ), SUSPENSE
)

const GetPersonValues = (personCol) => {
    const values = personCol?.value?.filter(a => a && a.length > 0);
    if (!values || !values.length)
        return [];
    return values;
}

export const [useStatusAssignedArtists, StatusAssignedArtists$] = bind(
    (boarditem, review) => combineLatest([
       of(boarditem),
       of(review)
    ]).pipe(
        switchMap(res => res.indexOf(SUSPENSE) >= 0 ? EMPTY : of(res)),
        map(([item, review]) => {
            const ia = GetPersonValues(item?.Artist);
            const ra = GetPersonValues(review?.Artist);
            if (ra?.length) return ra;
            else if (!review)
                return ia;

            const reallocated = item?.subitems?.length ? 
                item.subitems.filter(s => s.id !== review.id)
                    .filter(s => GetPersonValues(s?.Aritst).length > 0) : false; 

            return reallocated ? [] : ia;
        })
    ), SUSPENSE
)

export const [ViewChanged$, SetHomeView] = createSignal(view => view);
export const [useHomeView, HomeView$] = bind(
    ViewChanged$, SUSPENSE
)

export const [HomeNavigationEvent$, SetHomeNavigation] = createSignal(url => url);
export const [LastHomeNavigationEvent, ] = bind(
    HomeNavigationEvent$, null
);


export const [useHomeMenu, HomeMenu$] = bind(
    combineLatest([
        ReviewMenu$, FeedbackMenu$, ProgressMenu$, Assistance$
    ]).pipe(
        map(([review, feedback, progress, assistance]) => 
        [   
            review, feedback, progress, assistance,
            <Dropdown.Divider key="HomeMenu_Divider"/>,
            <Dropdown.Item key={NoticesURL} onClick={() => SetCurrentRoute(NoticesURL)}>Notices</Dropdown.Item>
        ]),
    ), InitialHomeMenu
)
export const [StatusNestingChanged$, SetStatusNesting] = createSignal(nesting => nesting);
export const [useStatusNesting, StatusNesting$] = bind(
    StatusNestingChanged$, null
)

export const [useStatusItemGroups] = bind(
    combineLatest([StatusNesting$, HomeView$]).pipe(
        switchMap(params => params.indexOf(null) >= 0 ? EMPTY : of(params)),
        map(([nesting, view]) => `/Home?View=${view}&Nesting=${nesting}`),
        switchMap(url => StatusItemsByURL(url).pipe(
            timeout({
                each: 5000,
                with: () => of([])
            }),
            take(1)
        )),
        map(items => _.groupBy(items, i => i.board_name + ", " + i.group_title)),
        map(groups => Object.entries(groups)),
        debounceTime(100),
    ), SUSPENSE
)

export const BoardSettings$ = (id) => {
    const key = '/BoardSettings/' + id;
    const stored = sessionStorage.getItem('key');

    if (stored) {
        try {
            const data = JSON.parse(stored);
            return of(data);
        }
        catch { }
    } 

    return MondayService.ColumnSettings(id).pipe(
        take(1),
        tap(t => sessionStorage.setItem(key, JSON.stringify(t)))
    )
}

const OnSetStatus = (statusItem, selected) => {
    console.log("Setting Item Status",
        {board: statusItem.board, label: selected.label, item: statusItem.id, column: selected.column_id, index: selected.index});
        UpdateStatusItem(statusItem, selected.label, 'removed');
    MondayService.SetItemStatus(statusItem.board, statusItem.id, selected.column_id, selected.index).pipe(
        take(1)
    ).subscribe((res) => {
        if (res?.change_simple_column_value?.id) {
            SendToastSuccess("Status was successfully updated!")
        } else {
            SendToastErrorr('There was an error updating the status!')
        }
    })
}

export const [ ,StatusOptions$] = bind(
    (statusItem) => BoardSettings$(statusItem.board).pipe(
        map(res => res.Status),
        map(res => Object.keys(res.labels).map(index => ({
                    label: res.labels[index],
                    color: res.labels_colors[index].color,
                    index,
                    column_id: res.id,
                    className: "pm-statusOption",
                    style: { background: res.labels_colors[index].color, color: 'white'}
                })
            )
        ),
        map(options => options.map(o => ({...o, command: () => OnSetStatus(statusItem, o)}))),
        map(options => options.filter( o => o.label !== 'Not Started' || o.color === "#333333"))
    )
)

export const [, AddArtistMenu$] = bind(
    StatusItem =>
    AllUsers$.pipe(
        map(allUsers => {
            let existing = [];
            if (StatusItem?.artists?.indexOf(', ') >= 0)
                existing = StatusItem.artists.split(', ');
            else if (StatusItem?.artists?.length > 0)
                existing = [StatusItem.artists]

            const users = _.sortBy(Object.values(allUsers)
                .filter(u => existing.indexOf(u.monday.name) < 0), a => a.monday.name);
                
            return users.map(user => ({
                label: user.monday.name,
                user
            }))
        })
    )
)


export const [, RemoveArtistMenu$] = bind(
    StatusItem =>
    AllUsers$.pipe(
        map(allUsers => {
            let existing = [];
            if (StatusItem?.artists?.indexOf(', ') >= 0)
                existing = StatusItem.artists.split(', ');
            else if (StatusItem?.artists?.length > 0)
                existing = [StatusItem.artists]

            const users = _.sortBy(Object.values(allUsers)
                .filter(u => existing.indexOf(u.monday.name) >= 0), a => a.monday.name);
            
            if (existing.length > 0)
                return users.map(user => ({
                    label: user.monday.name,
                    user
                }))
            return [{label: 'No Artists Assigned...', style: { fontStyle: 'italic', fontWeight: '300 !important' }}]
        })
    )
)


export const [useStatusContextMenu, StatusContextMenu$] = bind(
    StatusItem => 
    StatusOptions$(StatusItem).pipe(
        map((options) => ([
            {label: "Status", items: options},
            { separator: true },
            {label: "Switch to Overview", command: () => {
                    let projectId = StatusItem.board_description;
                    if (projectId.indexOf('/') > 0)
                        projectId = _.last(projectId.split('/'));

                    SetCurrentRoute(
                        `Projects?ProjectId=${projectId}&BoardId=${StatusItem.board}&GroupId=${StatusItem.group}`
                    )
                }
            }])),
    ), [{label: 'Loading...'}]
)
