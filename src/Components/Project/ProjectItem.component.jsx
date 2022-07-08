import { useEffect, useMemo, useRef, useState } from 'react';
import { Stack } from 'react-bootstrap';
import { Skeleton } from 'primereact/skeleton';
import { Avatars, ProjectArtist } from './ProjectArtist.component';
import { Panel } from 'primereact/panel';
import { Menubar} from 'primereact/menubar';
import { ScrollPanel } from 'primereact/scrollpanel'
import moment from 'moment';
import { ReviewItem } from './ReviewItem.component';
import { ContextMenu } from 'primereact/contextmenu';
import { MondayService } from '../../Services/Monday.service';
import * as _ from 'underscore';
import { ItemBadgeIcon } from '../../Helpers/ProjectItem.helper';
import { Tooltip } from 'primereact/tooltip';
import { Button } from 'primereact/button';
import { toggleArrFilter, toggleStatusFilter } from './Overview.filters';

const defaultStatus = {text: 'Not Started', info: { color: 'black'}}

const formatTimeline = (tl) => {
    if (!tl.text || tl.text.length < 1 || tl.text.indexOf(' - ') < 0)
        return 'No Timeline';
    const range = tl.text.split(' - ');

    return range.map(d => moment(d).format('MMM DD')).join(' - ');
}


export const ProjectItem = ({boardId, projectItem, statusMenu, badgeMenu, grouping,
    departmentOptions, tagOptions, setSearchParams, searchParams, badgeOptions}) => {
    const [element, setElement] = useState();
    const [task, setTask] = useState('');
    const [status, setStatus] = useState(defaultStatus);
    const [artist, setArtist] = useState([]);
    const [director, setDirector] = useState([]);

    const [activeTab, setActiveTab] = useState('Internal Reviews');
    const [tabHTML, setTabHTML] = useState(null);
    const [timeline, setTimeline] = useState(null);
    const [taskTags, setTaskTags] = useState([]);
    const [subitems, setSubitems] = useState(null);
    const [reviewTags, setReviewTags] = useState([]);
    const [badges, setBadges] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const statusRef = useRef();
    const itemContext = useRef(null);

    useEffect(() => {
        setTabHTML(
            activeTab.indexOf('Review') >= 0 ? reviewsHTML :
                activeTab.indexOf('Summary') >= 0 ? summaryHTML
                    : null
        )
    }, [activeTab])

    const item = useMemo(() => {
        let item = projectItem;
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

        setSubitems(item.subitems.reverse())
        setStatus(s);

        setDirector(item.Director.value);
        setBadges(item.Badges && item.Badges.value ? item.Badges.value.reduce((acc, b) => {
            if (tagOptions[b])
                acc.push(b)
            return acc;
        }, []) : [])

        setTaskTags(item.Tags && item.Tags.value ? item.Tags.value.reduce((acc, t) => {
            if (tagOptions[t]) {
                acc.push(t)
            }
            return acc;
        }, []) : [])
        
        
        return item;
    }, [projectItem, tagOptions])

    const currentReview = useMemo(() => {
        if (!subitems || subitems.length < 1) {
            setTimeline(formatTimeline(item.Timeline));
            setArtist(item.Artist.value);
            setLastUpdated(item.updated_at);
            return null;
        }
            
        const current = _.last(subitems);

        setTimeline(
            formatTimeline(current.Timeline?.text?.length > 0 ? 
                current.Timeline : item.Timeline)
        );

        setArtist(current.Artist?.value && current.Artist.value.length > 0? 
            current.Artist.value : item.Artist.value);
        
        setLastUpdated(current.updated_at > item.updated_at ?
            current.updated_at : item.updated_at);
            
        return current;
    }, [subitems])
    
    const contextMenu = useMemo(() => {
        const statusOptions = _.map(statusMenu, (s) => (
            {...s, command: (e) => {

                        setStatus({...item.Status, text: s.label,
                            info: {...item.Status.info, color: s.style.background }})
                        
                        MondayService.SetItemStatus(boardId, item.id, s.column_id, s.id);
                    }
                }
            )
        )
        const removeBadge = (item?.Badges?.value && item.Badges.value.length > 0) ?
        { label: 'Remove Badge', items: _.reduce(item.Badges.value,
                (acc, cur) => {
                    const b = _.find(badgeMenu, b => b.label === cur.replace(/[A-Z]/g, ' $&').trim())
                    if (b)
                        acc.push(b)
                    return acc;
                }, []
        )} : null;

        const addBadge = { label: 'Add Badge', items: badgeMenu};
        const badgeMenuOptions = removeBadge && removeBadge.items.length > 0 ? 
            [addBadge,  removeBadge] : [addBadge];

        const result = [
            {label: 'Status', items: statusOptions},
            {label: 'Badges', items: badgeMenuOptions},

            {separator: true},
            {label: 'Upload Review'},
            {label: 'Upload Reference'},
            {separator: true},
            {label: 'Edit Task'}
        ];

        
        return result;
    }, [item, boardId, badgeMenu, statusMenu])

    const OnStatusClick = (evt) => {
        if (statusRef.current.className.indexOf('hover') > -1) {
            evt.stopPropagation();
            evt.preventDefault();
            toggleArrFilter(item.Status.text, 'Status', searchParams, setSearchParams)
        }
    }
    const AddStatusHover = () => {
        statusRef.current.className = "pm-status pm-status-hover"
    }
    const RemoveStatusHover = (evt) => {
        statusRef.current.className = "pm-status"
    }
    const onTagClick = (evt, t) => {
        evt.stopPropagation();
        toggleArrFilter(t, 'Tags', searchParams, setSearchParams);
    }


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
            command: (event) => { setActiveTab('All Reviews') }}
        ]
    },
    {
        label: activeTab.indexOf('Reference') >= 0 ? activeTab : 'Reference', 
        className: activeTab.indexOf('Reference') >= 0 ? 'pm-item-tab-active' :'',
        items: departmentOptions.map((d) => {
            const title = d.indexOf('All Departments') === 0? 'All Reference' : d;
            return ({ label: title, command: (event) => 
                setActiveTab(title.indexOf('Reference') >= 0 ? title : title + ' Reference') })
        })
    }, 
    {
        label: 'Summary', className: activeTab.indexOf('Summary') >= 0 ? 'pm-item-tab-active' :'',
        command: (event) => { setActiveTab('Summary')}
    }]

    const header = (options) => {
        const itemClass = options.collapsed ? "pm-projectItem" : "pm-projectItem expanded";
        return (
        <>
            <ContextMenu model={contextMenu} ref={itemContext} className="pm-task-context"></ContextMenu>
            <Stack direction="horizontal" className={itemClass} 
                onClick={options.onTogglerClick} onContextMenu={(e) => itemContext.current.show(e)}>
                <div className="pm-task-thumb-container">
                    <Skeleton width="100px" height="100%"/>
                </div>
                <Stack direction="horizontal" gap={0} style={{position:'relative'}}>
                    <div className="pm-task">
                        {
                            grouping != 'Element' ?
                            <span style={{fontWeight:600, marginRight: '10px', position: 'absolute', left: '10px'}}>
                                {element}
                            </span> : null
                        }

                        {
                            task ? task : element 
                        }
                    </div>
                    <div className="pm-status" ref={statusRef} 
                        onClick={OnStatusClick}
                        style={{background: status.info.color}}>
                        <span onMouseEnter={AddStatusHover}
                            onMouseLeave={RemoveStatusHover}>{status.text}</span>
                    </div>
                    <Stack direction="vertical" gap={0}>
                        <div className="pm-task-latest-review">{currentReview ? currentReview.name : ''}</div>   
                        <div className="pm-task-latest-timeline"> ({timeline})</div>
                    </Stack>         
                </Stack>
                <div className="pm-task-tags">
                    {
                        taskTags.map((t) => 
                        <div className="pm-tag" key={tagOptions[t].id} 
                            style={{color: 'black'}}
                            onClick={(evt) => onTagClick(evt, t)}>
                            {'#' + t}
                        </div>)
                    }
                </div>
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
                    <ProjectArtist users={artist} 
                    searchParams={searchParams} setSearchParams={setSearchParams}
                    background={status.info.color}/>
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
                    <Stack direction="horizontal" gap={2}>
                        {
                            badges && badgeOptions ? 
                            badges.map((b) => 
                                <Button className="pm-badge p-button-rounded" key={b}
                                    onClick={(evt) => 
                                        toggleArrFilter(b, 'Badges', searchParams, setSearchParams)}
                                    tooltip={badgeOptions[b].Title}
                                    tooltipOptions={{position: 'top', className:"pm-tooltip"}}
                                    style={{background: badgeOptions[b].Background}}>
                                        {ItemBadgeIcon(badgeOptions[b])}
                                </Button>) : null
                        }
                    </Stack>
            </div>
        </>
    )
    
}