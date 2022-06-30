import { Dropdown, Navbar, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import { Fragment, useEffect, useRef, useState } from 'react';
import { FirebaseService } from '../../Services/Firebase';
import { NestedDropdown } from '../General/NestedDropDown';

import * as _ from 'underscore';
import { ProjectDropdown } from '../Navigation/ProjectDropDown';
import { OverlayPanel } from 'primereact/overlaypanel';

export const NavigationComponent = ({user, titles}) => {
    function onStudioPipeline(evt) {
        window.open('https://liquidanimation.atlassian.net/wiki/spaces/LAT0003/overview','_blank');
    }

    const [workspaces, setWorkspaces] = useState([]);

    useEffect(() => {
        const sub = FirebaseService.AllWorkspaces$.subscribe((result) => {
            const w = _.groupBy(result, (w) => {
                if (w.nesting.length > 1)
                    return w.nesting.shift();
                return 'Other';
            });
            setWorkspaces(w);
            console.log("ALL WORKSPACES", w)
        });

        return () => { sub.unsubscribe() }
    }, [])
    return (
        <Navbar expand="lg" fixed="top" bg="dark">
          <Container style={{marginLeft: 20, marginRight: 20, maxWidth: 'unset'}}>
            <Navbar.Brand href="#home" style={{color:"white"}}>Project Manager</Navbar.Brand>
            {
                user ? 
                <Dropdown autoClose="outside">
                    <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faList} /></Dropdown.Toggle>

                    <Dropdown.Menu variant="dark">
                        {
                            workspaces ? Object.keys(workspaces).map((w) => {
                                const workspace = workspaces[w];
                                return (
                                    <NestedDropdown key={w} title={w}>
                                        {
                                            workspace.map(project => 
                                                {
                                                return (<NestedDropdown key={project.name} title={project.nesting.join('_')}>
                                                    <ProjectDropdown projectId={project.name} />
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item>Confluence</Dropdown.Item>
                                                    <Dropdown.Item>Reference</Dropdown.Item>
                                                </NestedDropdown>)
                                                }
                                            )
                                        }
                                    </NestedDropdown>
                                )
                            }) : null
                        }
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={onStudioPipeline}>Studio Pipeline</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown> 
                : null 
            }
            {
                user ?
                <Navbar.Brand href="#home" style={{color:"white"}}>{user.displayName}</Navbar.Brand>
                : null
            }
          </Container>
        </Navbar>
    )
}