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
import { SetCurrentRoute, useAllUsers, useMyAvatar, useMyBoards, usePrimaryColor, useTitles } from '../../Application.context';
import { DelayBy } from '../General/DelayBy';
import { useLocation, useNavigate } from 'react-router-dom';
import { refreshUsersCache, SimulateUser, useGroupedUsers, useIsAdmin, useManagers, useMyWorkspaces, useUserPhotoByName } from '../../App.Users.context';
import { SUSPENSE } from '@react-rxjs/core';
import { useHomeMenu } from '../Home/Home.context';
import { SendToastWarning } from '../../App.Toasts.context';
import { UserAvatar } from '../General/UserAvatar';
import { ShowNewTicketDialog, useSupportOptions } from '../Support/Support.context';

export const NavigationComponent = ({User, Initializing, SimulatedUser}) => {
    const PrimaryColor = usePrimaryColor();
    const [workspaces, setWorkspaces] = useState([]);
    const navRef = useRef();
    const MyBoards = useMyBoards();
    const MyAvatar = useMyAvatar();
    const MyWorkspaces = useMyWorkspaces();
    const HomeMenuOptions = useHomeMenu();
    const GroupedUsers = useGroupedUsers();
    const SimulatedAvatar = useUserPhotoByName(SimulatedUser?.monday?.name)
    const Titles = useTitles();
    const Photo = useMyAvatar();
    const isAdmin = useIsAdmin();
    const Managers = useManagers();
    const SupportOptions = useSupportOptions();
    useEffect(() => {
        if (MyWorkspaces === SUSPENSE || !MyWorkspaces)
            return;
         
        setWorkspaces(_.groupBy(
            MyWorkspaces, (w) => {
                if (w.nesting.length > 1)
                    return w.nesting[0];
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
                                    workspaces && Object.keys(workspaces).length > 0 ? Object.keys(workspaces).map((w) => {
                                        const workspace = workspaces[w];
                                        return (
                                            <NestedDropdown key={w} title={w}>
                                                {
                                                    workspace.map(project => 
                                                        {
                                                        return (
                                                            <NestedDropdown key={project.name} title={project.name}>
                                                                <ProjectDropdown projectId={project.name} MyBoards={MyBoards}/>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item onClick={() => SendToastWarning("not Yet Implemented..")}>Confluence</Dropdown.Item>
                                                                <Dropdown.Item onClick={() => SendToastWarning("not Yet Implemented..")}>Reference</Dropdown.Item>
                                                            </NestedDropdown>)
                                                        }
                                                    )
                                                }
                                            </NestedDropdown>
                                        )
                                    }) : <Dropdown.Item style={{fontStyle: 'italic'}}>No Projects Assigned</Dropdown.Item>
                                }
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={onStudioPipeline}>Studio Pipeline</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown> 
                    
                        <Dropdown autoClose="outside">
                            <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faUsers} /></Dropdown.Toggle>
                            <Dropdown.Menu variant="dark">
                                <Dropdown.Item key="users" 
                                    onClick={() => SetCurrentRoute('/Users?View=Users')}>Users</Dropdown.Item>
                                <Dropdown.Item key="teams" 
                                    onClick={() => SetCurrentRoute('/Users?View=Teams')}>Teams</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item key="applications" 
                                    onClick={() => SetCurrentRoute('/Applications')}>Applications</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>

                        <Dropdown autoClose="outside">
                            <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faFilm} /></Dropdown.Toggle>
                            <Dropdown.Menu variant="dark">
                                <Dropdown.Item key="placeholder"  onClick={() => SendToastWarning("not Yet Implemented..")}>NYI</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Dropdown autoClose="outside">
                                <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faTruckMedical} /></Dropdown.Toggle>
                                <Dropdown.Menu variant="dark">
                                    {
                                        SupportOptions && SupportOptions !== SUSPENSE ?
                                        SupportOptions.map(option => (
                                            <NestedDropdown title={option.label} key={"Support_" + option.label}>
                                            {
                                                option.groups.map(g => (
                                                    <Dropdown.Item key={"Support_" + option.label + "_" + g.title} 
                                                        onClick={() => SetCurrentRoute(
                                                            `/Support?Board=${option.label}&Group=${g.title}&View=Tickets`)
                                                        }>{g.title}</Dropdown.Item>
                                                ))
                                            }
                                            <Dropdown.Divider />
                                                <Dropdown.Item key={"Support_" + option.label + "_NewTicket"} 
                                                        onClick={() => ShowNewTicketDialog(option.label)}>New Ticket</Dropdown.Item>
                                            </NestedDropdown>)
                                        ) : null
                                    }
                                </Dropdown.Menu>
                        </Dropdown>    
                        <Dropdown autoClose="outside">
                                <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faCogs} /></Dropdown.Toggle>
                                <Dropdown.Menu variant="dark">
                                    <NestedDropdown title="Cache">
                                            <Dropdown.Item key="Users_Cache"  onClick={() => refreshUsersCache()}>Clear Users</Dropdown.Item>
                                    </NestedDropdown>
                                    <Dropdown.Divider />
                                    {
                                        isAdmin && 
                                            <NestedDropdown title="Simulate User">
                                            {
                                                GroupedUsers && GroupedUsers !== SUSPENSE ?
                                                GroupedUsers.map(u => 
                                                    <NestedDropdown title={u.label} key={u.label}>
                                                        {
                                                            u.users.length > 0 ?
                                                            u .users.map(
                                                                user => 
                                                                <Dropdown.Item key={"sim_" + user.monday.name}  
                                                                onClick={() => SimulateUser(user.monday.name)}>{user.monday.name}</Dropdown.Item>
                                                            ) :
                                                            <Dropdown.Item key={"sim_" + u.label + "_NO_USERS"}></Dropdown.Item>
                                                        }
                                                    </NestedDropdown> 
                                                ) : null
                                            }
                                            <Dropdown.Divider />
                                                        <Dropdown.Item key={"sim_CLEAR"}
                                                            onClick={() => SimulateUser(null)}>Clear</Dropdown.Item>
                                        </NestedDropdown>
                                    
                                    }
                            </Dropdown.Menu>
                        </Dropdown>        
                    </> : null
                }  
                {
                    <Stack direction="horizontal" gap={1} style={{width: '100%'}}>
                        {   
                            User && User !== SUSPENSE?
                            <>
                            <Navbar.Brand  style={{color:"white", textAlign:"right", 
                                fontWeight: 300, fontSize: 18}}>
                                {
                                SimulatedUser ? 
                                    SimulatedUser.monday.name + ' (Simulated)': 
                                        User ? User.displayName : ''}
                            </Navbar.Brand>
                            {
                                SimulatedUser && SimulateUser !== SUSPENSE? 
                                    (
                                        SimulatedAvatar && SimulatedAvatar !== SUSPENSE?
                                        <img src={SimulatedAvatar} className="pm-avatar-image" /> :
                                        <Avatar label="NA" shape="circle" size="large" />

                                    ) :
                                        Photo && Photo !== SUSPENSE? 
                                            <img src={Photo} className="pm-avatar-image" /> :
                                            <Avatar 
                                                label={User?.displayName?.split(' ')?.map(u => u[0])?.join('')} shape="circle" size="large" />
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