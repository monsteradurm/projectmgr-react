import { Stack } from "react-bootstrap";
import moment from 'moment';
import { calculateBusinessDays } from "../../../Helpers/Timeline.helper";

export const TimelineTooltipContent = ({task, fontSize, fontFamily}) => {
    const range = calculateBusinessDays(moment(task.start), moment(task.end));
    return (<Stack gap={2} style={{background: 'white', borderRadius: 5, border: 'solid 1px black', fontFamily: 'Open Sans'}}>
            <Stack direction="horizontal" gap={3} style={{borderBottom: 'solid 1px black', paddingBottom: 5, paddingTop: 5,
                paddingLeft: 10, paddingRight: 10, background: task.status.color, color: 'white'}}>
                <div style={{fontWeight: 600}}>{task.name}</div>
                <div>({task.status.text})</div>
            </Stack>
            <div style={{paddingLeft: 10, paddingRight: 10, paddingBottom: 10, fontWeight: 300, fontSize: 14}}>
            {
                task.artists?.length ?
                <div>{task.artists.join(', ')}</div> :
                <div>Unassigned</div>
            }
            <div style={{float: 'right', color: '#333', fontSize: 14, fontWeight: 300, paddingTop: 5}}>{range} days</div>
            </div>
        </Stack>
        )
}