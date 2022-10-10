import { Button } from "primereact/button";
import { useEffect, useLayoutEffect, useState } from "react";
import { createKeyedSignal } from "@react-rxjs/utils";
import { bind, SUSPENSE } from "@react-rxjs/core";
import { EMPTY, of, tap } from "rxjs";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { useBusyMessage } from "../../App.MessageQueue.context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { ErrorLoading } from "../General/ErrorLoading";
import { SetSupportParams, useSupportParams } from "./Support.context";
import { Tickets } from "./Tickets.component";
import { NewTicket } from "./NewTicket.component";
import "./Support.component.scss";

const SUPPORT_QID = '/Supportomponent'
export const SupportComponent = ({headerHeight}) => {
    const BusyMessage = useBusyMessage(SUPPORT_QID)
    const [searchParams, setSearchParams] = useSearchParams();
    const {Board, Group, View} = useSupportParams();
    const offsetY = headerHeight;
    SetNavigationHandler(useNavigate());

    useEffect(() => {
        const board = searchParams.get('Board');
        const group = searchParams.get('Group');
        const view = searchParams.get('View');

        if (Board != board || Group != group || View != view) {
            SetSupportParams(board, group, view)
        }
    }, [searchParams, Board, Group, View])

    useEffect(() => {
        let titles = ['Support'];

        if (Board !== null) 
            titles = [...titles, Board];

        if (Group !== null) 
            titles = [...titles, Group];

        if (View !== null)
            titles.push(View);

        SetTitles(titles);
    }, [View, Board, Group])

    return (
        <ScrollingPage key="page_scroll" offsetY={offsetY}>
            <div id="Support_Items" style={{height: '100%'}}>
                {
                    {   'Tickets' : <Tickets Board={Board} Group={Group} />,
                    }[View] || 

                    (<div style={{width: '100%'}}>
                        <ErrorLoading text={`View as "${View}" In Development`} />
                    </div>)
                } 
            </div>
        </ScrollingPage>);
}