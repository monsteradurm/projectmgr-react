import { useEffect, useState } from 'react';
import { Stack } from 'react-bootstrap';
import { Skeleton } from 'primereact/skeleton';
import { Avatars } from '../General/Avatars';
import { Panel } from 'primereact/panel';
import { TabView, TabPanel } from 'primereact/tabview';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { Menubar} from 'primereact/menubar';

const defaultStatus = {text: 'Not Started', info: { color: 'black'}}

const menuItems = [
    {
       label:'File',
       icon:'pi pi-fw pi-file',
       items:[
          {
             label:'New',
             icon:'pi pi-fw pi-plus',
             items:[
                {
                   label:'Bookmark',
                   icon:'pi pi-fw pi-bookmark'
                },
                {
                   label:'Video',
                   icon:'pi pi-fw pi-video'
                },

             ]
          },
          {
             label:'Delete',
             icon:'pi pi-fw pi-trash'
          },
          {
             separator:true
          },
          {
             label:'Export',
             icon:'pi pi-fw pi-external-link'
          }
       ]
    }
]

export const ProjectItem = ({item}) => {
    const [element, setElement] = useState();
    const [task, setTask] = useState('');
    const [status, setStatus] = useState(defaultStatus);
    const [artist, setArtist] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    //const [director, setDirector] = useState([]);

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
            setStatus(s);
            setArtist(item.Artist.value);
            //setDirector(item.Director.value);
        }
    }, [item])

    const header = (options) => {
        const itemClass = options.collapsed ? "pm-projectItem" : "pm-projectItem expanded";
        return (
        <>
            <Stack direction="horizontal" className={itemClass} onClick={options.onTogglerClick}>
                <div className="pm-task-thumb-container">
                    <Skeleton width="100%" height="100%"/>
                </div>
                <Stack direction="horizontal" gap={0}>
                    <div className="pm-task">{task ? task : element }</div>
                    <div className="pm-status" style={{background: status.info.color}}>
                        {status.text}
                    </div>
                    
                    <div style={{width: '100%'}}></div>
                </Stack>
            </Stack>
        </>
        )
    }

    return (
        <>
        <div key="task-left" className="pm-task-left">
                <Avatars users={artist} background={status.info.color}/>
        </div>
        <Panel headerTemplate={header} style={{marginBottom:'10px'}} collapsed={true} toggleable>
            {
                [0, 1, 2].map((i) => 
                <Stack key={i} direction="horizontal" gap={3}>
                    <Skeleton width="100px" height="50px"></Skeleton>
                    <div style={{width:'100%'}}>
                        <Skeleton className="mb-3 mt-3"></Skeleton>
                        <Skeleton className="mb-3"></Skeleton>
                        <Skeleton width="10rem" className="mb-6"></Skeleton>
                    </div>
                    <Avatar size="large" shape="circle" label="NA" 
                            style={{background: status.info.color}}  />
                </Stack>)
            }
            {
            /*
            <Accordion>
                <AccordionTab header="Description">
                    <Skeleton className="mb-2"></Skeleton>
                    <Skeleton className="mb-2"></Skeleton>
                    <Skeleton width="10rem" className="mb-6"></Skeleton>
                </AccordionTab>
            </Accordion>
            */
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