import { Stack } from "react-bootstrap";
import moment from 'moment';
import { calculateBusinessDays } from "../../../Helpers/Timeline.helper";

export const TimelineTooltipContent = ({task, fontSize, fontFamily}) => {
    const range = calculateBusinessDays(moment(task.start).startOf('day'), moment(task.end).endOf('day'));
    const review = task.review || null;
    return (<Stack gap={2} style={{background: 'white', borderRadius: 5, border: 'solid 1px black', fontFamily: 'Open Sans'}}>

            <Stack direction="horizontal" gap={3} style={{borderBottom: 'solid 1px black', paddingBottom: 5, paddingTop: 5,
                paddingLeft: 10, paddingRight: 10, background: task.status.color, color: 'white'}}>
                <div style={{fontWeight: 600}}>{task.name}
                {
                    task.task &&
                    <span>,<span style={{marginLeft:5}}>{task.task}</span></span>
                }
                </div>
                <div style={{fontWeight: 600}}>({task.status.text})</div>
            </Stack>
            {
                review &&
                <Stack direction="horizontal" style={{padding: 5, fontSize: 15, fontWeight: 600}} gap={3}>
                    <div>{review.name}</div>
                    <div>({review.FeedbackDepartment?.text || "Internal"})</div>
                </Stack>

            }
            <Stack direction="horizontal" style={{padding: 5, fontSize: 15, fontWeight: 400}}>
                <div>
                {
                    task.artists?.length ?
                    <div>{task.artists.join(', ')}</div> :
                    <div>Unassigned</div>
                }
                </div>
                <div className="mx-auto"></div>
                <div>{range} days</div>
            </Stack>
        </Stack>
        )
}