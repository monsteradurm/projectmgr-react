import { bind, SUSPENSE } from "@react-rxjs/core";
import { BehaviorSubject, combineLatest, concat, concatAll, concatMap, toArray,
    concatWith, debounceTime, EMPTY, filter, from, map, merge, of, reduce, scan, switchMap, take, tap, withLatestFrom } from "rxjs";
import { SyncsketchService } from "@Services/Syncsketch.service";
import { Board$, Group$, Project$ } from "./Project.Objects.context";
import { ReviewById, ReviewLink$ } from "./Project.Review.context";
import * as _ from 'underscore';
import { combineKeys, createSignal, partitionByKey } from "@react-rxjs/utils";
import { ReadyOrSuspend$ } from "@Helpers/Context.helper";
import { BoardItem$, BoardItemName$ } from "./Project.Item.context";
import { SyncsketchQueries } from "../../../Environment/Syncsketch.environment";
import { AddRepoMessage, PROJ_QID, RemoveRepoMessage } from "./Project.context";
import { AttrOrSuspend, AttrOrSuspend$ } from "../../../Helpers/Context.helper";
import { AddQueueMessage, RemoveQueueMessage } from "../../../App.MessageQueue.context";
import { compareByFieldSpec } from "@fullcalendar/react";
import { FirebaseService } from "../../../Services/Firebase.service";
import { UPLOAD_QID } from "../TableView/TableItemDlgs/TableItem.UploadReview";



const [useSyncsketchProject, SyncsketchProject$] = bind(
    Project$.pipe(
        switchMap(project => {
            if (!project?.name || project === SUSPENSE)
                return EMPTY;

            const name = project.name;
            const key = "Syncsketch/Project/" + name;
            const stored = sessionStorage.getItem(key);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    return of(data);
                }
                catch { }
            }
            return SyncsketchService.FindProject$(project.name).pipe(
                take(1),
                tap(result => {
                    if (result)
                        sessionStorage.setItem(key, JSON.stringify(result))
                })
            )
        })
    ), SUSPENSE
);

const SyncsketchProjectId$ = AttrOrSuspend$(SyncsketchProject$, 'id');

const [useSyncsketchGroups, SyncsketchGroups$] = bind(
    SyncsketchProject$.pipe(
        tap(t => console.log("SyncsketchProject$", t)),
        map(project => {
            if (project === SUSPENSE)
                return SUSPENSE;
            if (!project)
                return null;
            return project.settings?.groups?.values;
        })
    ),
)
const [useSyncsketchGroup, SyncsketchGroup$] = bind(
    combineLatest([SyncsketchGroups$, Board$]).pipe(
        map(([groups, board]) => {
            if (groups === SUSPENSE || board === SUSPENSE)
                return SUSPENSE;

            else if (!groups < groups.length < 1) return null;

            const review = _.find(groups, g => g.name === board.name);
            if (review)
                return review;

            return null;
        }),
        map(group => group ? group : null),
    ), SUSPENSE
)


const SyncsketchGroupId$ = AttrOrSuspend$(SyncsketchGroup$, 'uuid');

const syncReviewParams$ = combineLatest([SyncsketchProject$, Group$, SyncsketchGroup$]).pipe(
    switchMap(params => !!_.find(params, p => p === SUSPENSE) ? EMPTY : of(params)),
    //tap(() => AddQueueMessage(PROJ_QID, 'get-sync-reviews', 'Retrieving Syncsketch Reviews...'))
);

export const KEY_CREATE_SS_REVIEW = 'create-ss-review';
const [CreateSyncsketchReviewEvent$, CreateSyncsketchReview] = createSignal(
    (review_name, department, itemId) => {
        combineLatest([SyncsketchProjectId$, SyncsketchGroupId$]).pipe(
            tap(t => AddQueueMessage(UPLOAD_QID, 'create-ss-review', 'Creating Syncsketch Review...')),
            switchMap(([project_id, group_id]) => 
                SyncsketchService.CreateReview$(project_id, group_id, itemId, review_name, department).pipe(
                    take(1)
                )
            ),
            take(1)
        ).subscribe(result => {
            console.log("CREATE REVIEW: ", result);
        })
    }
)

const [useSyncsketchProjectReviews, SyncsketchProjectReviews$] = bind(
    syncReviewParams$.pipe(
        switchMap(([syncProject, group, syncGroup]) => {
            const params = [syncProject,group, syncGroup];
            if (params.indexOf(null) >= 0)
                return of(null)
            return SyncsketchService.ReviewsByProjectId$(syncProject.id, syncGroup.uuid).pipe(
                filter(review => review?.name?.startsWith(group.title)),
            )
        }),
        scan((acc, review) => {
            if (!review?.element)
                return acc;

            if (!acc[review.element])
                acc[review.element] = []

            const reviews = acc[review.element];
            if (review.action !== 'removed')
                acc[review.element] = [...reviews.filter(r => r.id !== review.id), review]
            else 
                acc[review.element] = reviews.filter(r => r.uuid !== review.uuid);

            return acc;
        },{}),
        map(map => Object.entries(map)),
        concatMap(entries => from(entries))
    ), SUSPENSE
)

const [SyncsketchReviewsByElement, SyncReviewElements$] = partitionByKey(
    SyncsketchProjectReviews$,
    x => x[0],
    $ => $.pipe(map(x => x[1]))
)

const [useSyncsketchReviewsFromElement, SyncsketchReviewsByElement$] = bind(
    element => 
    SyncReviewElements$.pipe(
        switchMap(elements => elements === SUSPENSE ? EMPTY : of(elements)),
        map(elements => _.filter(elements, e => !!e && e != SUSPENSE)),
        switchMap(elements => elements?.indexOf(element) >= 0 ? 
            SyncsketchReviewsByElement(element).pipe(
                map(reviews => {
                    if (reviews === SUSPENSE)
                        return SUSPENSE;
                    return reviews;
                }),
            ) : of(null)
        )
    ), SUSPENSE
)

const [useSyncsketchReviewDepartments, syncsketchReviewDepartments$] = bind(
    element => SyncsketchReviewsByElement(element).pipe(
        map(reviews => reviews && reviews !== SUSPENSE ? 
            _.uniq(_.pluck(reviews, 'department')) : []),
    ), SUSPENSE
)

const [useSyncsketchReview, SyncsketchReview$] = bind(
    (element, feedbackDepartment) =>  
    SyncsketchReviewsByElement(element).pipe(
        map(reviews => {
            if(reviews === SUSPENSE)
                return SUSPENSE;

            if (reviews === null || reviews === undefined)
                return null;

            return reviews.filter(r => r.department === feedbackDepartment)
        }),
        map(reviews => reviews.length > 0 ? reviews[0] : null),
    ), SUSPENSE
)


const _thumbnailStore$ = new BehaviorSubject({});

const ItemFromSyncLink$ = (link, groupId, projectId) => {
    const linkArr = link.split('/#/').filter(x => x && x.length > 0);
    const itemId = linkArr[1].indexOf('/') > 0 ? _.last(linkArr[1].split('/')) : linkArr[1];
    const sketchId = _.last(linkArr[0].split('/'));
    return SyncsketchService.ItemByIds$(itemId, sketchId, groupId, projectId);
}

const ItemIdFromSyncLink = (link) => {
    const linkArr = link.split('/#/').filter(x => x && x.length > 0);
    return linkArr[1].indexOf('/') > 0 ? _.last(linkArr[1].split('/')) : linkArr[1];
}

const [useSyncsketchItem, SyncksetchItem$] = bind(
    reviewId =>
    combineLatest([SyncsketchGroupId$, SyncsketchProjectId$]).pipe(
        switchMap(params => {
            if (params.indexOf(SUSPENSE) > -1)
                return of(SUSPENSE);

            else if (params.indexOf(null) > -1 || params.indexOf(undefined) > -1)
                return of(null);

            return ReviewLink$(reviewId).pipe(
                switchMap(link => {
                    if (link === SUSPENSE)
                        return of(SUSPENSE);
                    else if (!link)
                        return of(null);

                    return ItemFromSyncLink$(link, ...params);
                })
            )
        }),
    )
)

const [, SyncsketchItems$] = bind(
    reviewId =>
    combineLatest([SyncsketchProjectId$, SyncsketchGroupId$]).pipe(
        tap(t => console.log("SyncsketchItems$", t)),
        switchMap(params => {
            if (params.indexOf(SUSPENSE) > -1)
                return of(SUSPENSE);

            else if (params.indexOf(null) > -1 || params.indexOf(undefined) > -1)
                return of(null);

            else if (reviewId === SUSPENSE)
                return of(SUSPENSE);
            
            else if (!reviewId)
                return of(null);

            return SyncsketchService.ItemChangesByReview$(...params, reviewId)
        }),
        scan((acc, item) => {
            if (!item?.name || !item?.action)
                return acc;

            const nameArr = item.name.split(' ');
            const dep = nameArr[0];
            let index = nameArr[1];

            let subindex = 0;
            if (index.indexOf('.') >= 0) {
                const indexArr = index.split('.');
                index = indexArr[0]
                subindex = indexArr[1];
            }

            item = {...item, subindex, index};
            const key = `${dep}_${index}`;
            
            if (!acc[key])
                acc[key] = []

            let items = [...acc[key].filter(i => i.id !== item.id)];
            if (item.action !== 'removed')
                acc[key] = [...items, item];
            else 
                acc[key] = items;
            return acc;
        }, {}),
    )
)

const [useSyncsketchItems,] = bind(
    (reviewId, department, index) => ReadyOrSuspend$(reviewId, SyncsketchItems$).pipe(
        switchMap(items => {
            console.log(items);
            if ([items, department, index].indexOf(SUSPENSE) >= 0)
                return EMPTY;

            if (!items || !department || !index)
                return of(null);

            const key = department + '_' + index;
            const result = items[key];
            return result ? of(_.sortBy(result, r => r.subindex).reverse()) : of([]);
        })
    ),SUSPENSE
)

const [useSyncsketchThumbnail, SyncsketchThumbnail$] = bind(
    itemId => 
    of(itemId).pipe(
        switchMap(id => SyncsketchService.ThumbnailFromId$(id))
    ), SUSPENSE
)
const [useSyncsketchComments, SyncsketchComments$] = bind(
    itemId => 
    of(itemId).pipe(
        switchMap(id => SyncsketchService.AllFeedback$(id))
    ), SUSPENSE
)
const [useLatestThumbnail, LatestThumbnail$] = bind(
    reviewId => 
    ReadyOrSuspend$(reviewId, ReviewLink$).pipe(
        switchMap(link => {
            if (link === SUSPENSE) return of(SUSPENSE);
            else if (!link) return of(null);
            
            const id = ItemIdFromSyncLink(link);
            return SyncsketchService.ThumbnailFromId$(id);
        }),
        
    ), SUSPENSE
)

const HandleDelete = (res) => {
    console.log(res);
}
const DeleteSyncsketchItem$ = (item) => {
    return SyncsketchService.ItemById$(item.id).pipe(
        switchMap(res => {
            if (res?.active)
                 return SyncsketchService.DeleteItems$([item.id]).pipe(
                     take(1),
                     switchMap(() => FirebaseService.DeleteSyncsketchItem(item))
                )
             return FirebaseService.DeleteSyncsketchItem(item);
         })
     )
}
const DeleteSyncsketchItem = (item) => {
    DeleteSyncsketchItem$(item).subscribe(HandleDelete);
}

const DeleteMultipleSyncsketchItems$ = (itemArray) => {
    console.log("Removing SyncsketchItems", itemArray);
    return from(itemArray).pipe(
        concatMap(item => DeleteSyncsketchItem$(item)),
        take(itemArray.length),
        toArray()
    )
}

export {
    LatestThumbnail$,
    SyncsketchItems$,
    SyncsketchReview$,
    useSyncsketchProject,
    useSyncsketchGroup,
    useSyncsketchReview,
    useLatestThumbnail,
    useSyncsketchThumbnail,
    useSyncsketchReviewsFromElement,
    useSyncsketchComments,
    //useSyncsketchReviewsByElement,
    useSyncsketchProjectReviews,
    useSyncsketchReviewDepartments,
    useSyncsketchItems,
    CreateSyncsketchReview,
    syncsketchReviewDepartments$,
    SyncsketchReviewsByElement$,
    SyncsketchProject$,
    SyncsketchGroup$,
    SyncsketchThumbnail$,
    ItemIdFromSyncLink,
    DeleteSyncsketchItem,
    DeleteMultipleSyncsketchItems$
}