import { Button } from "primereact/button";
import { useEffect, useLayoutEffect, useState } from "react";
import { createKeyedSignal } from "@react-rxjs/utils";
import { bind, SUSPENSE } from "@react-rxjs/core";
import { EMPTY, of, tap } from "rxjs";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { useBusyMessage } from "../../App.MessageQueue.context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { HomeNotices } from "./Home.Notices";
import { HomeStatus } from "./Home.Status";
import { LastHomeNavigationEvent, useStatusNesting, SetStatusNesting, SetHomeView, useHomeView, useAllStatusItemIds, useStatusItemURLs, useHomeSearchFilter, SetHomeSearchFilter } from "./Home.context";
import { ErrorLoading } from "../General/ErrorLoading";
import { HomeFilterBar } from "./Home.FilterBar"
import "./Home.component.scss";

const HOME_QID = '/HomeComponent'
export const HomeComponent = ({headerHeight}) => {
    const BusyMessage = useBusyMessage(HOME_QID)
    const [searchParams, setSearchParams] = useSearchParams();
    const Search = useHomeSearchFilter();
    const View = useHomeView();
    const Nesting = useStatusNesting();
    const offsetY = headerHeight;
    SetNavigationHandler(useNavigate());

    useEffect(() => {
        const page = searchParams.get('View');
        
        if (!page)
            SetHomeView('Notices')
        else
            SetHomeView(page);

        const nesting = searchParams.get('Nesting') ?? searchParams.get('nesting');
        if (!nesting && !!Nesting)
            SetStatusNesting(null);

        else if (nesting && Nesting !== nesting)
            SetStatusNesting(nesting);

        let search = searchParams.get('Search');
        if (!search) search = '';
        if (search !== Search) {
            SetHomeSearchFilter(search);
        }
    }, [searchParams])

    useEffect(() => {
        let titles = ['Home'];

        if (Nesting !== SUSPENSE && Nesting?.length) 
        titles = [...titles, ...Nesting.split(',')];

        if (View !== SUSPENSE && View)
            titles.push(View);

        SetTitles(titles);
    }, [View, Nesting])

    if (View === SUSPENSE)
        return <div>View SUSPENDED</div>;


    return (
        <>
        <HomeFilterBar />
        <div id="Home_Items" className="pm-home" style={{height: '100%'}}>
            {
                {   'Notices' : 
                        <ScrollingPage key="page_scroll" offsetY={offsetY}>
                            <HomeNotices  key="Home_Notices"/>
                        </ScrollingPage>,
                    'Reviews' : <HomeStatus Status="Review" key="Review_Status_Page"/>,
                    'Assistance' : <HomeStatus Status="Assistance"  key="Assistance_Status_Page"/>,
                    'Feedback' : <HomeStatus Status="Feedback"  key="Feedback_Status_Page"/>,
                    'In Progress' : <HomeStatus Status="In Progress"  key="Progress_Status_Page"/>,
                }[View] || 

                (<div style={{width: '100%'}}>
                    <ErrorLoading text={`View as "${View}" In Development`} />
                </div>)
            } 
        </div>
    </>);
}