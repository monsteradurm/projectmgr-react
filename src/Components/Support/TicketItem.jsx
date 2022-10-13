import { Stack } from "react-bootstrap"
import { ShowTicketItemInfo, useTicketAssignee, useTicketContent, useTicketLastUpdated, useTicketPriority, useTicketReplies, useTicketRequestor, useTicketStatus } from "./Support.context";
import { SupportUsers } from "./Support.Users";
import moment from 'moment';
import { useSearchParams } from "react-router-dom";

export const TicketItem = ({ticket}) => {
    const TicketStatus = useTicketStatus(ticket);
    const TicketPriority = useTicketPriority(ticket);
    const Requestor = useTicketRequestor(ticket);
    const Assignee = useTicketAssignee(ticket);
    const Content = useTicketContent(ticket);
    const Replies = useTicketReplies(ticket);
    const LastUpdated = useTicketLastUpdated(ticket);
    const [searchParams, setSearchParams] = useSearchParams();
    return (
        <Stack direction="horizontal" className="pm-ticket-container" onDoubleClick={
                (evt) => ShowTicketItemInfo(ticket.id, searchParams, setSearchParams)}>
            <SupportUsers artists={Requestor} id={TicketItem.id} color={TicketStatus?.color || 'black'} align="left"/>
                <Stack direction="horizontal" className="pm-supportItem">
                    <div className="pm-ticket-priority" style={{background: TicketPriority.color}}>{TicketPriority.label} Priority</div>
                    <div className="pm-ticket-name">{ticket.name}</div>
                    <div className="pm-ticket-comments">
                        <span style={{fontWeight: 600, padding: '0 5px'}}>{Replies?.length}</span> Comments
                    </div>
                    <div className="pm-ticket-date">
                        <span style={{fontWeight: 600, padding: '0 5px'}}>Last Updated:</span>
                        {LastUpdated}
                    </div>
                    <div className="pm-ticket-status" style={{background: TicketStatus.color}}>{TicketStatus.label}</div>
            </Stack>
            <SupportUsers artists={Assignee} id={TicketItem.id} color={TicketStatus?.color || 'black'} align="right"/>
        </Stack>
    )
}

/*

            <Stack direction="vertical" gap={2} className="pm-supportItem">
                <Stack direction="horizontal" gap={2} className="pm-supportItem-header" 
                    style={{background: TicketStatus?.color || 'black', fontWeight: 600}}>
                    <div>{ticket.name} ({TicketPriority?.label} Priority)</div>
                    <div className="mx-auto"></div>
                    <div>{TicketStatus.label}</div>
                </Stack>
                <Stack direction="horizontal" style={{padding: 20}}>
                    <div>
                        Some Ticket Description
                    </div>
                </Stack>
                <div className="my-auto"></div>
                <Stack direction="horizontal" style={{padding: 20}}>
                    <div>Created: {ticket.created_at}</div>
                    <div className="mx-auto"></div>
                    <div>Last Updated: {ticket.updated_at}</div>
                </Stack>
            </Stack>
            */