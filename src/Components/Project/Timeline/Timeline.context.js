import { bind, SUSPENSE } from "@react-rxjs/core";
import * as _ from 'underscore';
import { combineLatest, from, map, switchMap, tap, filter, toArray, of, take, withLatestFrom } from "rxjs";
import { DepartmentBoardItems$, FilteredBoardItemIds$, GroupedBoardItems$ } from "../Context/Project.Objects.context";
import { AssignedArtists$, AssignedTimeline$, BoardItemName$, BoardItemStatus$ } from "../Context/Project.Item.context";
import { CurrentReview$ } from "../Context/Project.Review.context";
import moment from 'moment';
import { ItemSummary } from "../ProjectItem/ItemSummary.component";
import { BoardFilters$, BoardReverseSorting$, BoardSortBy$ } from "../Context/Project.Params.context";

export const [useTimelineRows, TimelineRows$] = bind(
    GroupedBoardItems$.pipe(
        map(groups => groups.map(g => g[0])),
        map(groups => groups.map(g => {
            return {
                id: g,
                label: g,
                children: [],
                expanded: false,
                classes: 'tl-row'
            }
        }))
    ), SUSPENSE
)

export const GoogleTimelineColumns = [
    { type: "string", id: "Id" }, 
    { type: "string", id: "Name" },
    { type: "date", id: "Start" },
    { type: "date", id: "End" },
  ];

  export const [, TimelineItemData$] = bind( 
      (id, reviewId) =>
            combineLatest([
                of(id), AssignedArtists$(id, reviewId), AssignedTimeline$(id, reviewId), 
                BoardItemName$(id), BoardItemStatus$(id),
            ]).pipe(
                map(([id, artists, timeline, [element, task], status]) => {
                    if (!timeline?.text || timeline?.text?.indexOf(' - ') < 0)
                        return null;
                    const [sy, sm, sd] = timeline.text.split(' - ')[0].split('-')
                    const [ey, em, ed] = timeline.text.split(' - ')[1].split('-')
                    return {id, name: task ? `${element}, ${task}` : element, start: new Date(sy, sm, sd), 
                    end: new Date(ey, em, ed), status, 
                    artists: artists?.length ? artists.join(', ') : 'Unassigned'}
                }),
            )
  )


const ParseResourceItem = (item, index, parentId) => {
    if (!item.Timeline?.text?.length)
        return null;

    const tl = item.Timeline?.text.split(' - ');
    let name = item.name;
    let task = null;
    if (name.indexOf('/') >= 0) {
        name = item.name.split('/')[0]
        task = item.name.split('/')[1]
    }

    return {
        index,
        id: item.id,
        title: name, 
        task,
        department: item.Department?.text
      }
}

const ParseResourceEvent = (item, index, parentId) => {
    if (!item.Timeline?.text?.length)
        return null;


    const tl = item.Timeline?.text.split(' - ');
    const color = item.Status?.info?.color || 'black'
    let name = item.name;
    let task = null;
    if (name.indexOf('/') >= 0) {
        name = item.name.split('/')[0]
        task = item.name.split('/')[1]
    }
    return {
        index:index,
        review: item.CurrentReview,
        feedback: item.FeedbackDepartment?.text || "Internal",
        resourceId: item.id,
        title: task,
        task,
        artist: item.CurrentArtist,
        status: item.CurrentStatus,
        backgroundColor: color,
        eventTextColor: 'white',
        start: moment(tl[0]).toDate(),
        end: moment(tl[1]).toDate(),
        progress: 100,
      }
}
const FilteredBoardItems$ = 
    combineLatest([GroupedBoardItems$, DepartmentBoardItems$, FilteredBoardItemIds$, BoardReverseSorting$]).pipe(

    map(([groups, items, filteredIds, reversed]) => {
        let ids = Array.isArray(groups[1]) ? _.flatten(groups.map(g => g[1])) : groups;
        let filteredItems = items.filter(i => filteredIds.indexOf(i.id) >= 0);
        const sorted = _.sortBy(filteredItems, i => ids.indexOf(i.id));
        if (reversed)
            return sorted.reverse();
        return sorted;
    })
)

export const [useTimelineResources,] = bind(
    FilteredBoardItems$.pipe(
        map(items => {
            if (!items || items.length < 1)
                return [];

            const res = []
            _.forEach(items, (i, index) => {
                res.push(ParseResourceItem(i, index));
            });

            return res;
        }),
        map(items => items.filter(i => !!i)),
    ), SUSPENSE
)
export const [useTimelineEvents,] = bind(
    FilteredBoardItems$.pipe(
        map((items) => {
            if (!items || items.length < 1)
                return [];

            const res = []
            _.forEach(items, (i, index) => {
                res.push(ParseResourceEvent(i, index));
            });

            return res;
        }),
        map(items => items.filter(i => !!i)),
    ), SUSPENSE
)


export const [, GoogleTimelineData$] = bind(
    DepartmentBoardItems$.pipe(
         map(items => {
             if (!items || items.length < 1)
                 return [];
 
             return _.map(items, i => {
 
                 if (!i.CurrentTimeline?.length || i.CurrentTimeline.indexOf(' - ') < 0)
                     return null;
 
                 const dateArr = i.CurrentTimeline.split(' - ');
                 const start = moment(dateArr[0]).toDate();
                 const end = moment(dateArr[1]).toDate();
                 let element = i.name;
                 let task = null;
                 if (i.name.indexOf('/') > 0) {
                     const nameArr = i.name.split('/');
 
                     element = nameArr.shift();
                     task = nameArr.join("/");
                 }
 
                 const status = i.Status?.info?.color ? {text: i.Status.text || 'Not Started', color: i.Status.info.color || 'black'} : 
                     {text: 'Not Started', color: 'black' }
                 return {id: i.id, name: task ? `${element}, ${task}` : element, start, 
                     end, status, extended: i,
                     artists: i.CurrentArtist?.length ? i.CurrentArtist.join(", "): 'Unassigned'}
             })
         }),
         map(items => items.filter(i => !!i)),
     ), SUSPENSE
 )
 

export const [useGooleTimelineRows, GoogleTimelineRows$] = bind(
    GoogleTimelineData$.pipe(
        map(items => items.map(i => [`${i.name}`, `${i.status.text}`, i.start, i.end])),
    ), SUSPENSE
)

export const [useGoogleTimelineColors, GoogleTimelineColors$] = bind(
    GoogleTimelineData$.pipe(
        map(items => items.map(i => i.status.color)),
    ), SUSPENSE
)
