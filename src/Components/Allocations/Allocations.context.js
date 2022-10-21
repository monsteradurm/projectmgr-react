import { bind, SUSPENSE } from "@react-rxjs/core"
import { EMPTY, of, switchMap, tap, map, from, concatMap, scan, debounceTime, combineLatest } from "rxjs"
import { MondayUser$ } from "../../App.Users.context"
import { FirebaseService } from "../../Services/Firebase.service"
import * as _ from 'underscore';
import { NestedDropdown } from "../General/NestedDropDown.component";
import { Dropdown } from "react-bootstrap";
import { Badge } from "primereact";
import { SetCurrentRoute } from '../../Application.context';
import { createSignal } from "@react-rxjs/utils";

export const [AllocationNestingChanged$, SetAllocationNesting] = createSignal(nesting => nesting);

export const [useAllocationNesting, AllocationNesting$] = bind(
    AllocationNestingChanged$, SUSPENSE
)

export const [useMyAllocations, MyAllocations$] = bind(
    MondayUser$.pipe(
        switchMap(user => !!user && user !== SUSPENSE ? of(user) : EMPTY),
        map(user => user.name),
        switchMap(name => FirebaseService.AllocationsChanged$(name)),
        map(docs => _.reduce(docs, (acc, cur) => {
                let nesting = ['Other', cur.board_description]

                if (nesting[1].indexOf('/') >= 0)
                    nesting = nesting[1].split('/').filter(n => n?.length)

                if (!acc[nesting[0]])
                    acc[nesting[0]] = { };
                if (!acc[nesting[0]][nesting[1]])
                    acc[nesting[0]][nesting[1]] = [];

                acc[nesting[0]][nesting[1]].push(cur);
                return acc;
            }, {})
        ),
        tap(t => console.log("ALLOCATIONS: ", t))
    ), SUSPENSE
)

export const [useAllocationsByProject, AllocationsByProject$] = bind(
    combineLatest([MyAllocations$, AllocationNesting$]).pipe(
        tap(console.log),
        map(([allocations, nesting]) => {
            let group = allocations['Other'];
            if (nesting.length > 0)
                group = allocations[nesting[0]];

            if (!group)
                return [];

            const items = group[nesting[1]];
            
            return items ? items : [];
        })
    ), SUSPENSE
)

const defaultAllocationsMenu = <NestedDropdown title="Allocations" key="Allocations_Default">
    <Dropdown.Item>No Allocations...</Dropdown.Item>
</NestedDropdown>

export const [useAllocationsMenu, AllocationsMenu$] = bind(
    MyAllocations$.pipe(
        switchMap(all => !!all && all !== SUSPENSE ? of(all) : EMPTY),
        map(all => Object.entries(all).map(([project_group, project_entries]) => 
            <NestedDropdown title={project_group} key={"Allocations_" + project_group}>
            {
                Object.entries(project_entries).map(([title, items]) => 
                    <Dropdown.Item key={"Allocations_" + project_group + "_" + title}
                    onClick={() => SetCurrentRoute(`/Allocations?Nesting=${project_group},${title}`)}>
                        {title}<Badge value={items?.length} style={{marginLeft: 10, background: 'rgb(0, 134, 192)'}}></Badge>
                    </Dropdown.Item>
                )
            }
            </NestedDropdown>
        )),
        map(menu => <NestedDropdown title="Allocations" key="Allocations">{menu}</NestedDropdown>),
        tap(t => console.log("AllocationsMenu: ", t))
    ), defaultAllocationsMenu
)