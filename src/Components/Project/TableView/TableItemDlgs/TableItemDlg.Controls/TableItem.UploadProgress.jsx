import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { useEffect, useState } from "react";
import { Stack } from "react-bootstrap";
import { useBusyMessage } from "../../../../../App.MessageQueue.context";
import { SendToastSuccess, SendToastWarning } from "../../../../../App.Toasts.context";
import { Loading } from "../../../../General/Loading";
import { CancelUploading, RemoveFileCompleted, SetCurrentUploadStep, ShowUploadReviewDialog, useFilesForUpload, useUploadProgressEvents } from "../TableItem.Upload.context"

const PROG_ID = "/UploadProgres"
export const TableItemUploadProgress = ({primary, files}) => {
    const state = useUploadProgressEvents();
    const [currentUpload, setCurrentUpload] = useState(null);

    console.log(state, files);
    useEffect(() => {
        if (!state)
            return;

        if (currentUpload !== state.description) {
            if (currentUpload !== null) 
                RemoveFileCompleted(currentUpload)
            setCurrentUpload(state.description)
        }
        
        else if (state.complete && files.length > 0 && !!currentUpload) {
            RemoveFileCompleted(currentUpload);
            setCurrentUpload(null);
        }

    }, [state]);

    if (!state)
        return <></>

    return (
        <Stack direction="vertical" gap={3} className="mx-auto my-auto" 
            style={{justifyContent: 'center', height: '100%', fontSize: 20,
            textAlign: 'center', position: 'relative'}}>

            <div style={{width: '100%', opacity:0.5}}>
                <Loading spinner= "breeding-rhombus-spinner" size={90}/>
            </div>

            <Stack direction="horizontal" gap={3} 
                style={{textAlign: 'center', fontWeight:600, fontWeight: 400,
                color: 'gray'}} className="mx-auto">
                    <div>{state.index}</div>
                    <div>{state.item}</div>
            </Stack>
            
            <div className="mx-auto" style={{padding: '0px 100px', height:50, width: '100%'}}>
                <ProgressBar value={state.progress} color={primary} 
                style={{height: 40, lineHeight:40, fontWeight: 600}} />
            </div>
                <div>{state.description}</div>
            <div style={{position:"absolute", bottom: 10, right: 10}}>
                <Button label="Cancel" onClick={(evt) => CancelUploading() }/>
            </div>
        </Stack>
    )
}