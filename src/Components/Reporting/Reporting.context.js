
import { bind, SUSPENSE } from "@react-rxjs/core";
import { Dropdown } from "react-bootstrap";
import DropdownItem from "react-bootstrap/esm/DropdownItem";
import { map, tap, of, from, switchMap, withLatestFrom, take, combineLatest, EMPTY } from "rxjs";
import * as _ from 'underscore';
import { AllWorkspaces$ } from "../../App.Users.context";
import { SetCurrentRoute } from "../../Application.context";
import { GenerateUUID } from "../../Helpers/UUID";
import { FirebaseService } from "../../Services/Firebase.service";
import { NestedDropdown } from "../General/NestedDropDown.component";

const ParseNestedHTML = (data, url, boards=[]) => {
    const result = [];
    return Object.keys(data).map(d => {
        const nested = [...boards, d];
        const onClick = () => SetCurrentRoute(url + "&Boards=" + nested.join(","))

        if (data[d]._boards_) {
            return <DropdownItem key={GenerateUUID()} onClick={onClick}>{d}</DropdownItem>
        }

        return <NestedDropdown key={GenerateUUID()} title={d}>
            <DropdownItem key={GenerateUUID()} onClick={onClick}>All {d}</DropdownItem>
            <Dropdown.Divider></Dropdown.Divider>
        {
            ParseNestedHTML(data[d], url, nested)
        }
        </NestedDropdown>
    })
}

const ParseBoardNesting = (boards) => {
    let result = {};
    boards.forEach(b => {
        let nesting = [b.name];
        if (b.name.indexOf('/') >= 0);
            nesting = b.name.split('/');

        let last = result;
        for(var n = 0; n < nesting.length; n++) {
            const key = nesting[n];
            if (!last[key]) last[key] = {};

            if (n === (nesting.length - 1)) {
                if (!last[key]['_boards_'])
                    last[key]['_boards_'] = [];
                last[key]['_boards_'].push(b);
            }
            last = last[key];
        }
    });

    return result;
}

const [, ReportBoards$] = bind(
    FirebaseService.AllBoards$().pipe(
        map(boards => _.map(boards, b => ({...b.data, projectId: b.projectId}))),
        map(boards => _.groupBy(boards, b => b.projectId)),
        map(projects => {
            let result = {}
            Object.keys(projects).forEach(p => {
                result[p] = ParseBoardNesting(projects[p])
            });
            return result;
        }),
        take(1)
    ), SUSPENSE
)
const [, ReportWorkspaces$] = bind(
    AllWorkspaces$.pipe(
        map(ws => _.map(ws, n => n.nesting)),
        map(nesting => _.groupBy(nesting, n => n[0]))
    ), SUSPENSE
)
const InitialReportingyMenu = <DropdownItem>Loading...</DropdownItem>
export const [useReportingMenu, ReportingMenu$] = bind(
    combineLatest([ReportWorkspaces$, ReportBoards$]).pipe(
        switchMap(params => params.indexOf(SUSPENSE) >= 0 ? EMPTY : of(params)),
        map(([nested, boards]) => {
            return (
            <>
                <DropdownItem onClick={() => SetCurrentRoute('/Reporting?ProjectGroup=AllProjects&Project=&Boards=')}>
                    All Projects
                </DropdownItem>
                <Dropdown.Divider></Dropdown.Divider>
                {
                    Object.keys(nested).map(n => 
                        <NestedDropdown title={n} key={"Reporting_" + n}>
                        <DropdownItem onClick={
                        () => SetCurrentRoute('/Reporting?ProjectGroup=' + n + "&Project=&Boards=")}>All {n}</DropdownItem>
                        <Dropdown.Divider></Dropdown.Divider>
                        {
                            nested[n].map(([,proj]) => <NestedDropdown key={"Reporting_" + n + "_" + proj} title={proj}>
                            <DropdownItem onClick={
                                () => SetCurrentRoute('/Reporting?ProjectGroup=' + n + "&Project=" + proj + "&Boards=")}>
                                    All {proj}</DropdownItem>
                            <Dropdown.Divider></Dropdown.Divider>
                            {
                                ParseNestedHTML(boards[proj], '/Reporting?ProjectGroup=' + n + "&Project=" + proj)
                            }
                            </NestedDropdown>)
                        }
                    </NestedDropdown>)
                }
            </>)
        }),
    ), InitialReportingyMenu
)
/*
onClick={
                                () => SetCurrentRoute('/Reporting?ProjectGroup=' + n + '&Project=' + proj)
                            }
*/