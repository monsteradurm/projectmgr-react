import { Stack } from "react-bootstrap"
import { useTicketAssignee, useTicketContent, useTicketLastUpdated, useTicketPriority, useTicketReplies, useTicketRequestor, useTicketStatus } from "./Support.context";
import parse from 'html-react-parser'
import moment from 'moment';
export const TicketItemInfo = ({ticket}) => {
    const TicketStatus = useTicketStatus(ticket);
    const TicketPriority = useTicketPriority(ticket);
    const Requestor = useTicketRequestor(ticket);
    const Assignee = useTicketAssignee(ticket);
    const Content = useTicketContent(ticket);
    const Replies = useTicketReplies(ticket);
    const LastUpdated = useTicketLastUpdated(ticket);

    return (
        <Stack direction="vertical" gap={3} style={{padding: 30}}>
            <Stack direction="horizontal" gap={3}  style={{fontWeight: 700, fontSize: 30, color: TicketStatus?.color}}>
                <div>{ticket?.name}</div>
                <div>({TicketStatus?.label})</div>
                <div className="mx-auto"></div>
                <div style={{color: TicketPriority?.color}}>{TicketPriority?.label} Priority</div>
            </Stack>
            <div style={{marginTop: -20}}>
            {
                Content?.body ? parse(Content?.body?.replace('Description:', '')) : 
                <div style={{fontStyle: 'italic'}}>No Description provided</div>
            }
            </div>
            <div style={{borderBottom: 'solid 1px black'}}></div>
            {
                Replies.map(r => 
                    <Stack direction="horizontal"  key={"reply_" + r.id} style={{borderBottom: 'solid 1px black'}}>
                        <div style={{padding:'0px 30px'}}> 
                            <Stack direction="vertical">
                                <Stack direction="horizontal" style={{paddingTop: 20}}>
                                    <div style={{fontWeight: 600, marginRight: 30}}>Adam Cranch</div>
                                    <div style={{opacity: 0.7}}>{moment(r.created_at).format('MMM DD, YYYY HH:mm')}</div>
                                </Stack>
                                <div style={{padding: '10px 0px', opacity:1, fontWeight: 400}}>
                                { 
                                    r?.body ? parse(r.body.replace('Description:', '')) : null
                                }
                                </div>
                            </Stack>
                        </div>
                    </Stack>)
            }
        </Stack>
    )
}