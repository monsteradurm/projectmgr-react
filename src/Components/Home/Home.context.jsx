import { bind, SUSPENSE } from "@react-rxjs/core";
import { combineLatest, concatMap, EMPTY, from, map, of, scan, switchMap, tap } from "rxjs";
import { MyBoards$ } from "../../App.Users.context";
import { FirebaseService } from "../../Services/Firebase.service";
import * as _ from 'underscore';
import { NestedDropdown } from "../General/NestedDropDown.component";
import { Dropdown } from "react-bootstrap";
import { combineKeys, createKeyedSignal, createSignal, partitionByKey } from "@react-rxjs/utils";
import { Badge } from 'primereact/badge';
import { MondayService } from "../../Services/Monday.service";
import { ReadyOrSuspend$ } from "../../Helpers/Context.helper";
import { SyncsketchService } from "../../Services/Syncsketch.service";

const NoticesURL = "/Home?View=Notices";
export const [ItemsByStatus, ItemsByStatus$] = bind(
    Status =>
    FirebaseService.ItemsByStatus$(Status).pipe(
        scan((acc, item) => {
            const result = [...acc.filter(i => i !== item.id)];
            if (item.change === 'removed')
                return result;
            return [...result, item]
        }, []),
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
                    console.log(itemsURL);
                    SetHomeNavigation(itemsURL)
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
        })
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
        })
    ), InitialAssistanceMenu
)
const [StoredStatusItemsChanged$, StoreStatusItemsByURL] = createSignal((key, items) => ({key, items}));
const [StatusItemsByURL, StatusItemURLs$] = partitionByKey(
    StoredStatusItemsChanged$,
    x => x.key,
    $ => $.pipe(map(x => _.uniq(x.items.reverse(), i => i.id).reverse()))
)
export const [useStatusItemURLs, ] = bind(
    StatusItemURLs$, SUSPENSE
)

StatusItemURLs$.subscribe((res) => { console.log("URLS", res) })  // pre-fetch

const StatusItemMap$ = combineKeys(StatusItemURLs$, StatusItemsByURL);
export const [useAllStatusItemIds, AllStatusItemIds$] = bind(
    StatusItemMap$.pipe(
        tap(console.log),
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
export const [useStatusReview, StatusReview$] = bind(
    id => StatusItem$(id).pipe(
        switchMap(item => item === SUSPENSE ? EMPTY : of(item)),
        map(item => item.subitems?.length ? item.subitems : []),
        map(subitems => _.sortBy(subitems, s => s.Index?.text ? s.Index?.text : -1)),
        map(subitems => subitems.length ? subitems.reverse()[0] : null)
    ), SUSPENSE
)

export const [useStatusReviewName, StatusReviewName$] = bind(
    id => StatusReview$(id).pipe(
        switchMap(item => item === SUSPENSE ? EMPTY : of(item)),
        map(item => item?.name ?? null)
    ), SUSPENSE
)

export const [useStatusReviewLink, StatusReviewLink$] = bind(
    id => StatusReview$(id).pipe(
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
    id => StatusReviewLink$(id).pipe(
        switchMap(link => {
            if (link === SUSPENSE)
                return EMPTY
            if (!link)
                return of(null);

            const id = ItemIdFromSyncLink(link);
            console.log("THuMBNAIL ID", id);
            return SyncsketchService.ThumbnailFromId$(id)
        }),
    ), SUSPENSE
)
export const [useStatusReviewComments, StatusReviewComments] = bind(
    id => StatusReviewLink$(id).pipe(
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
    id => combineLatest([
        StatusItem$(id),
        StatusReview$(id)
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
            <Dropdown.Item key={NoticesURL} onClick={() => SetHomeNavigation(NoticesURL)}>Notices</Dropdown.Item>
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
        switchMap(url => StatusItemsByURL(url)),
        map(items => _.groupBy(items, i => i.board_name + ", " + i.group_title)),
        map(groups => Object.entries(groups)),
    ), SUSPENSE
)
