import { Column, DataTable } from "primereact"
import { Stack } from "react-bootstrap"
import { SetSelectedLog, SheetRibbonColor, useLogContextMenu, useSelectedLog, useTimesheetView } from "./Timesheet.context";
import parse from 'html-react-parser'
import * as _ from 'underscore';

const BoardTemplate = (log) => {
    return <Stack direction="horizontal" style={{justifyContent: 'start', paddingTop: 10, fontSize: 18}} gap={2}>
        <div>{log?.ProjectId.replace('_', ' ')}, </div>
        <div>{log?.BoardName}</div>
    </Stack>
}

const ItemTemplate = (log) => {
    return <Stack direction="horizontal" style={{justifyContent: 'end', width: '100%', fontSize: 16}} gap={2}>
        <div>{log?.GroupName}, </div>
        <div>{log?.ItemName}</div>
    </Stack>
}

const ReviewTemplate = (log) => {
    return <Stack direction="horizontal" style={{justifyContent: 'start', width: '100%', fontSize: 16}} gap={2}>
        <div>{log?.ReviewName}</div>
        {
            log?.FeedbackDepartment?.length && 
            <div>({log.FeedbackDepartment})</div>
        }
    </Stack>
}

export const TimesheetLogs = ({sheet, logContextRef, SelectedLog, LogContextMenu}) => {
    const logs = _.sortBy(sheet?.logs || [], log => 
            log.GroupName + ', ' + log.ItemName + (log.ReviewName ? log.ReviewName : ''))
        .map(log => ({...log, grouping: log.ProjectId?.replace('_', ' ') + ', ' + log?.BoardName }));
    const primary = SheetRibbonColor(sheet);
    const View = useTimesheetView();
    return (
        <>
        <Stack direction="vertical" style={{padding: '10px 80px'}} className="pm-timesheet-logs">
            <DataTable value={logs} tableStyle={{borderColor: primary, borderWidth: 0}} rowGroupMode="subheader" 
                groupRowsBy="grouping"
                rowGroupHeaderTemplate={BoardTemplate}
                contextMenuSelection={SelectedLog}
                onContextMenuSelectionChange={e => SetSelectedLog(sheet, e.value)}
                onContextMenu={e => {
                    if (View !== 'Submissions')
                        logContextRef.current.show(e.originalEvent)
                }}>
                <Column body={ItemTemplate} style={{paddingLeft: 20}} className="log-item"/>
                <Column body={ReviewTemplate} className="log-item" />
                <Column header="Hours" field="hours" style={{width: 150, display: 'block', maxWidth: 150, textAlign:'center', fontWeight:600, fontSize: 16}}/>
                <Column header="Notes" field="notes" style={{width: '50%', textAlign:'left', justifyContent: 'start', minWidth: '50%', fontSize: 16}} />
            </DataTable>
            <div style={{borderBottom: 'solid 2px ' + primary, width: '100%', fontSize: 18, marginTop: 20, padding: 10, fontWeight: 600}}>Next Day</div>
            <div style={{fontSize: 18, marginTop: 10, padding: 10}}>
            {
                sheet?.tomorrow?.length ? 
                parse(sheet.tomorrow) : <span style={{fontStyle: 'italic'}}>No notes provided for the following day..</span>
            }
            </div>
            
        </Stack>
    </>)
}