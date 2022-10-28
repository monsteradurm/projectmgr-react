import { SUSPENSE } from "@react-rxjs/core";
import { Button } from "primereact/button";
import { Chips } from "primereact/chips";
import { Dialog } from "primereact/dialog";
import React, {  useEffect, useRef, useState } from "react"
import { Stack } from "react-bootstrap";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DialogHeader } from "../General/DialogHeader";
import { ShowTimesheetFollowingDlg, SubmitFollowing, useTimesheet, useTimesheetArtist, useTimesheetDate, useTimesheetFollowingDlg } from "./Timesheet.context";
import parse from 'html-react-parser'

export const TimesheetFollowing = ({}) => {
    const visible = useTimesheetFollowingDlg();
    const Date = useTimesheetDate();
    const User = useTimesheetArtist();
    const Sheet = useTimesheet();

    const dialogRef = useRef();
    const [editorState, setEditorState] = useState(
        ''
    );
    const [qWidth, setQWidth] = useState(150);
    const [qHeight, setQHeight] = useState(100);

    const headerRef = React.createRef();
    const containerRef = useRef();

    useEffect(() => {
        if (!Sheet || Sheet === SUSPENSE || !Sheet.tomorrow?.length) {
            setEditorState('')
            return
        }
        setEditorState(Sheet.tomorrow);
    }, [Sheet])
    
    useEffect(() => {
        
        const height = containerRef?.current?.clientHeight - 0;
        setQHeight(isNaN(height) ? 150 : height);

    }, [containerRef])

    useEffect(() => {
 
        if (headerRef?.current?.clientWidth)
            setQWidth(headerRef?.current?.clientWidth);
    }, [headerRef])


    return (
        <Dialog id="pm-edit-following" showHeader={true} visible={!!visible} style={{overflowY: 'hidden'}}
        header={
            <DialogHeader
            Header="Edit Next Day" onClose={() => ShowTimesheetFollowingDlg(false)} />
            }  closable={false}
            className="pm-dialog" ref={dialogRef} onHide={() => ShowTimesheetFollowingDlg(false)}>
            <Stack direction="vertical" style={{height: 'calc(100% - 60px)', width: '100%'}} ref={containerRef}>
            <ReactQuill theme="snow" value={editorState} onChange={setEditorState} 
                style={{height: 'calc(100% - 60px)', width: '100%'}}/>
        </Stack>
        <Button label="Submit" onClick={() => SubmitFollowing(editorState)}
            style={{width: 100, position: 'absolute', bottom: 20, right: 20}}/>
        </Dialog>
    )
}