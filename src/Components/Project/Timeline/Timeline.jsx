import { SUSPENSE } from '@react-rxjs/core';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useEffect, useLayoutEffect, useState } from 'react';
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
const TL_ID = '/Timeline'

const EmptyComponent = () => {
    return <></>
}

const renderEventContent = (data) => {
    const event = data.event;
    const item = event.extendedProps;
    return <Stack direction="vertical" style={{textAlign: 'center', justifyContent: 'center'}}>
        {
            item.artist &&
            <div style={{ left: -160, position: 'absolute'}}>
                <SupportUsers artists={item.artist} id={event.id}
                    color={event.backgroundColor} align="left"/>
            </div>
        }
        {
            item.review ?
            <>
                <div>{item.review.name}</div>
                <div>({item.status})</div>
            </>
            : <div>{item.status}</div>
        }
        
    </Stack>
}
const ResourceLabel = (data) => {
    const resource = data.resource;
    const item = resource.extendedProps;
    console.log("ResourceLabel", item)
    return <Stack direction="vertical" style={{textAlign: 'right', position:'relative'}}>
        <div style={{fontSize:16, fontWeight: 600}}>{resource.title}</div>
        <div>{item.task}</div>
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
    useLayoutEffect(() => {
        AddQueueMessage(TL_ID, 'init-timeline', 'Retrieving Timeline Data...');
    }, []);

    useEffect(() => {
        if ( [Resources, Events].indexOf(SUSPENSE) < 0 ) {
            RemoveQueueMessage(TL_ID, 'init-timeline');
            setInitializing(false);
        }
        
    }, [Resources, Events])

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
                eventContent={renderEventContent}
                initialView="resourceTimelineWeek" schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives" />

                
            }
            
        </div>
    )

}

/*
<Gantt tasks={data} style={{marginTop: 20}} headerHeight={100} rowHeight={30} viewMode={ViewMode.Day}
                    TooltipContent={TimelineTooltipContent}
                    TaskListHeader={EmptyComponent} TaskListTable={EmptyComponent}/>
*/