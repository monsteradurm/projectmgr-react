import { bind, SUSPENSE } from "@react-rxjs/core";
import { ReadyOrSuspend$ } from "@Helpers/Context.helper";
import { RawBoardItems$, TagOptions$ } from "./Project.Objects.context";
import * as _ from 'underscore';
import { concatMap, map, from, tap, of, combineLatest, withLatestFrom, switchMap, mergeMap, EMPTY } from "rxjs";
import { partitionByKey } from "@react-rxjs/utils";
import { BoardItem$, BoardItemMap$, BoardItemName$, GetItemTags, GetPersonValues } from "./Project.Item.context";
import { syncsketchReviewDepartments$ } from "./Project.Syncsketch.context";
import moment from 'moment';

// Observable of first board item with subitems
// derive subitem columns from first subitem
const [, ReviewColumns$] = bind(
    RawBoardItems$.pipe(
        // first board item with subitems
        map(items => _.find(items, i => i.subitems?.length)),
        // first subitem of board item
        map(item => !!item ? item.subitems[0] : {}),
        // subitem columns will have the id property
        map(item => Object.keys(item)
            .filter(k => !!item[k].id)
            // only need id
            .map(k => ({id : item[k].id, title: k}))
        ),
        // array to stream
        concatMap(columnArray => from(columnArray)),
    )
)

// partition subitem column ids based on title
const [ReviewColumnMap, ReviewColumnMap$] = partitionByKey(
    ReviewColumns$,
    x => x.title,
    (column$) => column$.pipe(map(x => x.id))
)

// retrieve id from subitem column title
const [, ReviewColumnId$] = bind(
    (title) => ReviewColumnMap(title), SUSPENSE
);

// retrieve reviews for all boarditems
const [, ReviewMap$] = bind(
    RawBoardItems$.pipe(
        switchMap(items => items === SUSPENSE ? 
            EMPTY : from(items)),
        concatMap(x => x.subitems),
    ), []
)

const [useReviews, Reviews$] = bind(id => 
    BoardItem$(id).pipe(
        map(item => item.subitems || []),
        // valid subitems must have a name and feedback department
        map(subitems => subitems.filter(i => 
            i['Feedback Department']?.text?.length && i.name?.length)),
        // sort by subitem index, reverse so first is most recent
        map(subitems => _.sortBy(subitems, i => i.Index?.text || -1).reverse())
    ), SUSPENSE
)

// map review items based on id
const [ReviewById, ReviewIds$] = partitionByKey(
    ReviewMap$,
    x => x.id,
)

const [useReviewIds, ] = bind( 
    (boardItemId) =>
    Reviews$(boardItemId).pipe(
        map(reviews => _.pluck(reviews, 'id')),
    ), SUSPENSE
)

// retrieve review item from id
const [useReviewItem, ReviewItem$] = bind((reviewId) => ReviewById(reviewId), SUSPENSE);

// get id of current review (top of Reviews$)
const [useCurrentReviewId, CurrentReviewId$] = bind(
    (id) => 
        Reviews$(id).pipe(
            map(reviews => reviews.length ? reviews[0] : null),
            map(review => review?.id || null)
    ), SUSPENSE
)

// get current review of boarditem as observable
const [, CurrentReview$] = bind(
    (id) => 
        CurrentReviewId$(id).pipe(
            switchMap(id => id === SUSPENSE ? of(empty) : 
                !id ? of(null) : ReviewById(id))
    ), SUSPENSE
)

// get id of current review (top of Reviews$)
const [useBoardItemReview, BoardItemReview$] = bind(
    (reviewId) =>
        ReviewById(reviewId), SUSPENSE
)

// retrieve list of all review departments for item
const [useReviewDepartments, ReviewDepartments$] = bind(
    (id) => 
    BoardItemName$(id).pipe(
        switchMap(([element,]) => {
            if (!element || element === SUSPENSE)
                return EMPTY;
            return syncsketchReviewDepartments$(element);
        })
    ), []
)


// partition subitem column ids based on title
const [useDepartmentReviews, DepartmentReviews$] = bind(
    (id, dep) => 
    of(id).pipe(
        // intercept SUSPENSE
        switchMap(id => !id || id === SUSPENSE ?
            of(SUSPENSE) :
            Reviews$(id).pipe(
                map(reviews => reviews?.length ? reviews : []),
                map(reviews => {
                    if (dep === 'All')
                        return reviews;
                    return reviews.filter(r => r['Feedback Department']?.text === dep)
                }),
                map(reviews => _.pluck(reviews, 'id'))
            )
        )
    ), []
)
const [useReviewDelivered,] = bind(
    reviewId => 
    ReadyOrSuspend$(reviewId, ReviewById).pipe(
        map(item => {
            if (item === SUSPENSE)
                return SUSPENSE;
            if (item === null)
                return null;

            const delivered = item['Delivered Date'];

            console.log(delivered);
            if (!delivered || !delivered.text?.length)
                return null;

            const dateArr= delivered.text.split('-')
            
            return moment(new Date(...dateArr)).format('MMM DD, YYYY')
        })
    ), 'SUSPENSE'
)
const [useReviewDepartment, ReviewDepartment$] = bind(
    reviewId => 
    ReadyOrSuspend$(reviewId, ReviewById).pipe(
        map(item => {
            if (item === SUSPENSE)
                return SUSPENSE;
            if (item === null)
                return null;
            if (!item['Feedback Department'])
                return null;

            return item['Feedback Department'].text;
        })
    ), 'SUSPENSE'
)

const [useReviewName, ReviewName$] = bind(
    (reviewId) =>
    ReadyOrSuspend$(reviewId, ReviewById).pipe(
        map(item => item === SUSPENSE ? EMPTY : item?.name)
    ), 'SUSPENSE'
)

const [useReviewIndex, ReviewIndex$] = bind(
    (reviewId) => {
        return ReadyOrSuspend$(reviewId, ReviewById).pipe(
            map(item => item === SUSPENSE ? null : item?.Review?.text),
            map(index => index ? `00${index}`.slice(-3) : '000')
        )
    }, SUSPENSE
)
const [useReviewLink, ReviewLink$] = bind(
    (reviewId) => {
    return ReadyOrSuspend$(reviewId, ReviewById).pipe(
        map(item => item === SUSPENSE ? null : item?.Link?.text)
    )
    }, SUSPENSE
)
const [useReviewTags, ReviewTags$] = bind(
    (reviewId) => 
        combineLatest(
            [ReviewById(reviewId), TagOptions$]
        ).pipe(
            map(([item, tagOptions]) => {
                if (item === SUSPENSE || tagOptions === SUSPENSE)
                    return SUSPENSE;
                else if (!tagOptions || tagOptions.length < 1)
                    return [];
                else if (item === null)
                    return [];
                return GetItemTags(item.Tags, tagOptions);
            }),
    ), SUSPENSE
)

const [useReviewArtists, ReviewArtists$] = bind(
    reviewId =>
    ReadyOrSuspend$(reviewId, ReviewById).pipe(
            map(review => GetPersonValues(review?.Artist)),
    ), SUSPENSE
)

const [useReviewTimeline, ReviewTimeline$] = bind(
    (id) => 
        ReviewItem$(id).pipe(
            map((item) => item?.Timeline),
    ), SUSPENSE
)

export {
    ReviewById,
    useReviewName,
    useReviewDepartments,
    useReviewDepartment,
    useReviewTimeline,
    useCurrentReviewId,
    useDepartmentReviews,
    useReviewTags,
    useReviewLink,
    useReviews,
    useReviewItem,
    useReviewIds,
    useReviewIndex,
    useReviewDelivered,
    ReviewArtists$,
    ReviewTimeline$,
    ReviewLink$,
    ReviewDepartments$,
    CurrentReview$
}
