import { SUSPENSE } from "@react-rxjs/core";
import { useEffect, useState } from "react";
import { Stack } from "react-bootstrap"
import { Loading } from "../General/Loading";
import { CenteredSummaryContainer } from "../Project/TableView/TableItemControls/TableItem.SummaryContainer"
import { usePriorityOptions, useSupportGroups, useSupportSettings, useStatusOptions, useSupportTickets, useTicketItemInfo, ShowTicketItemInfo } from "./Support.context"
import { TicketItem } from "./TicketItem";
import { TicketItemInfo } from "./TicketItemInfo";
import * as _ from 'underscore';
import { useSearchParams } from "react-router-dom";

export const Tickets = ({Board, Group}) => {
    const Settings = useSupportSettings(Board);
    const PriorityOptions = usePriorityOptions(Board);
    const StatusOptions = useStatusOptions(Board);
    const Tickets = useSupportTickets(Board, Group);
    const SelectedTicketId = useTicketItemInfo();
    const [SelectedTicket, setSelectedTicket] = useState(null)
    const [searchParams, setSearchParams] = useSearchParams();
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
                <div style={{width: '100%', textAlign: 'center', fontSize: 20}}>There is currently no
                    <span style={{fontWeight: 600, marginLeft: 5, marginRight: 5}}>{Board}</span>
                        Tickets within the
                    <span style={{fontWeight: 600, marginLeft: 5, marginRight: 5}}>{Group}</span>
                        Category
                    </div>
            </CenteredSummaryContainer>
        </Stack>);

    return (
        <Stack style={{height: '100%', width: '100%', paddingTop: 30}}>
        {
            Tickets.map(ticket => <TicketItem key={ticket.id} ticket={ticket}/>)
        }
        </Stack>
    )
}