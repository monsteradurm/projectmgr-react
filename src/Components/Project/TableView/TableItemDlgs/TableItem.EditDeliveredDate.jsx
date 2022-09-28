import { SUSPENSE } from "@react-rxjs/core";
import { Chips } from "primereact/chips";
import { Dialog } from "primereact/dialog";
import { useCallback, useContext, useEffect, useId, useRef, useState } from "react"
import { Stack } from "react-bootstrap";
import { DialogHeader } from "../../../General/DialogHeader";
import { useDepartment } from "../../Context/Project.context";
import { BoardItemContext, useAssignedTimeline, useBoardItemDepartment, useBoardItemDescription, useBoardItemName, useBoardItemStatus, useBoardItemTags } from "../../Context/Project.Item.context"
import { useReviewDelivered, useReviewItem, useReviewName, useReviewTags } from "../../Context/Project.Review.context";
import { CenteredSummaryContainer } from "../TableItemControls/TableItem.SummaryContainer";
import { SummaryText } from "../TableItemControls/TableItem.SummaryText";
import { ShowDeliveredDateDialog, ShowEditDeliveredDateDialog, useDeliveredDateDlg } from "./TableItem.EditTimeline.context";
import "./TableItem.EditTags.scss";
import { Calendar } from "primereact/calendar"
import moment from 'moment';
import { Button } from "primereact/button"
import { onSetDate } from "../TableItemControls/TableItem.Review.Context";
export const TableItemEditDeliveredDate = ({}) => {
    const {BoardItemId, CurrentReviewId} = useDeliveredDateDlg();
    const dialogRef = useRef();
    const [Element, Task] = useBoardItemName(BoardItemId);
    const Status = useBoardItemStatus(BoardItemId);
    const review = useReviewItem(CurrentReviewId);
    const reviewName = useReviewName(CurrentReviewId);
    const Department = useBoardItemDepartment(BoardItemId);
    const [dateInput, setDateInput] = useState(null); 
    const delivered = review ? review['Delivered Date'] : null;

    useEffect(() => {
        if (delivered === SUSPENSE)
            return;

        if(!delivered?.text) {
            setDateInput(null);
        }
        else {
            setDateInput(delivered.text);
        }
    }, [delivered])

    if ([Status, Element, Task, BoardItemId, delivered].indexOf(SUSPENSE) >= 0)
        return <></>

    let title = Task ? Element + ", " + Task : Element;
    if (CurrentReviewId)
        title += ` (${reviewName})`

    const header = (
        <DialogHeader color={Status?.color} Header={title}
            HeaderLeft="Edit Delivery Date:" HeaderRight={Department} onClose={() => ShowEditDeliveredDateDialog(null)}/>
    )

    return (
        <Dialog id="pm-edit-tags" showHeader={true} visible={!!BoardItemId} style={{overflowY: 'hidden'}}
        header={header} closable={false}
        className="pm-dialog" ref={dialogRef} onHide={() => ShowEditDeliveredDateDialog(null)}>
            <Stack direction="vertical" gap={3} style={{padding: 30, height: '100%'}}>  
                <Calendar id="deliveredDate" value={dateInput} onChange={(e) => setDateInput(e.value)} 
                    selectionMode="single" readOnlyInput inline  />
                    {
                        dateInput &&
                        <Stack direction="horizontal" gap={1} style={{fontSize: 20, justifyContent: 'center'}}>
                            
                            {
                                dateInput &&
                                <>
                                    <div style={{color: Status.color, fontWeight: 600}}>Delivered</div>
                                    <div style={{fontWeight: 400, opacity: 0.8}}>{moment(dateInput).format("DD MMM, YYYY")} </div>
                                </>
                                
                            }
                        </Stack>

                    }
                    <Button label="Submit" onClick={() => onSetDate(CurrentReviewId, moment(dateInput).format("YYYY-MM-DD")) }
                        style={{width: 100, position: 'absolute', bottom: 20, right: 20}}/>
            </Stack>
        </Dialog>
    )
}