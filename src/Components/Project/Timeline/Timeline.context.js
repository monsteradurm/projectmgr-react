import { bind, SUSPENSE } from "@react-rxjs/core";
import * as _ from 'underscore';
import { combineLatest, from, map, switchMap, tap, filter, toArray, of, take } from "rxjs";
import { DepartmentBoardItems$, GroupedBoardItems$ } from "../Context/Project.Objects.context";
import { AssignedArtists$, AssignedTimeline$, BoardItemName$, BoardItemStatus$ } from "../Context/Project.Item.context";
import { CurrentReview$ } from "../Context/Project.Review.context";
import moment from 'moment';
import { ItemSummary } from "../ProjectItem/ItemSummary.component";

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
                tap(t => console.log("TIMELINE ITEM DATA", t)),
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
        tap(t => console.log("ITEMS", t))
    ), SUSPENSE
)


const ParseFrappeItem = (item, parentId) => {
    if (!item.Timeline?.text?.length)
        return null;

    console.log(item.Status);
    const tl = item.Timeline?.text.split(' - ');
    const color = item.Status?.info?.color || 'black'
    let name = item.name;
    let task = null;
    if (name.indexOf('/') >= 0) {
        name = item.name.split('/')[0]
        task = item.name.split('/')[1]
    }
    return {
        review: item.CurrentReview,
        id: item.id,
        name,
        task,
        start: moment(tl[0]).toDate(),
        end: moment(tl[1]).toDate(),
        progress: 100,
        status: { color, text: item.CurrentStatus || 'Not Started' },
        styles: { progressColor: color, progressSelectedColor: color },
      }
}

export const [useFrappeData, FrappeData$] = bind(
    DepartmentBoardItems$.pipe(
        map(items => {
            if (!items || items.length < 1)
                return [];

            const res = []
            _.forEach(items, i => {
                res.push(ParseFrappeItem(i));
            });

            return res;
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
        tap(t => console.log("COLORS: ", t))
    ), SUSPENSE
)
