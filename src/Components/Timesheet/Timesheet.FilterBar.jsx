import { Calendar } from "primereact";
import { Stack } from "react-bootstrap"
import { useIsAdmin } from "../../App.Users.context";
import { SetTimesheetRange, SetTimesheetSubmissionRange, useTimesheetRange, useTimesheetSubmissionRange, useTimesheetView } from "./Timesheet.context"

const SetRange = (val) => {
    console.log(val);
}

export const TimeSheetFilterBar = ({}) => {

    const Range = useTimesheetRange();
    const SubmissionRange = useTimesheetSubmissionRange();
    const View = useTimesheetView();

    return <div key="search_filter" className="pm-filterbar">
        <Stack direction="horizontal">
            <div className="mx-auto"></div>
            {
                View === 'Submissions' ? 
                <Calendar id="range" value={SubmissionRange} onChange={(e) => SetTimesheetSubmissionRange(e.value)} 
                        selectionMode="range" showIcon panelClassName="pm-timesheet-range"/>
                : <Calendar id="range" value={Range} onChange={(e) => SetTimesheetRange(e.value)} 
                        selectionMode="range" showIcon panelClassName="pm-timesheet-range"/>
            }
        </Stack>
    </div>
}