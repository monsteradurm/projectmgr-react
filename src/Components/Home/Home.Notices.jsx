import { SUSPENSE } from "@react-rxjs/core";
import { Stack } from "react-bootstrap";
import { useNoticeboard } from "./Home.Notices.context"
import "./Home.Notices.scss";
import { CreateNoticeDlg, EditNoticeDlg } from "./Hone.NoticeDlg";
import { NoticeItem } from "./Home.NoticeItem";

export const HomeNotices = () => {
    const Notices = useNoticeboard();

    if (Notices === SUSPENSE)
        return <></>
    
    return (
        <Stack direction="vertical" gap={2} className="pm-noticeboard">
            <EditNoticeDlg />
            {
                Notices.map(n => <NoticeItem key={n.id} notice={n} />)
            }
        </Stack>
    )
}