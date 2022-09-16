import { bind, SUSPENSE } from "@react-rxjs/core";
import { map } from "rxjs";
import { GoogleTimelineData$ } from "../Timeline/Timeline.context";
import * as _ from 'underscore';

export const [useCalendarEvents, CalendarEvents$] = bind(
    GoogleTimelineData$.pipe(
        map(items => _.map(items, i => {
            console.log(i.name);
            return { 
                title: i.name, id: i.id, start: i.start, end: i.end,
                backgroundColor: i.status.color, allDay: true,
                extendedProps: i
            }
        }))
    ), SUSPENSE
)   