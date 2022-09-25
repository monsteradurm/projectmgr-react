import { SUSPENSE } from "@react-rxjs/core";
import { Chips } from "primereact/chips";
import { Dialog } from "primereact/dialog";
import { useCallback, useContext, useEffect, useId, useRef, useState } from "react"
import { Stack } from "react-bootstrap";
import { DialogHeader } from "../../../General/DialogHeader";
import { useDepartment } from "../../Context/Project.context";
import { BoardItemContext, useBoardItemDepartment, useBoardItemName, useBoardItemStatus, useBoardItemTags } from "../../Context/Project.Item.context"
import { useReviewTags } from "../../Context/Project.Review.context";
import { CenteredSummaryContainer } from "../TableItemControls/TableItem.SummaryContainer";
import { SummaryText } from "../TableItemControls/TableItem.SummaryText";
import { ShowEditTagsDialog, useEditTagsDlg } from "./TableItem.EditTags.context";
import "./TableItem.EditTags.scss";
import { Button } from "primereact/button";
const TagHint = ({reviewId, style, reviewOnly}) => {
    const id = useId();
    const RowB = [
        {text: 'Task Tags', bold: true, id: id + '1'},
        {text: 'will persist across all reviews', id: id + '2'}
    ]
    const RowC = [
        {text: 'Review Tags', bold: true, id: id + '3'},
        {text: 'display only under the current review item', id: id + '4'}
    ]

    return (
        <CenteredSummaryContainer style={style}>
            {
                !reviewOnly &&
                <SummaryText textArr={RowB} />
            }
            {
                reviewId &&
                <>
                    <div style={{marginTop: !reviewOnly? 20 : 0}}></div>
                    <SummaryText textArr={RowC} style={{marginTop: !reviewOnly ? 20 : 0}}/>
                </>
                
            }
        </CenteredSummaryContainer>)
}

export const TableItemEditTags = ({}) => {
    const {BoardItemId, CurrentReviewId, reviewOnly} = useEditTagsDlg();
    const dialogRef = useRef();
    const [Element, Task] = useBoardItemName(BoardItemId);
    const Status = useBoardItemStatus(BoardItemId);
    const itemTags = useBoardItemTags(BoardItemId);
    const reviewTags = useReviewTags(CurrentReviewId)
    const Department = useBoardItemDepartment(BoardItemId);

    if ([Status, Element, Task, BoardItemId, CurrentReviewId, reviewTags, itemTags].indexOf(SUSPENSE) >= 0)
        return <></>

    const setTags = (tags, type) => {
        console.log(tags, type);
    }

    const TagChip = (tag) => {
        return (
            <div style={{background: Status.color, color: 'white'}}>{tag.name}
            <span className="pi pi-times"></span>
            </div>
        );
    }
        
    const header = (
        <DialogHeader color={Status?.color} Header={Task ? Element + ", " + Task : Element}
            HeaderLeft="Edit Tags:" HeaderRight={Department} onClose={() => ShowEditTagsDialog(null)}/>
    )

    return (
        <Dialog id="pm-edit-tags" showHeader={true} visible={!!BoardItemId} style={{overflowY: 'hidden'}}
        header={header} closable={false}
        className="pm-dialog" ref={dialogRef} onHide={() => ShowEditTagsDialog(null)}>
            <Stack direction="vertical" gap={3} style={{padding: 30, height: '100%'}}>
                {
                    !reviewOnly &&
                        <span className="p-float-label">
                            <Chips id="ItemTags" value={itemTags} max={3} itemTemplate={TagChip}
                                onChange={(e) => setTags(e.value, 'Task')} />
                            <label htmlFor="ItemTags">Task Tags</label>
                        </span>
                }
                {
                    CurrentReviewId &&
                    <>
                        <span className="p-float-label" style={{marginTop: reviewOnly ? 0 : 30}}>
                            <Chips id="ReviewTags" value={reviewTags} max={3} itemTemplate={TagChip}
                                onChange={(e) => setTags(e.value, 'Review')} />
                            <label htmlFor="ReviewTags">Review Tags</label>
                        </span>
                    </>
                }
                <TagHint reviewId={CurrentReviewId} reviewOnly={reviewOnly} style={{height:'100%'}}/>
                <Button label="Submit" onClick={() => SubmitDescription(BoardItemId, 'Description:' + editorState) }
                    style={{width: 100, position: 'absolute', bottom: 20, right: 20}}/>
            </Stack>
        </Dialog>
    )
}