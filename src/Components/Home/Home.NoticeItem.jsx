import HTMLReactParser from "html-react-parser";
import { ContextMenu } from "primereact/contextmenu";
import { useRef } from "react";
import { Stack } from "react-bootstrap";
import moment from 'moment';
import { useNoticeContextMenu } from "./Home.Notices.context";

export const NoticeItem = ({notice}) => {
    const NoticeContextMenuRef = useRef();
    const NoticeContextMenu = useNoticeContextMenu(notice.id);

    console.log("NOTICE CONTEXT MENU", NoticeContextMenu);
    if (!notice) return <></>
return (
    <Stack direction="vertical" gap={2} className="pm-notice" key={notice.id} 
        onContextMenu={
            (e) => NoticeContextMenuRef?.current?.show(e) 
        }>
            <ContextMenu model={NoticeContextMenu} 
                ref={NoticeContextMenuRef} className="pm-notice-context"></ContextMenu>
            <Stack direction="horizontal">
                <div className="mx-auto"></div>
                <div style={{color: '#aaa'}}>{moment(notice.updated_at).format('MMM DD, YYYY HH:mm')}</div>
            </Stack>
            <div style={{padding: 20}}>{HTMLReactParser(notice.content)}</div>
    </Stack>)
}