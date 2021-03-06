import { Dropdown, Navbar, Container, Stack } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faUsers, faFilm, faCogs, faHome, faTruckMedical } from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useRef, useState } from 'react';
import { FirebaseService } from '../../Services/Firebase.service';
import { NestedDropdown } from '../General/NestedDropDown.component';
import { ProjectDropdown } from './ProjectDropDown.component';
import './Navigation.component.scss';
import * as _ from 'underscore';
import { ApplicationContext } from '../../Application.component';
import { Avatar } from 'primereact/avatar';

export const NavigationComponent = () => {
    const AppContext = useContext(ApplicationContext);
    const [workspaces, setWorkspaces] = useState([]);
    const navRef = useRef();

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

    function onStudioPipeline(evt) {
        window.open('https://liquidanimation.atlassian.net/wiki/spaces/LAT0003/overview','_blank');
    }
    
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
                    <Stack direction="horizontal" gap={1} style={{width: '100%'}}>
                        <Navbar.Brand  style={{color:"white", textAlign:"right", 
                            fontWeight: 300, fontSize: 18}}>
                            {AppContext.User ? AppContext.User.displayName : ''}
                        </Navbar.Brand>
                        {
                            AppContext.Photo ? 
                            <img src={AppContext.Photo} className="pm-avatar-image" /> :
                            <Avatar label="NA" shape="circle" size="large" />
                        }
                    </Stack>
                }
            </Container>
            </Navbar>
            {
                <div key="title_bar" className="pm-titlebar" 
                    style={{background: AppContext.PrimaryColor, color:'white'}}>
                    <Stack direction="horizontal" gap={3}>
                        <div className="pm-title">
                            {
                            AppContext.Titles?.map(t => {
                                if (t.indexOf('/') >= 0)
                                    return t.split('/').join(" | ");
                                return t;
                            }).join(" | ").replace('_', ' ')
                        }</div>
                    </Stack>
                </div>
            }
        </>
    )
}