import { useRef, useState, useEffect, useLayoutEffect } from "react"
import { Dialog } from "primereact/dialog";
import { ScrollPanel } from "primereact/scrollpanel";
import { useDepartment } from "../../Context/Project.context";
import { useBoardItemDepartment, useBoardItemName, useBoardItemStatus } from "../../Context/Project.Item.context";
import { DialogHeader } from "../../../General/DialogHeader";
import { SUSPENSE } from "@react-rxjs/core";
import "./TableItem.UploadReview.scss"
import { useSyncsketchGroup, useSyncsketchProject, useSyncsketchReview, useSyncsketchReviewDepartments, useSyncsketchReviewsFromElement } from "../../Context/Project.Syncsketch.context";
import { AddQueueMessage, RemoveQueueMessage, useBusyMessage, useMessageQueue } from "../../../../App.MessageQueue.context";
import { Stack } from "react-bootstrap";
import { BreedingRhombusSpinner } from "react-epic-spinners";
import { useSyncsketchReviewName, useUploadReviewDlg, ShowUploadReviewDialog, useCurrentUploadStepIndex, useUploadSyncsketchReview, SetUploadSyncsketchReview, useUploadEvent, ShowAddtoReviewDialog, useAddToReviewDlg, useIsAddFilesUploading, useAddFileUploadEvent, useFilesForUpload } from "./TableItem.Upload.context";
import { TableItemReviewGroup } from "./TableItemDlg.Controls/TableItem.ReviewGroup";
import { useGroup } from "../../Context/Project.Objects.context";
import * as _ from 'underscore';
import { Button } from "primereact/button";
import { TableItemUploadSteps } from "./TableItemDlg.Controls/TableItem.Upload.Steps";
import { TableItemUploadReviewSummary } from "./TableItemDlg.Controls/TableItem.Upload.ReviewSummary";
import { TableItemReviewName } from "./TableItemDlg.Controls/TableItem.ReviewName";
import { TableItemManageFiles } from "./TableItemDlg.Controls/TableItem.ManageFiles";
import { TableItemUploadProgress } from "./TableItemDlg.Controls/TableItem.UploadProgress";
import { useReviewDepartment, useReviewIndex, useReviewName } from "../../Context/Project.Review.context";

const UPLOAD_QID = '/TableAddToReview'

export const TableItemAddToReview = ({}) => {
    const BusyMessage = useBusyMessage(UPLOAD_QID);
    const dialogRef = useRef();
    const {BoardItemId, CurrentReviewId, ReviewItems} = useAddToReviewDlg();
    const FeedbackDepartment = useReviewDepartment(CurrentReviewId);
    const ReviewName = useReviewName(CurrentReviewId);
    const ssProjectGroup = useSyncsketchGroup();
    const ssProject = useSyncsketchProject();
    const Department = useBoardItemDepartment(BoardItemId);
    const [Element, Task] = useBoardItemName(BoardItemId);
    const thisReview = useSyncsketchReview(Element, FeedbackDepartment)
    const Status = useBoardItemStatus(BoardItemId)
    const Group = useGroup();
    const contentRef = useRef();
    const ReviewIndex = useReviewIndex(CurrentReviewId)
    const uploadEvent = useAddFileUploadEvent(thisReview?.id, Department, ReviewName, ReviewItems?.length, ReviewIndex); //maintain subscription
    const IsUploading = useIsAddFilesUploading();
    const files = useFilesForUpload();

    useLayoutEffect(() => {
        if ([ssProject, ssProjectGroup, Group, Element].indexOf(SUSPENSE) < 0)
            return;
            
        AddQueueMessage(UPLOAD_QID, "init-reviews", "Initializing..");
    }, []);

    useLayoutEffect(() => {
        if ([ssProjectGroup, ssProject, Element].indexOf(SUSPENSE) < 0)
            RemoveQueueMessage(UPLOAD_QID, 'init-reviews');
    }, [ssProjectGroup, ssProject, Element])
    
    if ([SUSPENSE, null, undefined].indexOf(BoardItemId) >= 0 ||
    [Element, Department, Group].indexOf(SUSPENSE) >= 0) return <></>

    const header = (
        <DialogHeader color={Status?.color} Header={Task ? Element + ", " + Task : Element}
            HeaderLeft="Add To Review:" HeaderRight={Department} onClose={() => ShowAddtoReviewDialog(null)}/>
    )

    return (

        <Dialog id="pm-upload-review" showHeader={true} visible={true} style={{overflowY: 'hidden'}}
        header={header} closable={false}
        className="pm-dialog" ref={dialogRef} onHide={() => ShowAddtoReviewDialog(null)}>
            <ScrollPanel className="pm" style={{ overflowX: 'hidden',
                background: 'white'}}>
                {
                    BusyMessage ? 
                    <Stack direction="vertical" className="mx-auto my-auto" 
                    style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                      <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                      <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                        {BusyMessage.message}
                      </div>
                    </Stack> : 
                    <>
                        <div style={{pading:30,
                            height: IsUploading ? '100%' : null}} ref={contentRef}>
                        {
                            !IsUploading ?
                            <TableItemManageFiles reviewId={thisReview?.id}/>
                            : <TableItemUploadProgress primary={Status?.color} files={files}/>
                        }
                        </div>
                    </>
                }
            </ScrollPanel>
        </Dialog>
    )
}