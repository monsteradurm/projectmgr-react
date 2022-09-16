import { bind, SUSPENSE } from "@react-rxjs/core";

import { FilteredItems$ } from "../Charts/Charts.context";
import * as _ from 'underscore';
import { combineLatest, concatMap, from, map, switchMap, tap, filter, toArray, scan, of, withLatestFrom, take } from "rxjs";
import { FilteredBoardItemIds$, GroupedBoardItems$ } from "../Context/Project.Objects.context";
import { AssignedArtists$, AssignedTimeline$, BoardItemName$, BoardItemStatus$ } from "../Context/Project.Item.context";
import { CurrentReview$ } from "../Context/Project.Review.context";
import { SvelteGantt, SvelteGanttTable } from 'svelte-gantt';
import moment from 'moment';


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
  export const [, ParseTimelineData$] = bind( 
      items => 
        from(items).pipe(
            switchMap(id => CurrentReview$(id).pipe(
                    switchMap(reviewId =>  TimelineItemData$(id, reviewId))
                )
            ),
            take(items.length),
            toArray(),
        )
  )

  export const [, GoogleTimelineData$] = bind(
    GroupedBoardItems$.pipe(
        map(groups => groups.map(g => g[1])),
        map(groupIds => _.flatten(groupIds)),
        switchMap(items => ParseTimelineData$(items)),
        map(items => items.filter(i => !!i)),
        tap(t => console.log("ITEMS", t))
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
