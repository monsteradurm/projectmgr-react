import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useBoardParams, SetBoardParam, PROJ_QID, ProjectProvider } from "./Context/Project.context";
import { ProjectFilters } from "./Project.Filters.component";
import { useBoard } from "./Context/Project.Objects.context";
import { SetTitles } from "../../Application.context";
import { ProjectHeader } from "./Project.Header.component";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { TableView } from "./TableView/TableView";
import { ErrorLoading } from "../General/ErrorLoading";
import './Project.component.scss'
import { Stack } from "react-bootstrap";
import { BreedingRhombusSpinner } from "react-epic-spinners";
import { SUSPENSE } from "@react-rxjs/core";
import { useBusyMessage } from "../../App.MessageQueue.context";
import { ProjectBarChart } from "./Charts/Charts.Bar";
import { ProjectTimeline } from "./Timeline/Timeline";
import { ProjectCalendar } from "./Calendar/Calendar";

export const Project = ({headerHeight}) => {
    const BusyMessage = useBusyMessage(PROJ_QID)
    const [searchParams, setSearchParams] = useSearchParams();
    const AllBoardParams = useBoardParams();
    const { BoardView, ProjectId } = AllBoardParams;
    //const AllSyncsketchReviews = useSyncsketchReviewsByElement(); // pre-fetch
    const Board = useBoard();
    const filterBarRef = useRef();
    const offsetY = headerHeight + (filterBarRef?.current ?
                filterBarRef.current.clientHeight : 0);

    useEffect(() => {
        if (Board === SUSPENSE)
            return;

        const titles = ['Project'];
        if (ProjectId)
            titles.push(ProjectId);
        if (Board)
            titles.push(Board.name);

        SetTitles(titles);
    }, [ProjectId, Board])

    useEffect(() => {
        const toDelete = [];
        // iterate over board params 
        Object.keys(AllBoardParams).forEach(k => {
            if (!searchParams.has(k))
                return;

            const val = searchParams.get(k);

            if (!val || val.length < 1){
                toDelete.push(k);
            } 
            
            // compare to url params
            if (val === AllBoardParams[k])
                return;

            // apply to project context
            SetBoardParam('Set' + k, val);
        });

        if (toDelete.length > 0) {
            toDelete.forEach(k => searchParams.delete(k));
            setSearchParams(searchParams);
        }

    }, [searchParams, AllBoardParams]);

    return (
    <ProjectProvider>
        <div ref={filterBarRef}>
            <ProjectFilters />
        </div>
        {
            (BusyMessage || !BoardView) ?

            <Stack direction="vertical" className="mx-auto my-auto" 
            style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                    {BusyMessage?.message}
                </div>
            </Stack> :

            <ScrollingPage key="page_scroll" offsetY={offsetY}>
                <div id="Overview_Items" style={{height: '80%'}}>
                    <ProjectHeader />
                    {
                        {   'Chart' : <ProjectBarChart />,
                            'Timeline' : <ProjectTimeline />,
                            'Calendar' : <ProjectCalendar />,
                            'Table' : <TableView />
                        }[BoardView] || 

                        (<div style={{width: '100%'}}>
                            <ErrorLoading text={`View as "${BoardView}" In Development`} />
                        </div>)
                    } 
                </div>
            </ScrollingPage>
        }
    </ProjectProvider>)
}