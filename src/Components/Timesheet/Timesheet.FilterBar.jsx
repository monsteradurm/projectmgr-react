import { Calendar } from "primereact";
import { Stack } from "react-bootstrap"
import { SetTimesheetRange, useTimesheetRange } from "./Timesheet.context"

const SetRange = (val) => {
    console.log(val);
}

export const TimeSheetFilterBar = ({}) => {

    const Range = useTimesheetRange();
    return <div key="search_filter" className="pm-filterbar">
        <Stack direction="horizontal">
            <div className="mx-auto"></div>
            <Calendar id="range" value={Range} onChange={(e) => SetTimesheetRange(e.value)} 
                    selectionMode="range" showIcon panelClassName="pm-timesheet-range"/>
        </Stack>
    </div>
}