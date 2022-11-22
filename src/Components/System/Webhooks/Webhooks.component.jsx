import { Button, InputText, ToggleButton } from "primereact";
import { Stack } from "react-bootstrap"
import { SetWebhookFromBoardId, FetchWebhooks, useWebhookBoardId, useBoardWebhooks, SetWebhookToBoardId, useWebhookFromBoardId, useWebhookToBoardId } from "./Webhooks.context";
import "./Webhooks.component.scss";
import { useEffect } from "react";
import { SetTitles } from "../../../Application.context";
import { ScrollingPage } from "../../General/ScrollingPage.component";
import { useSearchParams } from "react-router-dom";

const OnWebhookToggle = () => {

}
export const WebhooksComponent = ({headerHeight}) => {
    const FromId = useWebhookFromBoardId();
    const ToId = useWebhookToBoardId();

    const Webhooks = useBoardWebhooks();
    const [searchParams, setSearchParams] = useSearchParams();
    const FolderError = false;

    useEffect(() => {
        SetTitles(['System', 'Webhooks'])
    }, []);

    return (
        <div className="pm-webhooks">
            <ScrollingPage className="pm-webhooks" key="page_scroll" offsetY={headerHeight}>
                <div style={{padding: 30}}>
                    <Stack direction="horizontal" style={{justifyContent: 'start', marginBottom: 20}} gap={3}>
                        <span className="p-float-label" style={{width: 250}}>
                            <InputText id="From Id" value={FromId}  
                                style={{width:'100%'}} onChange={(e) => SetWebhookFromBoardId(e.target.value, searchParams, setSearchParams)}
                                placeholder="eg. 12344456" />
                            <label htmlFor="FolderId">From Board Id</label> 
                        </span>

                        <span className="p-float-label" style={{width: 250}}>
                            <InputText id="To Id" value={ToId}  
                                style={{width:'100%'}} onChange={(e) => SetWebhookToBoardId(e.target.value, searchParams, setSearchParams)}
                                placeholder="eg. 12344456" />
                            <label htmlFor="FolderId">From Board Id</label> 
                        </span>

                        <Button label="Fetch" onClick={() => FetchWebhooks(FolderId)}
                            style={{width: 100}}/>

                    </Stack>
                    <Stack direction="vertical" gap={2} style={{marginTop: -60}}>
                    {
                        (!!Webhooks && !FolderError && Array.isArray(Webhooks)) &&
                        <>
                            {
                                Webhooks.map(w => 
                                <Stack direction="horizontal" gap={3} style={{paddingLeft: 30}}>
                                    <div className="mx-auto"></div>
                                    <div style={{width: 300}}>{w.event}</div>
                                    <ToggleButton checked={false} onChange={(e) => OnWebhookToggle(e.value)} style={{width: 100}}/>
                                    <div className="mx-auto"></div>
                                </Stack>
                                
                                )
                            }
                        </>
                    }
                    </Stack>
                </div>
            </ScrollingPage>
        </div>)
}