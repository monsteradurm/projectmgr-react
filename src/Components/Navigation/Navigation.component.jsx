import { Dropdown, Navbar, Container, Stack } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faUsers, faFilm, faCogs, faHome, faTruckMedical, faLink, faUser } from '@fortawesome/free-solid-svg-icons';
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
import { refreshUsersCache, SimulateUser, useCanReviewApplications, useGroupedUsers, useIsAdmin, useManagers, useMyWorkspaces, useUserPhotoByName } from '../../App.Users.context';
import { SUSPENSE } from '@react-rxjs/core';
import { useHomeMenu } from '../Home/Home.context';
import { SendToastSuccess, SendToastWarning } from '../../App.Toasts.context';
import { UserAvatar } from '../General/UserAvatar';
import { ShowNewTicketDialog, useSupportOptions } from '../Support/Support.context';
import { useApplicationForms, useApplicationGroups } from '../Applications/Applications.context';


const ClearSyncsketchProjectCache = () => {
    const key = "Syncsketch/Project/"
    const validKeys = Object.keys(sessionStorage).filter(k => k.startsWith(key));
    if (validKeys.length > 0) {
        validKeys.forEach(k => sessionStorage.removeItem(k));
        SendToastSuccess("Cleared " + validKeys.length + " Cached Keys");
    } else {
        SendToastWarning("No Syncsketch Project Cache Keys to Clear")
    }
}

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
    const isReviewer = useCanReviewApplications();
    const ApplicationGroups = useApplicationGroups();
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
    
    const onTabOpen = (url) => window.open(url, '_blank');
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
                                                                <Dropdown.Divider /> {
                                                                    project?.nesting?.length > 0 &&
                                                                    <Dropdown.Item onClick={() => onTabOpen(
                                                                        `https://liquidanimation.atlassian.net/wiki/spaces/${
                                                                            project.nesting.length > 1 ? (
                                                                                project.nesting[1].indexOf('_') > 0 ? 
                                                                                project.nesting[1].split('_')[0] : project.nesting[1]
                                                                            ) : (
                                                                                project.nesting[0].indexOf('_') > 0 ? 
                                                                                project.nesting[0].split('_')[0] : project.nesting[1]
                                                                            )
                                                                        }/overview`)}>Confluence</Dropdown.Item>
                                                                }
                                                                
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
                                
                                {
                                    isReviewer && <>
                                        <Dropdown.Divider />
                                        <NestedDropdown title="Applications">
                                        {
                                            ApplicationGroups.map(a => 
                                                <NestedDropdown key={"ApplicationFormGroup_" + a.group} title={a.group}>
                                                {
                                                    a.forms.map(f => <NestedDropdown key={"ApplicationForm_" + f.id} title={f.nesting[1]}>
                                                            <Dropdown.Item 
                                                                    onClick={() => SetCurrentRoute('/Applications?Form=' + f.id)}>
                                                                Responses
                                                            </Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item 
                                                                    onClick={() => onTabOpen("https://liquidanimation.typeform.com/to/" + f.id)}>
                                                                Application
                                                            </Dropdown.Item>
                                                        </NestedDropdown>
                                                    )
                                                }
                                                </NestedDropdown>
                                            )
                                        }
                                        </NestedDropdown>
                                    </>
                                }
                                
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
                                                <Dropdown.Item key={"Support_" + option.label + "_All"} 
                                                       onClick={() => SetCurrentRoute(
                                                        `/Support?Board=${option.label}&Group=All Groups&View=Tickets`)
                                                    }>All {option.label}</Dropdown.Item>
                                                <Dropdown.Divider />
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
                            <Dropdown.Toggle style={{fontSize: 20}}>
                                <FontAwesomeIcon icon={faLink}></FontAwesomeIcon>
                                <Dropdown.Menu variant="dark">
                                    <NestedDropdown title="Disney">              
                                        <Dropdown.Item onClick={() => onTabOpen('https://fastpass-wdi.disney.com/aspera/faspex')}>Fast Pass</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://myid.disney.com/')}>My ID</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://api.ibmaspera.com/api/v1/oauth2/disneysendit/login')}>Send It</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://disney.slack.com')}>Slack</Dropdown.Item>
                                    </NestedDropdown>
                                    <NestedDropdown title="Lego">
                                    <Dropdown.Item onClick={() => onTabOpen('https://legogroup.sharepoint.com/')}>SharePoint</Dropdown.Item>
                                    </NestedDropdown>
                                    <NestedDropdown title="Liquid">
                                        <NestedDropdown title="Box">
                                            <Dropdown.Item onClick={() => onTabOpen('https://liquidanimation.app.box.com')}>Home</Dropdown.Item>
                                            <Dropdown.Item onClick={() => onTabOpen('https://liquidanimation.box.com/s/hoxxs0m9ytrc6qfpk82r4jl5n5whpqf1')}>Utilities</Dropdown.Item>
                                        </NestedDropdown>
                                        <Dropdown.Item onClick={() => onTabOpen('https://liquidanimation.monday.com')}>Monday</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('http://mail.liquidanimation.com')}>Outlook</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://liquidanimation.slack.com')}>Slack</Dropdown.Item>
                                        <Dropdown.Item  
                                            onClick={() => onTabOpen('https://teams.microsoft.com')}>Teams</Dropdown.Item>
                                    </NestedDropdown>
                                    <NestedDropdown title="Technical">
                                        <Dropdown.Item onClick={() => onTabOpen('https://aad.portal.azure.com/')}>Azure Portal</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://cloud.digitalocean.com/login?redirect_url=https%3A%2F%2Fcloud.digitalocean.com%2Flanding')}>Digital Ocean</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://my.fastcomet.com/clientarea.php')}>Fast Comet</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://firebase.google.com')}>Firebase</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://fontawesome.com/icons')}>Font Awesome</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onTabOpen('https://www.hostinger.com/cpanel-login')}>Hostinger</Dropdown.Item>
                                    </NestedDropdown>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => onTabOpen('https://jsonformatter.curiousconcept.com')}>JSON Formatter</Dropdown.Item>
                                    
                                </Dropdown.Menu>
                            </Dropdown.Toggle>
                        </Dropdown>
                        <Dropdown autoClose="outside">
                                <Dropdown.Toggle style={{fontSize:'20px'}}><FontAwesomeIcon icon={faCogs} /></Dropdown.Toggle>
                                <Dropdown.Menu variant="dark">
                                    <NestedDropdown title="Clear Cache">
                                        <NestedDropdown title="Syncsketch">
                                                <Dropdown.Item key="SSProjcts_Cache" onClick={() => ClearSyncsketchProjectCache()}>Projects</Dropdown.Item>
                
                                        </NestedDropdown>
                                            <Dropdown.Item key="Users_Cache"  onClick={() => refreshUsersCache()}>Users</Dropdown.Item>
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
                    <Stack direction="horizontal" gap={1} style={{width: '100%', justifyContent: 'end'}}>
                        {   
                            User && User !== SUSPENSE?
                            <>
                            <Dropdown autoClose="outside" style={{marginRight: 0, height: 45}}>
                                <Dropdown.Toggle style={{fontSize:'20px'}}>
                                    <Navbar.Brand  style={{color:"white", textAlign:"right", 
                                        fontWeight: 300, fontSize: 18, width: 'fit-content'}}>
                                        {
                                        SimulatedUser ? 
                                            SimulatedUser.monday.name + ' (Simulated)': 
                                                User ? User.displayName : ''}
                                    </Navbar.Brand>
                                </Dropdown.Toggle>
                                <Dropdown.Menu variant="dark">
                                    <Dropdown.Item onClick={() => SetCurrentRoute('/SignOut')}>Sign Out</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                            
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