import { SUSPENSE } from '@react-rxjs/core';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react' // must go before plugins
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { Stack } from 'react-bootstrap';
import { BreedingRhombusSpinner } from 'react-epic-spinners';
import { AddQueueMessage, RemoveQueueMessage, useBusyMessage } from '../../../App.MessageQueue.context';
import {useTimelineResources, useTimelineEvents } from './Timeline.context';
import { TimelineTooltipContent } from './Timeline.TooltipContent';
import { Chart } from "react-google-charts";
import moment from 'moment';
import "./Timeline.scss";
import { useCalendarEvents } from '../Calendar/Calendar.context';
import { SupportUsers } from '../../Support/Support.Users';
import { useBoardFilters } from '../Context/Project.Params.context';
import { useSearchParams } from 'react-router-dom';
import { toggleArrFilter } from '../Overview.filters';
const TL_ID = '/Timeline'

const EmptyComponent = () => {
    return <></>
}

const ResourceLabel = (data) => {
    const resource = data.resource;
    const item = resource.extendedProps;
    console.log("ResourceLabel", item)
    return <Stack direction="vertical" className="my-auto" style={{textAlign: 'right', position:'relative', justifyContent: 'center', height: '100%'}}>
        <div style={{fontSize:15, fontWeight: 600}}>{resource.title}</div>
        <div style={{fontSize: 14}}>{item.task}</div>
    </Stack>
}

const RenderTimeline = ({rows, columns, colors}) => {
    const [chart, setChart] = useState(null);
    return (
        <div className="container" style={{marginTop: 20}}>
            <Chart chartType="Timeline" data={[columns, ...rows]} 
            options={{colors, allowHtml: true,}}
            width="100%" height="400px" />;
        </div>        
    )
}

export const ProjectTimeline = ({}) => {
    const [initializing, setInitializing] = useState(true);
    const BusyMessage = useBusyMessage(TL_ID);
    const Resources = useTimelineResources();
    const Events = useTimelineEvents();
    const calendarRef = useRef();
    const [searchParams, setSearchParams] = useSearchParams();
    useLayoutEffect(() => {
        AddQueueMessage(TL_ID, 'init-timeline', 'Retrieving Timeline Data...');
    }, []);

    useEffect(() => {
        if ( [Resources, Events].indexOf(SUSPENSE) < 0 ) {
            RemoveQueueMessage(TL_ID, 'init-timeline');
            setInitializing(false);
        }

    }, [Resources, Events])

    const renderEventContent = (data) => {
        const event = data.event;
        const item = event.extendedProps;
        //BoardFeedbackDepartmentFilter
        const statusHTML = <Stack direction="horizontal" gap={2} style={{justifyContent: 'center'}}>
            <div className="pm-tag" onClick={() => 
                toggleArrFilter(item.status, 'BoardStatusFilter', searchParams, setSearchParams)}>{item.status}</div>
            <div>(<span className='pm-tag' onClick={() => 
                toggleArrFilter(item.feedback, 'BoardFeedbackDepartmentFilter', searchParams, setSearchParams)}>{item.feedback}</span>)</div>
        </Stack>
        return <Stack direction="vertical" style={{textAlign: 'center', justifyContent: 'center', fontSize:15}}>
            {
                item.artist &&
                <div style={{ left: -160, position: 'absolute'}}>
                    <SupportUsers artists={item.artist} id={event.id}
                        color={event.backgroundColor} align="left"/>
                </div>
            }
            {
                item.review &&
                <>
                    <div>{item.review.name}</div>
                </>
            }
            {
                statusHTML
            }
        </Stack>
    }

    return (
        <div id="pm-timeline" style={{marginTop: 20}}>
            {
                BusyMessage || initializing ? 
                <Stack direction="vertical" className="mx-auto my-auto" 
                style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                    <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                    <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                        {BusyMessage?.message}
                    </div>
                </Stack> : 
                <FullCalendar events={Events} resources={Resources} plugins={[ resourceTimelinePlugin ]} height="auto"
                    slotDuration="24:00:00" slotLabelFormat={[
                        { day: 'numeric', weekday: 'short',  } // lower level of text
                    ]} resourceAreaWidth="350px" resourceLabelContent={ResourceLabel} resourceAreaHeaderContent={<div style={{textAlin:'right'}}>Item</div>}
                    eventContent={renderEventContent} ref={calendarRef} eventOrderStrict={true} eventOrder="index" resourceOrder="index"
                    initialView="resourceTimelineWeek" schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives" />

                
            }
            
        </div>
    )

}