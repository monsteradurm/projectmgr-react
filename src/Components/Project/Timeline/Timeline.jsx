import { SUSPENSE } from '@react-rxjs/core';
import { Gantt, Task, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useEffect, useLayoutEffect, useState } from 'react';
import { Stack } from 'react-bootstrap';
import { BreedingRhombusSpinner } from 'react-epic-spinners';
import { AddQueueMessage, RemoveQueueMessage, useBusyMessage } from '../../../App.MessageQueue.context';
import { GoogleTimelineColumns, useGoogleTimelineColors, useGooleTimelineRows, useTimelineData, useTimelineRange, useTimelineRows, useTimelineTasks } from './Timeline.context';
import { TimelineTooltipContent } from './Timeline.TooltipContent';
import { Chart } from "react-google-charts";
import moment from 'moment';

const TL_ID = '/Timeline'

const EmptyComponent = () => {
    return <></>
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
    const rows = useGooleTimelineRows();
    const columns = GoogleTimelineColumns;
    const colors = useGoogleTimelineColors();

    useLayoutEffect(() => {
        AddQueueMessage(TL_ID, 'init-timeline', 'Retrieving Timeline Data...');
    }, []);

    useEffect(() => {
        if ( [rows, columns, colors].indexOf(SUSPENSE) < 0 ) {
            RemoveQueueMessage(TL_ID, 'init-timeline');
            setInitializing(false);
        }
    }, [rows, columns, colors])

    return (
        <>
            {
                BusyMessage || initializing ? 
                <Stack direction="vertical" className="mx-auto my-auto" 
                style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                    <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                    <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                        {BusyMessage?.message}
                    </div>
                </Stack> : <RenderTimeline rows={rows} columns={columns} colors={colors}/>    
            }
            
        </>
    )

}

/*
<Gantt tasks={data} style={{marginTop: 20}} TooltipContent={TimelineTooltipContent}
                TaskListHeader={EmptyComponent} TaskListTable={EmptyComponent}/>
*/