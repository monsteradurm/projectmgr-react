import { faCheck, faCircleCheck, faChevronCircleRight, faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Column, ContextMenu, DataTable } from "primereact"
import { useEffect, useId, useRef, useState } from "react"
import { Stack } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { SetSelectedLog, SetSelectedSheet, SetTimesheetView, SheetRibbonColor, ThisMonth, TimesheetData, Today, useLogContextMenu, useSelectedLog, useSelectedSheet, useSheetContextMenu, useTimesheetArtist, useTimesheets, useTimesheetSubmissionRange, useTimesheetSubmissions, useTimesheetView } from "./Timesheet.context";
import moment from 'moment';
import * as _ from 'underscore';

import "./Timesheet.scss";
import { TimeSheetFilterBar } from "./Timesheet.FilterBar";
import { SupportUsers } from "../Support/Support.Users";
import { SetTimesheetRange, useTimesheetRange, ThisWeek } from "./Timesheet.context"
import { Loading } from "../General/Loading";
import { SUSPENSE } from "@react-rxjs/core";
import { TimesheetLogs } from "./Timesheet.Logs";
import { toggleStatusFilter } from "../Project/Overview.filters";
import { TimelogDlg } from "./TimelogDlg.component";
import { TimesheetFollowing } from "./Timesheet.FollowingDlg";
import { useIsAdmin } from "../../App.Users.context";
import { ScrollingPage } from "../General/ScrollingPage.component";

const DateTemplate = (sheet) => {
    const date = sheet?.date;
    const dayOfWeek = moment(date).format('d');
    const isWeekend = dayOfWeek === '0' || dayOfWeek === '6';
    const primary = SheetRibbonColor(sheet);
    return <Stack direction="horizontal" gap={2}>
        <div className="mx-auto"></div>
        <div style={{fontSize: 20, color: isWeekend ? 'gray' : null}}>{moment(sheet.date).format('ddd')}</div>
        <div style={{fontSize: 20, fontWeight: 700, color: isWeekend ? '#888' : primary}}>{moment(sheet.date).format('Do')}</div>
        <div style={{fontSize: 20, fontWeight: 700, color: isWeekend ? '#aaa' : null}}>{moment(sheet.date).format('MMM')}</div>
    </Stack>;
}

const RibbonTemplate = (sheet) => {
    const background = SheetRibbonColor(sheet);
    return <div style={{background, width: 'inherit', height:'inherit'}}></div>
}


const TasksTemplate = (sheet) => {
    if (!sheet?.logs) return <></>
    return sheet?.logs?.length || 0;
}

const HoursTemplate = (sheet) => {
    const logs = sheet?.logs;
    if (!logs) return <></>

    return _.reduce(logs, (acc, log) => acc += (log?.hours || 0), 0);
}

const TomorrowTemplate = (log) => {
    return log?.tomorrow && <FontAwesomeIcon icon={faCircleCheck} className="log-tick" />;
}


const SubmittedTemplate = (log) => {
    return log?.submitted ? <FontAwesomeIcon icon={faCircleCheck} className="log-tick" /> 
    : log?.projects ? <Button>Submit</Button> : null;
}

const ApprovedTemplate = (log) => {
    if (!log?.approved || log.approved.length < 1)
        return <></>
    return(<SupportUsers artists={log.approved} id={log.id} searchKey="Approvers"
        color="rgb(0, 156, 194)" align="right"/>)
}

const ArtistTemplate = (log) => {
    if (!log?.artist)
        return <></>

    return(
        <Stack direction="horizontal" gap={3}>
            <SupportUsers artists={[log.artist]} id={log.id} searchKey="Submitters"
            color="rgb(0, 156, 194)" align="left" width={50}/>
        </Stack>)
}

export const TimesheetComponent = ({headerHeight}) => {
    const LogContextMenu = useLogContextMenu();
    const SelectedLog = useSelectedLog();
    const logContextRef = useRef();
    const isAdmin = useIsAdmin();
    const SheetContextMenu = useSheetContextMenu();
    const SelectedSheet = useSelectedSheet();
    const sheetContextRef = useRef();
    const View = useTimesheetView();
    const [logs, setLogs] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [header, setHeader] = useState('This Week');
    const Range = useTimesheetRange();
    const SubmissionRange = useTimesheetSubmissionRange();

    const Timesheets = useTimesheets();
    const Submissions = useTimesheetSubmissions();

    const User = useTimesheetArtist();
    const [sheetCount, setSheetCount] = useState(null);
    const [hourCount, setHourCount] = useState(null);
    const [entryCount, setEntryCount] = useState(null);
    const [taskCount, setTaskCount] = useState(null);
    const [reviewCount, setReviewCount] = useState(null);
    const [projectCount, setProjectCount] = useState(null);
    const [artistCount, setArtistCount] = useState(null);
    const [submitCount, setSubmitCount] = useState(null);
    const [projectFilter, setProjectFilter] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState(null);
    const [feedbackFilter, setFeedbackFilter] = useState(null);
    const [approversFilter, setApproversFilter] = useState(null)
    const [expandedRows, setExpandedRows] = useState([]); 
    const [submitterFilter, setSubmitterFilter] = useState(null);

    const [forcedRefresh, setForcedRefresh] = useState(0);
    

    SetNavigationHandler(useNavigate());
    
    useEffect(() => {
        let view = searchParams.get("View");
        if (!view?.length)
            SetTimesheetView(isAdmin ? User : 'Submissions');
        else if (view !== View)
            SetTimesheetView(view);

        let dep = searchParams.get("Department");
        if (!dep?.length)
            dep = null;
        let fb = searchParams.get("Feedback");
        if (!fb?.length)
            fb = null;

        let app = searchParams.get("Approvers");
        if (!app?.length)
            app = null;

        let proj = searchParams.get("Project");
        if (!proj?.length)
            proj = null;

        let sub = searchParams.get("Submitters");
        if (!sub?.length)
            sub = null;

        let searchChanged = false;

        if (proj !== projectFilter)
            setProjectFilter(proj);
        
        if(proj === null && searchParams.has('Project')) {
            searchParams.delete('Project');
            searchChanged = true;
        }

        if (dep !== departmentFilter)
            setDepartmentFilter(dep);

        if(dep === null && searchParams.has('Department')) {
            searchParams.delete('Department');
            searchChanged = true;
        }

        if (fb !== feedbackFilter)
            setFeedbackFilter(fb);

        if(fb === null && searchParams.has('Feedback')) {
            searchParams.delete('Feedback');
            searchChanged = true;
        }

        if (app !== approversFilter)
            setApproversFilter(app);

        if(app === null && searchParams.has('Approvers')) {
            searchParams.delete('Approvers');
            searchChanged = true;
        }

        if(sub === null && searchParams.has('Submitters')) {
            searchParams.delete('Submitters');
            searchChanged = true;
        }

        if (searchChanged)
            setSearchParams(searchParams);
        
        setForcedRefresh(forcedRefresh  + 1);
    }, [searchParams])

    useEffect(() => {
        
        if (Timesheets === SUSPENSE || Submissions === SUSPENSE)
            return;

        let result = View === 'Submissions' ? [...Submissions] : [...Timesheets];

        if (projectFilter?.length || feedbackFilter?.length || departmentFilter?.length || approversFilter?.length) {
            result = result.filter(r => r?.logs?.length);
            if (projectFilter?.length) {
                result = result.filter(r => r?.logs?.filter(l => l.ProjectId.startsWith(projectFilter))?.length)
            }

            if (departmentFilter?.length) {
                result = result.filter(r => r?.logs?.filter(l => l.Department === departmentFilter)?.length)
            }

            if (feedbackFilter?.length) {
                result = result.filter(r => r?.logs?.filter(l => l.FeedbackDepartment === feedbackFilter)?.length)
            }

            if (submitterFilter?.length) {
                result = result.filter(r => r?.artist.replace(/\s/g, '') === submitterFilter)
            }

            if (approversFilter?.length) {
                result = result.filter(r => {
                    
                    if (!r?.logs?.length) return false;
                    
                    const approved = r.approved;
                    if (!approved || approved.length < 1)
                        return false;

                    return approved.map(a => a.replace(/\s/g, '')).indexOf(approversFilter) >= 0;
                });
            }
        }
        setLogs(result);

        const sheets = result?.filter(l => !!l.artist);
        setSheetCount(sheets.length);
        const entries = _.flatten(_.pluck(result, 'logs').filter(l => !!l && l.length));

        setHourCount(_.reduce(entries, (acc, e) => acc += e.hours || 0, 0));
        setEntryCount(_.uniq(_.pluck(entries, 'ItemId')).length);
        setTaskCount(_.uniq(_.pluck(entries.filter(e => !e.type || e.type === 'Task'), 'ItemId')).length);
        setProjectCount(_.uniq(_.pluck(entries, 'ProjectId')).length);
        setReviewCount(_.uniq(_.pluck(entries, 'ReviewId').filter(r => !!r)).length);
        setHourCount(_.reduce(entries, (acc, e) => acc += e.hours || 0, 0));
        setArtistCount(_.uniq(_.pluck(entries, 'artist')).length);
        setSubmitCount(sheets.filter(e => !!e.submitted).length);

    }, [Timesheets, feedbackFilter, departmentFilter, projectFilter, approversFilter, forcedRefresh, View, Submissions])

    useEffect(() => {

        if (View === SUSPENSE)
            return;

        
        const range = View === 'Submissions' ? SubmissionRange : Range;
        const today_str = Today.map(d => moment(d).format('YYYY-MM-DD')).join(' - ');
        const week_str = ThisWeek.map(d => moment(d).format('YYYY-MM-DD')).join(' - ');
        const range_str = range.map(d => moment(d).format('YYYY-MM-DD')).join(' - ');
        const isMonth = (moment(range[0]).startOf('month').format('YYYY-MM-DD') + ' - ' + moment(range[0]).endOf('month').format('YYYY-MM-DD')) === range_str;
    
        if (range_str === week_str)
            setHeader('This Week');
        else if (isMonth)
            setHeader(moment(range[0]).format('MMMM YYYY'))
        else if (range_str === today_str)
            setHeader('Today')

        else {
            let range = View === 'Submissions' ? SubmissionRange : Range;
            const years = range.map(d => moment(d).format('YYYY'));
            const sameYears = years[0] === years[1];
            if (sameYears)
                setHeader(range.map(d => moment(d).format('MMM Do')).join(' - ') + ', ' + years[0])
            else
                setHeader(range.map(d => moment(d).format('MMM Do YYYY')).join(' - '))
        }
    }, [Range, View, SubmissionRange])

    useEffect(() => {
        let titles = ['Home', 'Timesheets'];

        if (View !== SUSPENSE && !!User)
            titles.push(View === 'Submissions' ? 'Submissions' : User);
        SetTitles(titles);

    }, [User, View])

    
    const TagComponent = ({tags, searchKey}) => {
        const id = useId();

        if (!tags) return <></>

        return <Stack direction="horizontal" gap={1}>
        {
            tags.map(p => <div className="log-project-tag" key={id + "_" + p}
                onClick={() => toggleStatusFilter(p, searchParams, setSearchParams, searchKey)}>
                {p}
            </div>)
        }
        </Stack>
    }

    const ProjectsTemplate = (sheet) => {
        let projects = sheet?.logs?.map(l => l.ProjectId).filter(p => !!p) || [];
        if (projects.length < 1) return <></>

        projects = _.uniq(projects).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
        return <TagComponent tags={projects} searchKey="Project"/>
    }

    const FeedbackDepartmentsTemplate = (sheet) => {
        let departments = sheet?.logs?.map(l => l.FeedbackDepartment).filter(d => !!d) || [];
        if (departments.length < 1) return <></>

        departments = _.uniq(departments).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
        return <TagComponent tags={departments} searchKey="Feedback"/>
    }
    const DepartmentsTemplate = (sheet) => {
        let departments = sheet?.logs?.map(l => l.Department).filter(d => !!d) || [];
        if (departments.length < 1) return <></>

        departments = _.uniq(departments).map(p => p.indexOf('_') >= 0 ? p.split('_')[0] : p)
        return <TagComponent tags={departments} searchKey="Department"/>
    }
    const expanderTemplate = (sheet) => {
        const canExpand = sheet?.logs?.length || sheet?.tomorrow;
        const isExpanded = !!expandedRows[sheet?.date]
        const dates = Object.keys(expandedRows);
        if (!canExpand) return <></>
    
        return <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} className="sheet-expander"
        style={{cursor: 'pointer', fontSize: 20, color: '#bbb'}} 
            onClick={() => {
                if (isExpanded) {
                    
                    let entries = dates.filter(d => d !== sheet.date).map(d => [d, true])
                    setExpandedRows(Object.fromEntries(entries));
                } else {
                    let expanded = {...expandedRows};
                    expanded[sheet.date] = true;
                    setExpandedRows(
                        expanded
                    )
                }
            }} />
    }

    if (Timesheets === SUSPENSE)
        return <Loading text="Retrieving Timesheets..." />

    return (
        <>
        <TimelogDlg />
        <TimesheetFollowing />
        <TimeSheetFilterBar />
        <ContextMenu model={SheetContextMenu} ref={sheetContextRef} onHide={() => SetSelectedSheet(null)} className="pm-sheet-context"/>
        <ContextMenu model={LogContextMenu} ref={logContextRef} onHide={() => SetSelectedLog(null)} className="pm-sheet-context"/>
        <ScrollingPage offsetY={headerHeight}>
            <Stack direction="vertical">
                <div style={{fontSize: 30, marginBottom: 10, marginTop: 10, fontWeight: 700, color: '#555',
                    textAlign: 'left', paddingLeft: 150}}>{header}</div>
                <DataTable value={logs} className="pm-timesheet" style={{paddingTop: 0, marginLeft: 50, marginRight: 50}} 
                    onRowToggle={(e) => setExpandedRows(e.data)} contextMenuSelection={SelectedSheet}
                    onContextMenuSelectionChange={e => SetSelectedSheet(e.value)}
                    onContextMenu={e => sheetContextRef.current.show(e.originalEvent)}
                    rowExpansionTemplate={(e) => <TimesheetLogs sheet={e} logContextRef={logContextRef} SelectedLog={SelectedLog} />} 
                        dataKey="date" expandedRows={expandedRows}>
                    <Column body={ArtistTemplate} className="log-artists" 
                        style={{position:'absolute', left: -0, padding:5, display: View !== 'Submissions' ? 'none' : null}}></Column>
                    <Column body={RibbonTemplate} style={{width: 15, maxWidth: 15, padding: 0, margin: 0, height: '64px'}} className="log-ribbon" />

                    <Column body={expanderTemplate} style={{ width: 50, maxWidth: 50 }} className="log-expander" />
                    <Column header="Date" body={DateTemplate} className="log-date" style={{width: 180, maxWidth: 180}}></Column>
                    <Column header="Projects" body={ProjectsTemplate} className="log-projects"></Column>
                    <Column header="Departments" body={DepartmentsTemplate} className="log-projects"></Column>
                    <Column header="Feedback" body={FeedbackDepartmentsTemplate} className="log-projects"></Column>
                    <Column header="Logs" body={TasksTemplate} className="log-tasks" style={{width: 150, maxWidth: 150}}></Column>
                    <Column header="Hours" body={HoursTemplate} className="log-hours" style={{width: 150, maxWidth: 150}}></Column>
                    <Column header="Next Day" body={TomorrowTemplate} className="log-hours" style={{width: 150, maxWidth: 150}}></Column>
                    <Column header="Submitted" body={SubmittedTemplate} className="log-submitted" 
                        style={{width: 150, maxWidth: 150, display: View === 'Submissions' ? 'none' : null}}></Column>
                    <Column body={RibbonTemplate} style={{width: 15, maxWidth: 15, padding: 0, margin: 0, height: '64px'}} className="log-ribbon" />
                    <Column body={ApprovedTemplate} className="log-approved" 
                        style={{width: 200, maxWidth: 200, position:'absolute', right: -140, padding: 5}}></Column>
                </DataTable>
                <Stack direction="horizontal" gap={1} className="pm-tag-filters"
                    style={{fontSize: 18, marginRight: 150, marginLeft: 150, marginTop: -30, zIndex: 100}}>
                    <div style={{marginRight: 20}}><span style={{fontWeight: 600}}>{sheetCount}</span> Timesheets...</div>
                    {
                        projectFilter &&
                        <div className="pm-tag" key={"ProjectFilter" + "_" + projectFilter}
                            onClick={() => toggleStatusFilter(projectFilter, searchParams, setSearchParams, "Project")}>
                            #{projectFilter}
                        </div>

                    }
                    {
                        departmentFilter &&
                        <div className="pm-tag" key={"departmentFilter" + "_" + departmentFilter} 
                            onClick={() => toggleStatusFilter(departmentFilter, searchParams, setSearchParams, "Department")}>
                            #{departmentFilter}
                        </div>

                    }
                    {
                        feedbackFilter &&
                        <div className="pm-tag" key={"feedbackFilter" + "_" + feedbackFilter} 
                            onClick={() => toggleStatusFilter(feedbackFilter, searchParams, setSearchParams, "Feedback")}>
                            #{feedbackFilter}
                        </div>

                    }
                    {
                        approversFilter &&
                        <div className="pm-tag" key={"approversFilter" + "_" + approversFilter}
                            onClick={() => toggleStatusFilter(approversFilter, searchParams, setSearchParams, "Approvers")}>
                            #{approversFilter}
                        </div>

                    }
                    <div className="mx-auto"></div>
                    {
                        View === 'Submissions' &&
                        <>
                            <div style={{fontWeight: 600}}>{artistCount}</div>
                            <div>Artists, </div>
                        </>
                    }
                    <div style={{fontWeight: 600, marginLeft: View === 'Submissions' ? 10 : 0}}>{projectCount}</div>
                    <div>Projects, </div>
                    <div style={{marginLeft: 10, fontWeight: 600}}>{entryCount}</div>
                    <div>Logs, </div>
                    <div style={{marginLeft: 10, fontWeight: 600}}>{taskCount}</div>
                    <div>Tasks, </div>
                    <div style={{marginLeft: 10, fontWeight: 600}}>{reviewCount}</div>
                    <div>Reviews, </div>
                    <div style={{marginLeft: 10, fontWeight: 600}}>{hourCount}</div>
                    <div>Hours 
                    {
                        View !== 'Submissions' &&
                        <span>,</span>
                    }
                    </div>
                    {
                        View !== 'Submissions' &&
                        <>
                            <div style={{marginLeft: 10, fontWeight: 600}}>{submitCount}</div>
                            <div>Submissions </div>
                        </>
                    }
                </Stack>
            </Stack>
        </ScrollingPage>
    </>)
}