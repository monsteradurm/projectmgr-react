import { Dialog } from 'primereact/dialog'
import React, { useEffect, useRef, useState } from 'react'
import { DialogHeader } from '../General/DialogHeader'
import { ShowCreateNoticeDlg, ShowEditNoticeDlg, useCreateNoticeDlg, useEditNoticeDlg, StoreNotice } from './Home.Notices.context'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from 'primereact/button';
import { Stack } from 'react-bootstrap';
import { ScrollingPage } from '../General/ScrollingPage.component';
import { ScrollPanel } from 'primereact/scrollpanel';
import { isNaN } from 'underscore';
import "./Home.Notices.scss";

const NoticeDlgHeader = React.forwardRef((props, ref) => (
    <div className="pm-dialogHeader" style={{position: 'relative', background: 'rgb(0, 156, 194)'}} ref={ref}>
        <span style={{marginLeft:'10px'}}>
            { props.Header }
        </span>
        <Button icon="pi pi-times" style={{background: 'transparent', border:'none'}}
        className="p-button-rounded" aria-label="Cancel" 
        onClick={props.onClose}/>
    </div>
    )
)

export const EditNoticeDlg = ({}) => {
    const notice = useEditNoticeDlg();
    const [editorState, setEditorState] = useState(
        ''
    );
    const editNoticeRef = useRef();
    const [qWidth, setQWidth] = useState(150);
    const [qHeight, setQHeight] = useState(100);
    const headerRef = React.createRef();
    const containerRef = useRef();
    useEffect(() => {
        if (!notice)
            setEditorState('')
        else
            setEditorState(notice.content)
    }, [notice])
    
    useEffect(() => {
        
        const height = containerRef?.current?.clientHeight - 0;
        setQHeight(isNaN(height) ? 150 : height);

    }, [containerRef])

    useEffect(() => {
        setQWidth(headerRef?.current?.clientWidth);
    }, [headerRef])

    return (<Dialog id="pm-notice-dlg" showHeader={true} visible={!!notice} style={{overflowY: 'hidden'}}
        header={
            <NoticeDlgHeader ref={headerRef} 
                Header={notice?.type === 'New' ? "Add New Notice" : "Edit Notice"} 
                onClose={() => ShowEditNoticeDlg(null)} />
        } closable={true}
        className="pm-dialog" ref={editNoticeRef} onHide={() => ShowEditNoticeDlg(null)}>
        <Stack direction="vertical" style={{height: 'calc(100% - 60px)', width: qWidth}} ref={containerRef}>
            <ReactQuill theme="snow" value={editorState} onChange={setEditorState} 
                style={{height: 'calc(100% - 60px)', width: qWidth}}/>
        </Stack>
        <Button label="Submit" onClick={() => StoreNotice({...notice, content: editorState}) }
        style={{width: 100, position: 'absolute', bottom: 20, right: 20}}/>
    </Dialog>)
}