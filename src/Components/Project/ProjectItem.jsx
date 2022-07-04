import { useEffect, useState } from 'react';
import { Stack, Dropdown } from 'react-bootstrap';
import { Skeleton } from 'primereact/skeleton';
import { Avatars } from '../General/Avatars';
import { Panel } from 'primereact/panel';
import { TabView, TabPanel } from 'primereact/tabview';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { Menubar} from 'primereact/menubar';
import { SplitButton } from 'primereact/splitbutton';
import { Button} from 'primereact/button'
import { ScrollPanel } from 'primereact/scrollpanel'
import moment from 'moment';
import { ReviewItem } from './ReviewItem';
const defaultStatus = {text: 'Not Started', info: { color: 'black'}}

const formatTimeline = (tl) => {
    if (!tl.text || tl.text.length < 1 || tl.text.indexOf(' - ') < 0)
        return 'No Timeline';
    const range = tl.text.split(' - ');

    return range.map(d => moment(d).format('MMM d')).join(' - ');
}

export const ProjectItem = ({item}) => {
    const [element, setElement] = useState();
    const [task, setTask] = useState('');
    const [status, setStatus] = useState(defaultStatus);
    const [artist, setArtist] = useState([]);
    const [activeTab, setActiveTab] = useState('Internal Reviews');
    const [tabHTML, setTabHTML] = useState(null);
    const [timeline, setTimeline] = useState(null);
    //const [director, setDirector] = useState([]);

    useEffect(() => {
        setTabHTML(
            activeTab.indexOf('Review') >= 0 ? reviewsHTML :
                activeTab.indexOf('Summary') >= 0 ? summaryHTML
                    : null
        )
    }, [activeTab])
    useEffect(() => {
        if (item) {
            let nameArr = [item.name, null]
            if (item.name.indexOf('/'))
                nameArr = item.name.split('/')
            
            setElement(nameArr[0]);
            setTask(nameArr[1]);
            let s = item.Status;
            if (!s.text || s.text.length < 1) {
                s.text = defaultStatus.text;
                s.info = defaultStatus.info;
            }
            setTimeline(formatTimeline(item.Timeline));
            setStatus(s);
            setArtist(item.Artist.value);
            //setDirector(item.Director.value);
        }
    }, [item])

    const menuItems = [{
        label: activeTab.indexOf('Review') >= 0 ? activeTab : 'Reviews',
        className: activeTab.indexOf('Review') >= 0 ? 'pm-item-tab-active' :'',
        items: [{label: 'Internal', className: "pm-item-submenu",
            command: (event) => { setActiveTab('Internal Reviews')}}, 
            {label: 'Client',  className: "pm-item-submenu",
            command: (event) => { setActiveTab('Client Reviews') }}, 
            {label: 'Franchise',  className: "pm-item-submenu",
            command: (event) => { setActiveTab('Franchise Reviews') }}, 
            {label: 'All Reviews',  className: "pm-item-submenu",
            command: (event) => { setActiveTab('All Reviews') }}, 
            {separator: true}, 
            {label: 'Upload Review',  className: "pm-item-submenu",
            command: (event) => { setActiveTab('Upload Review') }}]
    },
    {
        label: 'Reference', className: activeTab.indexOf('Reference') >= 0 ? 'pm-item-tab-active' :'',
        command: (event) => { setActiveTab('Reference') }
    }, 
    {
        label: 'Summary', className: activeTab.indexOf('Summary') >= 0 ? 'pm-item-tab-active' :'',
        command: (event) => { setActiveTab('Summary')}
    }]

    const header = (options) => {
        const itemClass = options.collapsed ? "pm-projectItem" : "pm-projectItem expanded";
        return (
        <>
            <Stack direction="horizontal" className={itemClass} onClick={options.onTogglerClick}>
                <div className="pm-task-thumb-container">
                    <Skeleton width="100px" height="100%"/>
                </div>
                <Stack direction="horizontal" gap={0}>
                    <div className="pm-task">{task ? task : element }</div>
                    <div className="pm-status" style={{background: status.info.color}}>
                        {status.text}
                    </div>
                    <Stack direction="vertical" gap={0}>
                        <div className="pm-task-latest-review">Internal Review #4</div>   
                        <div className="pm-task-latest-timeline"> ({timeline})</div>
                    </Stack>         
                </Stack>
                <div className="pm-task-tags">#CBB, #KeyShot</div>
            </Stack>
        </>
        )
    }

    const reviewsHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => 
        <ReviewItem key={i} status={status} review={{}} ></ReviewItem>)

    const summaryHTML = (
        <div style={{width:'100%'}}>
                <Skeleton className="mb-3 mt-3"></Skeleton>
                <Skeleton className="mb-3"></Skeleton>
                <Skeleton className="mb-3"></Skeleton>
                <Skeleton className="mb-3"></Skeleton>
                <Skeleton className="mb-3"></Skeleton>
                <Skeleton className="mb-3"></Skeleton>
                <Skeleton width="10rem" className="mb-6"></Skeleton>
        </div>
    )
    return (
        <>
            <div key="task-left" className="pm-task-left">
                    <Avatars users={artist} background={status.info.color}/>
            </div>
            
            
            <Panel headerTemplate={header} style={{marginBottom:'10px'}} collapsed={true} toggleable>
                <Menubar model={menuItems}/>
                {
                    <ScrollPanel style={{width: '100%', height: '400px'}} className="pm">
                        { tabHTML }
                    </ScrollPanel>
                }
            </Panel>
            <div key="task-right" className="pm-task-right">
                    <Stack direction="horizontal" gap={1}>
                        <Skeleton shape="circle" size="50px" />
                        <Skeleton shape="circle" size="50px" />
                        <Skeleton shape="circle" size="50px" />
                    </Stack>
            </div>
        </>
    )
    
}