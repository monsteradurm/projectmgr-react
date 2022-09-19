import { SUSPENSE } from "@react-rxjs/core";
import { Stack } from "react-bootstrap";
import { useNoticeboard } from "./Home.Notices.context"
import "./Home.Notices.scss";
import moment from 'moment';
import HTMLReactParser from "html-react-parser";

export const HomeNotices = () => {
    const Notices = useNoticeboard();

    if (Notices === SUSPENSE)
        return <></>
    
    return (
        <Stack direction="vertical" gap={2} className="pm-noticeboard">
        {
            Notices.map(n => (
                <Stack direction="vertical" gap={2} className="pm-notice" key={n.id}>
                    <Stack direction="horizontal">
                        <div style={{fontSize: 25, fontWeight: 600, color: '#444'}}>{n.title}</div>
                        <div className="mx-auto"></div>
                        <div style={{color: '#aaa'}}>{moment(n.updated_at).format('MMM DD, YYYY HH:mm')}</div>
                    </Stack>
                    <div style={{padding: 20}}>{HTMLReactParser(n.content)}</div>
                </Stack>
                )
            )
        }
        </Stack>
    )
}