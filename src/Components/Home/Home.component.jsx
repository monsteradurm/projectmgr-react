import { Button } from "primereact/button";
import { useEffect, useLayoutEffect, useState } from "react";
import { createKeyedSignal } from "@react-rxjs/utils";
import { bind, SUSPENSE } from "@react-rxjs/core";
import { EMPTY, of, tap } from "rxjs";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { useBusyMessage } from "../../App.MessageQueue.context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetTitles } from "../../Application.context";
import { HomeNotices } from "./Home.Notices";
import { HomeStatus } from "./Home.Status";
import { LastHomeNavigationEvent, useStatusNesting, SetStatusNesting, SetHomeView, useHomeView, useAllStatusItemIds, useStatusItemURLs } from "./Home.context";
import { ErrorLoading } from "../General/ErrorLoading";

const HOME_QID = '/HomeComponent'
export const HomeComponent = ({headerHeight}) => {
    const BusyMessage = useBusyMessage(HOME_QID)
    const [searchParams, setSearchParams] = useSearchParams();
    const View = useHomeView();
    const Nesting = useStatusNesting();
    const offsetY = headerHeight;
    const NavigationRequest = LastHomeNavigationEvent();
    const [LastNavigated, SetLastNavigated] = useState(null);
    const navigate = useNavigate();

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

    }, [searchParams])

    useEffect(() => {
        if (NavigationRequest === LastNavigated || !NavigationRequest)
            return;
        SetLastNavigated(NavigationRequest);
        navigate(NavigationRequest);

    }, [NavigationRequest, LastNavigated])

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
    <ScrollingPage key="page_scroll" offsetY={offsetY}>
        <div id="Home_Items" style={{height: '80%'}}>
            {
                {   'Notices' : <HomeNotices  key="Home_Notices"/>,
                    'Reviews' : <HomeStatus Status="Review" key="Review_Status"/>,
                    'Assistance' : <HomeStatus Status="Assistance"  key="Assistance_Status"/>,
                    'Feedback' : <HomeStatus Status="Feedback"  key="Feedback_Status"/>,
                    'In Progress' : <HomeStatus Status="In Progress"  key="Progress_Status"/>,
                }[View] || 

                (<div style={{width: '100%'}}>
                    <ErrorLoading text={`View as "${View}" In Development`} />
                </div>)
            } 
        </div>
    </ScrollingPage>);
}