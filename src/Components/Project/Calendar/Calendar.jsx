import React, { useEffect, useLayoutEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react' // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import { useCalendarEvents } from './Calendar.context'
import { Stack } from 'react-bootstrap'
import { BreedingRhombusSpinner } from 'react-epic-spinners'
import { AddQueueMessage, RemoveQueueMessage, useBusyMessage } from '../../../App.MessageQueue.context'
import { SUSPENSE } from '@react-rxjs/core'
import "./Calendar.scss"

const CAL_ID = '/Calendar'
export const ProjectCalendar = ({}) => {
    const [initializing, setInitializing] = useState(true);
    const BusyMessage = useBusyMessage(CAL_ID);
    const events = useCalendarEvents();

    useLayoutEffect(() => {
        AddQueueMessage(CAL_ID, 'init-calendar', 'Retrieving Timeline Data...');
    }, []);

    useEffect(() => {
        if ( [events].indexOf(SUSPENSE) < 0 ) {
            RemoveQueueMessage(CAL_ID, 'init-calendar');
            setInitializing(false);
        }
    }, [events])

    const renderEventContent = (eventInfo) => {
        const item = eventInfo.event.extendedProps;
        let task;
        let element = item.name;
        if (element.indexOf('/') >= 0) {
            [element, task] = element.split('/');
        }
        return (
          <Stack direction="vertical" style={{padding: '10px 20px'}}>
                <div style={{fontWeight: 600, fontSize: 18}}>{element}</div>
                <Stack direction="horizontal" gap={1}>
                <div style={{fontWeight: 400}}>{task}</div>
                {
                    item.CurrentReview && 
                    <div>({item.CurrentReview.name})</div>
                }
                </Stack>
                <div className="my-auto"></div>
                <Stack direction="horizontal">
                    <div className="mx-auto"></div>
                    <div>{item.CurrentArtist}</div>
                </Stack>
                
          </Stack>
        )
    }

    return (
        <div id="pm-calendar">
            {
                BusyMessage || initializing ? 
                <Stack direction="vertical" className="mx-auto my-auto" 
                style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                    <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                    <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                        {BusyMessage?.message}
                    </div>
                </Stack> : 
                <div  style={{marginTop: 30}}>
                <FullCalendar events={events} plugins={[ dayGridPlugin ]} height="auto"
                initialView="dayGridMonth" eventContent={renderEventContent} />
                </div>
            }
            
        </div>
    )
}