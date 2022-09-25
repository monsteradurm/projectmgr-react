import { SUSPENSE } from "@react-rxjs/core";
import { Button } from "primereact/button";
import { Chips } from "primereact/chips";
import { Dialog } from "primereact/dialog";
import React, { useCallback, useContext, useEffect, useId, useRef, useState } from "react"
import { Stack } from "react-bootstrap";
import { DialogHeader } from "../../../General/DialogHeader";
import { useDepartment } from "../../Context/Project.context";
import { BoardItemContext, useBoardItemDepartment, useBoardItemDescription, useBoardItemName, useBoardItemStatus, useBoardItemTags } from "../../Context/Project.Item.context"
import { useReviewTags } from "../../Context/Project.Review.context";
import { CenteredSummaryContainer } from "../TableItemControls/TableItem.SummaryContainer";
import { SummaryText } from "../TableItemControls/TableItem.SummaryText";
import { ShowEditDescriptionDialog, SubmitDescription, useEditDescriptionDlg } from "./TableItem.EditDescription.context";
import "./TableItem.EditTags.scss";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


export const TableItemEditDescription = ({}) => {
    const {BoardItemId} = useEditDescriptionDlg();
    const dialogRef = useRef();
    const [Element, Task] = useBoardItemName(BoardItemId);
    const Status = useBoardItemStatus(BoardItemId);
    const description = useBoardItemDescription(BoardItemId);
    const Department = useBoardItemDepartment(BoardItemId);

    const [editorState, setEditorState] = useState(
        ''
    );

    const editNoticeRef = useRef();
    const [qWidth, setQWidth] = useState(150);
    const [qHeight, setQHeight] = useState(100);
    const headerRef = React.createRef();
    const containerRef = useRef();
    useEffect(() => {
        
        if (!description || description === SUSPENSE) {
            setEditorState('')
            return
        }
        setEditorState(description.replace('Description:', ''))
    }, [description])
    
    useEffect(() => {
        
        const height = containerRef?.current?.clientHeight - 0;
        setQHeight(isNaN(height) ? 150 : height);

    }, [containerRef])

    useEffect(() => {
 
        if (headerRef?.current?.clientWidth)
            setQWidth(headerRef?.current?.clientWidth);
    }, [headerRef])

    if ([Status, Element, Task, BoardItemId, description].indexOf(SUSPENSE) >= 0)
        return <></>

    const DescriptionDlgHeader = React.forwardRef((props, ref) => (
        <div className="pm-dialogHeader" style={{position: 'relative', background: Status.color}} ref={ref}>
            <span style={{marginLeft:'10px'}}>
                { props.Header }
            </span>
            <Button icon="pi pi-times" style={{background: 'transparent', border:'none'}}
            className="p-button-rounded" aria-label="Cancel" 
            onClick={props.onClose}/>
        </div>
        )
    )
    

    return (
        <Dialog id="pm-edit-tags" showHeader={true} visible={!!BoardItemId} style={{overflowY: 'hidden'}}
        header={
            <DescriptionDlgHeader ref={headerRef} 
            Header={'Edit Description: ' + Task ? Element + ", " + Task : Element}
                onClose={() => ShowEditDescriptionDialog(null)} />
        }  closable={false}
        className="pm-dialog" ref={dialogRef} onHide={() => ShowEditDescriptionDialog(null)}>
            <Stack direction="vertical" style={{height: 'calc(100% - 60px)', width: '100%'}} ref={containerRef}>
            <ReactQuill theme="snow" value={editorState} onChange={setEditorState} 
                style={{height: 'calc(100% - 60px)', width: '100%'}}/>
        </Stack>
        <Button label="Submit" onClick={() => SubmitDescription(BoardItemId, 'Description:' + editorState) }
        style={{width: 100, position: 'absolute', bottom: 20, right: 20}}/>
        </Dialog>
    )
}