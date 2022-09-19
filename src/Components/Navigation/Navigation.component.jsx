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
import { useMyAvatar, useMyBoards, usePrimaryColor, useTitles } from '../../Application.context';
import { DelayBy } from '../General/DelayBy';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMyWorkspaces } from '../../App.Users.context';
import { SUSPENSE } from '@react-rxjs/core';
import { useHomeMenu } from '../Home/Home.context';

export const NavigationComponent = ({User, Initializing}) => {
    const PrimaryColor = usePrimaryColor();
    const [workspaces, setWorkspaces] = useState([]);
    const navRef = useRef();
    const MyBoards = useMyBoards();
    const MyAvatar = useMyAvatar();
    const MyWorkspaces = useMyWorkspaces();
    const HomeMenuOptions = useHomeMenu();

    console.log("HomeMenuOptions", HomeMenuOptions);
    const Titles = useTitles();
    const navigate = useNavigate()

    useEffect(() => {
        if (MyWorkspaces === SUSPENSE || !MyWorkspaces || MyWorkspaces.length < 1)
            return;
         
        setWorkspaces(_.groupBy(
            MyWorkspaces, (w) => {
                if (w.nesting.length > 1)
                    return w.nesting.shift();
                return 'Other';
            })
        )
    }, [MyWorkspaces])

    function onStudioPipeline(evt) {
        window.open('https://liquidanimation.atlassian.net/wiki/spaces/LAT0003/overview','_blank');
    }
    
    return (
        <>
            <Navbar expand="lg" bg="dark" ref={navRef} style={{height: 50}}>
            <Container style={{marginLeft: 20, marginRight: 20, maxWidth: 'unset'}}>
                <Navbar.Brand href="#home" style={{color:"white", textAlign:"left"}}>Project Manager</Navbar.Brand>
                {   User && !Initializing?
                    <>
                        <Dropdown autoClose="outside">
                            <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faHome} /></Dropdown.Toggle>
                        
                            <Dropdown.Menu variant="dark">
                            {
                                HomeMenuOptions
                            }
                            </Dropdown.Menu>
                        </Dropdown>
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
                    </> : null
                }  
                {
                    <Stack direction="horizontal" gap={1} style={{width: '100%'}}>
                        {   
                            User ?
                            <>
                            <Navbar.Brand  style={{color:"white", textAlign:"right", 
                                fontWeight: 300, fontSize: 18}}>
                                {User ? User.displayName : ''}
                            </Navbar.Brand>
                            {
                                MyAvatar ? 
                                <img src={MyAvatar} className="pm-avatar-image" /> :
                                <DelayBy ms={100}>
                                    <Avatar label="NA" shape="circle" size="large" />
                                </DelayBy>
                            } 
                            </> : null
                        }
                    </Stack>
                }
            </Container>
            </Navbar>
            {
                <div key="title_bar" className="pm-titlebar" 
                    style={{background: PrimaryColor, color:'white'}}>
                    <Stack direction="horizontal" gap={3}>
                        <div className="pm-title">
                            {
                            Titles?.map(t => {
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