import { Dropdown, Navbar, Container, Stack } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faUsers, faFilm, faCogs, faHome, faTruckMedical } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { FirebaseService } from '../../Services/Firebase';
import { NavigationService } from '../../Services/Navigation';
import { NestedDropdown } from '../General/NestedDropDown';
import { ProjectDropdown } from '../Navigation/ProjectDropDown';
import './Navigation.scss';

import * as _ from 'underscore';

export const NavigationComponent = ({user, primaryColor}) => {
    function onStudioPipeline(evt) {
        window.open('https://liquidanimation.atlassian.net/wiki/spaces/LAT0003/overview','_blank');
    }

    const [workspaces, setWorkspaces] = useState([]);
    const [titles, setTitles] = useState(null);
    const navRef = useRef();
    useEffect(() => {
        let sub = NavigationService.Titles$.subscribe(titlesRes => {
            setTitles(titlesRes);
        });

        return () => sub.unsubscribe();

    }, [])

    useEffect(() => {
        const sub = FirebaseService.AllWorkspaces$.subscribe((result) => {
            const w = _.groupBy(result, (w) => {
                if (w.nesting.length > 1)
                    return w.nesting.shift();
                return 'Other';
            });
            setWorkspaces(w);
        });

        return () => { sub.unsubscribe() }
    }, [])
    return (
        <>
            <Navbar expand="lg" bg="dark" ref={navRef}>
            <Container style={{marginLeft: 20, marginRight: 20, maxWidth: 'unset'}}>
                <Navbar.Brand href="#home" style={{color:"white", textAlign:"left"}}>Project Manager</Navbar.Brand>
                <Dropdown autoClose="outside">
                        <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faHome} /></Dropdown.Toggle>
                        <Dropdown.Menu variant="dark">
                            <Dropdown.Item key="placeholder">Placeholder</Dropdown.Item>
                        </Dropdown.Menu>
                </Dropdown>
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
                <Dropdown autoClose="outside">
                    <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faUsers} /></Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                        <Dropdown.Item key="users">Users</Dropdown.Item>
                        <Dropdown.Item key="teams">Teams</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item key="teams">Applications</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                <Dropdown autoClose="outside">
                    <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faFilm} /></Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                        <Dropdown.Item key="placeholder">Placeholder</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown autoClose="outside">
                        <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faTruckMedical} /></Dropdown.Toggle>
                        <Dropdown.Menu variant="dark">
                            <Dropdown.Item key="placeholder">Placeholder</Dropdown.Item>
                        </Dropdown.Menu>
                </Dropdown>    
                <Dropdown autoClose="outside">
                        <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faCogs} /></Dropdown.Toggle>
                        <Dropdown.Menu variant="dark">
                            <Dropdown.Item key="placeholder">Placeholder</Dropdown.Item>
                        </Dropdown.Menu>
                </Dropdown>            
                {
                    user ?
                    <Navbar.Brand href="#home" style={{color:"white", textAlign:"right"}}>{user.displayName}</Navbar.Brand>
                    : null
                }
            </Container>
            </Navbar>
            {
                titles && titles.length > 0 ?
                <div key="title_bar" className="pm-titlebar" style={{background: primaryColor, color:'white'}}>
                    <Stack direction="horizontal" gap={3}>
                        <div className="pm-title">{titles.map(t => {
                            if (t.indexOf('/') >= 0)
                                return t.split('/').join(" | ");
                            return t;
                        }).join(" | ").replace('_', ' ')}</div>
                    </Stack>
                </div> : null
            }
        </>
    )
}