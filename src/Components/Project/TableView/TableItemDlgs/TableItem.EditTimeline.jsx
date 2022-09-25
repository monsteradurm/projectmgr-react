import { SUSPENSE } from "@react-rxjs/core";
import { Chips } from "primereact/chips";
import { Dialog } from "primereact/dialog";
import { useCallback, useContext, useEffect, useId, useRef, useState } from "react"
import { Stack } from "react-bootstrap";
import { DialogHeader } from "../../../General/DialogHeader";
import { useDepartment } from "../../Context/Project.context";
import { BoardItemContext, useAssignedTimeline, useBoardItemRescheduled,useBoardItemTimeline,
    useBoardItemDepartment, useBoardItemDescription, useBoardItemName, useBoardItemStatus, useBoardItemTags } from "../../Context/Project.Item.context"
import { useReviewName, useReviewTags, useReviewTimeline } from "../../Context/Project.Review.context";
import { CenteredSummaryContainer } from "../TableItemControls/TableItem.SummaryContainer";
import { SummaryText } from "../TableItemControls/TableItem.SummaryText";
import { ShowEditTimelineDialog, useEditTimelineDlg, onSetTimeline } from "./TableItem.EditTimeline.context";
import "./TableItem.EditTags.scss";
import { Calendar } from "primereact/calendar"
import moment from 'moment';
import { Button } from "primereact/button"
import { SendToastError } from "../../../../App.Toasts.context";
export const TableItemEditTimeline = ({}) => {
    const {BoardItemId, CurrentReviewId} = useEditTimelineDlg();
    const dialogRef = useRef();
    const [Element, Task] = useBoardItemName(BoardItemId);
    const Status = useBoardItemStatus(BoardItemId);
    const Rescheduled = useBoardItemRescheduled(BoardItemId);
    const itemTimeline = useBoardItemTimeline(BoardItemId);
    const reviewTimeline = useReviewTimeline(CurrentReviewId);
    const reviewName = useReviewName(CurrentReviewId);
    const Department = useBoardItemDepartment(BoardItemId);
    const [datesInput, setDatesInput] = useState(null); 

    useEffect(() => {
        if ([itemTimeline, reviewTimeline, Rescheduled].indexOf(SUSPENSE) >= 0)
            return;

        if (!itemTimeline?.text && !reviewTimeline?.text && datesInput)
            setDatesInput(null);

        const timeline = Rescheduled? reviewTimeline : itemTimeline;

        if(timeline?.text?.indexOf(' - ') < 0) {
            setDatesInput(null);
        }
        else {
            setDatesInput(timeline.text.split(' - ').map(t => new Date(t)));
        }
    }, [itemTimeline, reviewTimeline])

    if ([Status, Element, Task, BoardItemId, itemTimeline, reviewTimeline, Rescheduled].indexOf(SUSPENSE) >= 0)
        return <></>

    let title = Task ? Element + ", " + Task : Element;
    if (CurrentReviewId)
        title += ` (${reviewName})`

    const header = (
        <DialogHeader color={Status?.color} Header={title}
            HeaderLeft="Edit Timeline:" HeaderRight={Department} onClose={() => ShowEditTimelineDialog(null)}/>
    )

    const SubmitTimeline = () =>  {
        if (!datesInput || datesInput.length < 2) {
            SendToastError("Incorrect Timeline Format!");
            return;
        }
        
        onSetTimeline(CurrentReviewId ? CurrentReviewId : BoardItemId, 
            moment(datesInput[0]).format("YYYY-MM-DD"),
            moment(datesInput[1]).format("YYYY-MM-DD"),
            CurrentReviewId ? 'Review' : 'BoardItem')
    }
    return (
        <Dialog id="pm-edit-tags" showHeader={true} visible={!!BoardItemId} style={{overflowY: 'hidden'}}
        header={header} closable={false}
        className="pm-dialog" ref={dialogRef} onHide={() => ShowEditTimelineDialog(null)}>
            <Stack direction="vertical" gap={3} style={{padding: 30, height: '100%'}}>  
                <Calendar id="range" value={datesInput} onChange={(e) => setDatesInput(e.value)} 
                    selectionMode="range" readOnlyInput inline  />
                    {
                        datesInput &&
                        <Stack direction="horizontal" gap={1} style={{fontSize: 20, justifyContent: 'center'}}>
                            
                            {
                                datesInput.length > 0 &&
                                <>
                                    <div style={{color: Status.color, fontWeight: 600}}>From</div>
                                    <div style={{fontWeight: 400, opacity: 0.8}}>{moment(datesInput[0]).format("DD MMM, YYYY")}, </div>
                                </>
                                
                            }
                            
                            {
                                datesInput.length > 1 &&
                                <>
                                    <div style={{marginLeft:10, color: Status.color, fontWeight: 600}}>To</div>
                                    <div style={{fontWeight: 400, opacity: 0.8}}>{moment(datesInput[1]).format("DD MMM, YYYY")}</div>
                                </>
                                
                            }
                        </Stack>

                    }
                    <Button label="Submit" onClick={() => SubmitTimeline() }
                        style={{width: 100, position: 'absolute', bottom: 20, right: 20}}/>
            </Stack>
        </Dialog>
    )
}