import { SUSPENSE } from "@react-rxjs/core";
import { useContext } from "react";
import { Stack } from "react-bootstrap";
import { BoardItemContext, useBoardItemDescription, useBoardItemDirectors, useLastDelivered, useReviewCount } from "../../Context/Project.Item.context";
import parse from 'html-react-parser'
import { Loading } from "../../../General/Loading";
import { useTableItemLogs } from "../TableItem.context";
import { Column } from "primereact";
import { DataTable } from "primereact/datatable";
import { SupportUsers } from "../../../Support/Support.Users";
import { TableItemLogUsers } from "../TableItemControls/TableItem.LogUsers";
import moment from 'moment';
import "./TableItem.Pane.Logs.scss";

export const TableItemLogs = ({visible}) => {
    const { BoardItemId, CurrentReviewId, Status } = useContext(BoardItemContext);
    const logs = useTableItemLogs(BoardItemId, visible);

    if (!visible) return <></>

    if (logs === SUSPENSE)
        return <Loading text="Retrieving logs for this item.." />

        const ArtistTemplate = (log) => {
            if (!log?.artist)
                return <></>
        
            return(
                <Stack direction="horizontal" gap={3}>
                    <TableItemLogUsers artists={[log.artist]} id={log.id} color={Status.color} align="left" width={50}/>
                </Stack>)
        }

        const DateTemplate = (sheet) => {
            const date = sheet?.date;

            return <Stack direction="horizontal" gap={2} style={{width: 100}}>
                <div className="mx-auto"></div>
                <div style={{fontSize: 15}}>{moment(date).format('ddd')}</div>
                <div style={{fontSize: 15, fontWeight: 700, color: Status.color}}>{moment(date).format('Do')}</div>
                <div style={{fontSize: 15, fontWeight: 700 }}>{moment(date).format('MMM')}</div>
            </Stack>;
        }
        
        


    return (
        <DataTable value={logs} className="pm-boarditem-logs">
            <Column field="artist" body={ArtistTemplate} style={{width: 80}} />
            <Column field="date" body={DateTemplate} style={{width: 120, maxWidth: 120, textAlign: 'center'}}/>
            <Column field="hours" header="Hours" style={{fontWeight: 600, fontSize: 15, width: 80, textAlign: 'center'}}/>
            <Column field="FeedbackDepartment" header="Feedback" style={{fontWeight: 400, fontSize: 15, textAlign: 'center', width: 150}} />
            <Column field="ReviewName" header="Review" style={{fontWeight: 400, fontSize: 15, textAlign: 'center', width: 350}} />
            <Column field="notes" header="Notes" className="item-log-notes"
            style={{fontSize: 15, fontWeight: 400, textAlign: 'left', justifyContent: 'start'}}/>

        </DataTable>
    )
};