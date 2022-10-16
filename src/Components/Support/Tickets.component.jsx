import { SUSPENSE } from "@react-rxjs/core";
import { useEffect, useMemo, useState } from "react";
import { Stack } from "react-bootstrap"
import { Loading } from "../General/Loading";
import { CenteredSummaryContainer } from "../Project/TableView/TableItemControls/TableItem.SummaryContainer"
import { usePriorityOptions, useSupportGroups, useSupportSettings, useStatusOptions, useSupportTickets, useTicketItemInfo, ShowTicketItemInfo, useTicketRequestor, useTicketStatus, useTicketAssignee, useTicketPriority, useMachineIP, useMachineName, useTicketMachineName, useTicketMachineIP, useTicketLastUpdated, useTicketReplies, useSupportSearchFilter, useSupportSortReversed, useSupportSortBy, useTicketType, useTicketContent } from "./Support.context"
import { TicketItem } from "./TicketItem";
import { TicketItemInfo } from "./TicketItemInfo";
import * as _ from 'underscore';
import { useSearchParams } from "react-router-dom";
import { SupportUsers } from "./Support.Users";
import { Column, DataTable } from "primereact";
import moment from 'moment';

const LastUpdatedTemplate = (ticket) => {
    const LastUpdate = useTicketLastUpdated(ticket);
    return <div style={{fontWeight: 400, textAlign: 'center'}}>{LastUpdate}</div>
}
const RepliesTemplate = (ticket) => {
    const Replies = useTicketReplies(ticket);
    return <div style={{fontWeight: 700, textAlign: 'center'}}>{Replies.length}</div>
}
const RequestorTemplate = (ticket) => {
    const Requestor = useTicketRequestor(ticket);
    const TicketStatus = useTicketStatus(ticket);
    return(<SupportUsers artists={Requestor} id={TicketItem.id} searchKey="Requestors"
        color={TicketStatus?.color || 'black'} align="left"/>)
}

const AssigneeTemplate = (ticket) => {
    const Assigned = useTicketAssignee(ticket);
    const TicketStatus = useTicketStatus(ticket);
    return(<SupportUsers artists={Assigned} id={TicketItem.id} searchKey="Assignees"
         color={TicketStatus?.color || 'black'} align="right"/>)
}
const CategoryTemplate = (ticket) => {
    return <div style={{fontWeight: 600}}>{ticket.group.title}</div>
}

const rowExpansionTemplate = (ticket) => {
    const ip = useTicketMachineIP(ticket)
    const name = useTicketMachineName(ticket);
    const content = useTicketContent(ticket);
    const Requestors = useTicketRequestor(ticket);
    const Status = useTicketStatus(ticket);
    console.log(ticket, content);
    return (
        <Stack direction="vertical" style={{padding: '10px 80px'}}>
        <Stack direction="horizontal" gap={3} style={{fontSize: 16}}>
            <div style={{fontWeight: 600}}>Machine Name:</div>
            <div>{name}</div>
            <div style={{fontWeight: 600}}>Machine IP:</div>
            <div>{ip}</div>
        </Stack>
        <div style={{padding: '10px 0px', opacity:1, fontWeight: 400, fontSize: 16}}>
        { 
            content?.body ? parse(content.body.replace('Description:', '')) : 
            <div style={{fontStyle: 'italic'}}>No description provided..</div>
        }
        </div>
        <Stack direction="horizontal">
        <div className="mx-auto"></div>
        {
            Requestors.join(', ')
        } 
        {
            Requestors && <span>, </span>
        }
        <div style={{marginLeft: 10}}>{moment(ticket.created_at).format('MMM DD, YYYY HH:mm')}</div>
        </Stack>
        </Stack>)
}
const TypeTemplate = (ticket) => {
    const Type = useTicketType(ticket);
    return <div style={{fontWeight: 600}}>{Type}</div>
}
const TitleTemplate = (ticket) => {
    return <div style={{fontWeight: 700}}>{ticket?.name}</div>
}
const MachineIPTemplate = (ticket) => {
    const ip = useTicketMachineIP(ticket)
    return <div style={{fontWeight: 600, textAlign: 'center'}}>{ip}</div>
}
const MachineNameTemplate = (ticket) => {
    const name = useTicketMachineName(ticket);
    return <div style={{fontWeight: 600, textAlign: 'center'}}>{name}</div>
}
const StatusTemplate = (ticket) => {
    const TicketStatus = useTicketStatus(ticket);
    return <div style={{fontWeight: 600, 
        background: TicketStatus?.color, color: "white", padding: 10, borderRadius: 5,
    textAlign: 'center', width: 250}}>{TicketStatus?.label}</div>
}

const PriorityTemplate = (ticket) => {
    const TicketPriority = useTicketPriority(ticket);
    return <div style={{fontWeight: 700, color: TicketPriority?.color, textAlign: 'center'}}>
        {TicketPriority?.label}</div>
}

export const Tickets = ({Board, Group}) => {
    const [expandedRows, setExpandedRows] = useState([]); 
    const Settings = useSupportSettings(Board);
    const PriorityOptions = usePriorityOptions(Board);
    const StatusOptions = useStatusOptions(Board);
    const AllTickets = useSupportTickets(Board, Group);
    const SelectedTicketId = useTicketItemInfo();
    const [SelectedTicket, setSelectedTicket] = useState(null)
    const [searchParams, setSearchParams] = useSearchParams();
    const [Tickets, setTickets] = useState([]);
    const SortBy = useSupportSortBy();
    const SortByReversed = useSupportSortReversed();
    const Search = useSupportSearchFilter();

    const onRowExpand = (evt) => {
        if (!evt?.data?.id)
            return;
    
        setExpandedRows([...expandedRows, evt.data.id]);
    }
    
    const onRowCollapse = (evt) => {
        if (!evt?.data?.id)
            return;
    
        setExpandedRows([...expandedRows.filter(id => id !== evt.data.id)]);
    }
    
    useEffect(() => {
        if (!AllTickets || AllTickets === SUSPENSE)
            return;
            
        let filtered = [...AllTickets];
        if (Search && Search.length > 0) {
            const search = Search.toLowerCase();
            filtered = filtered.filter(t => JSON.stringify(t).toLowerCase().indexOf(search) >= 0)
        }
        //'Last Updated', 'Title', 'Priority', 'Status', 'Machine Name'
        filtered = _.sortBy(filtered, (t) => {
            switch(SortBy) {
                case 'Last Updated': return useTicketLastUpdated(t);
                case 'Priority': return useTicketPriority(t)?.label;
                case 'Status' : return useTicketStatus(t)?.label;
                case 'Machine Name': return useTicketMachineName(t); 
                case 'Type': return useTicketType(t);
            }
            return t.name;
        })
        if (SortByReversed && SortBy !== 'Last Updated')
            filtered = filtered.reverse();
        else if (!SortByReversed && SortBy === 'Last Updated')
            filtered = filtered.reverse();

        setTickets(filtered);
    }, [AllTickets, Search, SortByReversed, SortBy])

    useEffect(() => {
        if (!SelectedTicketId) {
            if (SelectedTicket)
                setSelectedTicket(null);
            return
        }
        
        const found = _.find(Tickets, t => t.id === SelectedTicketId);
        if (!found) ShowTicketItemInfo(null, searchParams, setSearchParams);
        else setSelectedTicket(found);

    }, [SelectedTicketId, Tickets])

    if (SelectedTicket !== null)
        return <TicketItemInfo ticket={SelectedTicket} />

    if (Tickets === SUSPENSE) return (
            <Loading text="Retrieving Support Items..." />
    )

    else if (!Tickets || Tickets.length < 1)
        return (
        <Stack style={{height: '100%', width: '100%'}}>
            <CenteredSummaryContainer>
                <div style={{width: '100%', textAlign: 'center', fontSize: 20}}>
                    There are currently no
                    <span style={{fontWeight: 600, marginLeft: 5, marginRight: 5}}>{Board}</span>
                    <span>Tickets matching these parameters.</span>
                    
                </div>
            </CenteredSummaryContainer>
        </Stack>);


            return (
                <>
                <div className="pm-tag-filter" style={{color: '#888', fontWeight: 400, fontSize: 20}}>
                    {Tickets?.length} Tickets...
                </div>
                <DataTable value={Tickets} style={{marginBottom: 30, paddingLeft: 10, paddingRight: 10}} 
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate} dataKey="id" expandedRows={expandedRows}>
                    <Column expander style={{ width: '3em' }} />
                    <Column header="Requestors" body={RequestorTemplate} className="ticket-requestor"></Column>
                    {
                        Group === 'All Groups' &&
                        <Column header="Group" body={CategoryTemplate} className="ticket-center"></Column>
                    }
                    <Column header="Type" body={TypeTemplate} className="ticket-center"></Column>
                    <Column header="Priority" body={PriorityTemplate} className="ticket-center"></Column>
                    
                    <Column header="Title" body={TitleTemplate} className="ticket-title"></Column>     
                    
                    <Column header="Status" body={StatusTemplate} className="ticket-status"></Column>
                    <Column header="Machine Name" body={MachineNameTemplate} className="ticket-center"></Column>
                    <Column header="Machine IP" body={MachineIPTemplate} className="ticket-center"></Column> 
                    <Column header="Replies" body={RepliesTemplate} className="ticket-center"></Column>
                    <Column header="Last Updated" body={LastUpdatedTemplate} className="ticket-center"></Column>
                    <Column header="Assigned" body={AssigneeTemplate} className="ticket-assignee"></Column>
                </DataTable>
                </>
            )

    /*return (
        <Stack style={{height: '100%', width: '100%', paddingTop: 30}}>
        {
            Tickets.map(ticket => <TicketItem key={ticket.id} ticket={ticket}/>)
        }
        </Stack>
    )*/
}