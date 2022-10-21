import { useRef, useState, useEffect, useLayoutEffect } from "react"
import { Dialog } from "primereact/dialog";
import { ScrollPanel } from "primereact/scrollpanel";
import { useDepartment } from "../../Context/Project.context";
import { useBoardItemDepartment, useBoardItemName, useBoardItemStatus } from "../../Context/Project.Item.context";
import { DialogHeader } from "../../../General/DialogHeader";
import { SUSPENSE } from "@react-rxjs/core";
import "./TableItem.UploadReview.scss"
import { KEY_CREATE_SS_REVIEW, useSyncsketchGroup, useSyncsketchProject, useSyncsketchReviewDepartments, useSyncsketchReviewsFromElement } from "../../Context/Project.Syncsketch.context";
import { AddQueueMessage, RemoveQueueMessage, useBusyMessage, useMessageQueue } from "../../../../App.MessageQueue.context";
import { Stack } from "react-bootstrap";
import { BreedingRhombusSpinner } from "react-epic-spinners";
import { useSyncsketchReviewName, useUploadReviewDlg, ShowUploadReviewDialog, useCurrentUploadStepIndex, useUploadSyncsketchReview, SetUploadSyncsketchReview, useUploadEvent, useFilesForUpload } from "./TableItem.Upload.context";
import { TableItemReviewGroup } from "./TableItemDlg.Controls/TableItem.ReviewGroup";
import { useGroup } from "../../Context/Project.Objects.context";
import * as _ from 'underscore';
import { Button } from "primereact/button";
import { TableItemUploadSteps } from "./TableItemDlg.Controls/TableItem.Upload.Steps";
import { TableItemUploadReviewSummary } from "./TableItemDlg.Controls/TableItem.Upload.ReviewSummary";
import { TableItemReviewName } from "./TableItemDlg.Controls/TableItem.ReviewName";
import { TableItemManageFiles } from "./TableItemDlg.Controls/TableItem.ManageFiles";
import { TableItemUploadProgress } from "./TableItemDlg.Controls/TableItem.UploadProgress";

export const UPLOAD_QID = '/TableUploadReview'

export const TableItemUploadReview = ({}) => {
    const BusyMessage = useBusyMessage(UPLOAD_QID);
    const dialogRef = useRef();
    const BoardItemId = useUploadReviewDlg();
    const Department = useBoardItemDepartment(BoardItemId);
    const [Element, Task] = useBoardItemName(BoardItemId);

    console.log("TABLEITEM REVIEW", Element, Task);
    const Status = useBoardItemStatus(BoardItemId)
    const Group = useGroup();

    const ssReviews = useSyncsketchReviewsFromElement(Element);
    const ssProjectGroup = useSyncsketchGroup();
    const ssProject = useSyncsketchProject();
    const ssReviewName = useSyncsketchReviewName();
    const stepIndex = useCurrentUploadStepIndex();
    const thisReview = useUploadSyncsketchReview();
    const contentRef = useRef();
    const uploadEvent = useUploadEvent(); //maintain subscription
    const files = useFilesForUpload();

    useEffect(() => {
        if (!ssReviews || ssReviews === SUSPENSE || ssReviewName === SUSPENSE) {
            if (thisReview !== null)
                SetUploadSyncsketchReview(null);
            return;
        }

        const review = _.find(ssReviews, s => s.name === ssReviewName);
        
        if (!review) {
            SetUploadSyncsketchReview(null);
            return;
        }
        SetUploadSyncsketchReview(review);
    }, [ssReviews, ssReviewName])
 
    useEffect(() => {
        if (thisReview) {
            RemoveQueueMessage(UPLOAD_QID ,KEY_CREATE_SS_REVIEW)
        }
    }, [thisReview])

    useLayoutEffect(() => {
        if ([ssReviews, ssProjectGroup, ssProject, Element].indexOf(SUSPENSE) < 0)
            return;
            
        AddQueueMessage(UPLOAD_QID, "init-reviews", "Initializing..");
    }, []);

    useLayoutEffect(() => {
        if ([ssReviews, ssProjectGroup, ssProject, Element].indexOf(SUSPENSE) < 0)
            RemoveQueueMessage(UPLOAD_QID, 'init-reviews');
    }, [ssReviews, ssProjectGroup, ssProject])
    
    if ([SUSPENSE, null, undefined].indexOf(BoardItemId) >= 0 ||
    [Element, Department, Group].indexOf(SUSPENSE) >= 0) return <></>

    const footer = (
        <>
        {
            <TableItemUploadSteps/>
        }
        </>
    );

    const header = (
        <DialogHeader color={Status?.color} Header={Task ? Element + ", " + Task : Element}
            HeaderLeft="Upload Review" HeaderRight={Department} onClose={() => ShowUploadReviewDialog(null)}/>
    )

    return (

        <Dialog id="pm-upload-review" showHeader={true} visible={true} style={{overflowY: 'hidden'}}
        footer={footer} header={header} closable={false}
        className="pm-dialog" ref={dialogRef} onHide={() => ShowUploadReviewDialog(null)}>
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
                            height: stepIndex === 3? '100%' : null}} ref={contentRef}>
                        {
                            { 0 : <TableItemReviewGroup Group={Group} Element={Element} ssReviews={ssReviews}
                                        selectedReview={thisReview}/>,
                              1 : <TableItemReviewName selectedReview={thisReview} BoardItemId={BoardItemId}/>,
                              2 : <TableItemManageFiles reviewId={thisReview?.id } pulse={BoardItemId}/>,
                              3 : <TableItemUploadProgress primary={Status?.color} files={files}/>
                            }[stepIndex] || null 
                        }
                        </div>

                        <TableItemUploadReviewSummary
                            boardItemId={BoardItemId}
                            style={{height: 'calc(100% - 100px)'}} primary={Status?.color}
                            index={stepIndex}/>
                    </>
                }
            </ScrollPanel>
        </Dialog>
    )
}