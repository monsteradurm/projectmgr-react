import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
import { DispatchProjectItemState, ProjectItemState } from '../Context/ProjectItem.context';
import { UploadReview } from './Dialogs/UploadReview.component';
import { SyncsketchService } from '../../Services/Syncsketch.service';
import { NavigationService } from '../../Services/Navigation.service';
import { ItemSummary } from './ItemSummary.component';

export const ProjectItemContext = React.createContext(ProjectItemState);

const formatTimeline = (tl) => {
    if (!tl.text || tl.text.length < 1 || tl.text.indexOf(' - ') < 0)
        return 'No Timeline';
    const range = tl.text.split(' - ');

    return range.map(d => moment(d).format('MMM DD')).join(' - ');
}

export const ProjectItem = ({ boardId, projectItem, statusOptions, badgeOptions, grouping,
    departmentOptions, tagOptions, setSearchParams, searchParams}) => {
    const [state, dispatch] = useReducer(DispatchProjectItemState, ProjectItemState);

    const [statusMenu, setStatusMenu] = useState([]);
    const [addBadgeMenu, setAddBadgeMenu] = useState([]);
    const [removeBadgeMenu, setRemoveBadgeMenu] = useState(null);
    const [contextMenu, setContextMenu] = useState([]);

    const [reviewLink, setReviewLink] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);

    const [tabMenu, setTabMenu] = useState([]);
    const [reviewsTab, setReviewsTab] = useState(null);
    const [referenceTab, setReferenceTab] = useState(null);
    const [summaryTab, setSummaryTab] = useState(null);

    const [reviewTabItems, setReviewTabItems] = useState([]);
    const [referenceTabItems, setReferenceTabItems] = useState([]);

    const [tabHTML, setTabHTML] = useState(null);
    const [reviewsHTML, setReviewsHTML] = useState(null);
    const [referenceHTML, setReferenceHTML] = useState(null);
    const [summaryHTML, setSummaryHTML] = useState(null);
    const [collapsed, setCollapsed] = useState(true);

    const [showUploadReviewDlg, setShowUploadReviewDlg] = useState(false);

    const statusRef = useRef();
    const itemContext = useRef(null);

    const { Status, Artist, Director, Timeline, 
            CurrentReview, Reviews, Reference, Tags, Badges, 
            LastUpdate, Element, Task } = state.item;

    const { ActiveTab } = state.params;

    useEffect(() => {
        setTabHTML(
            ActiveTab.indexOf('Review') >= 0 ? reviewsHTML :
                ActiveTab.indexOf('Summary') >= 0 ? summaryHTML
                    : referenceHTML
        )
    }, [ActiveTab, reviewsHTML, summaryHTML, referenceHTML])


    useEffect(() => {
        dispatch({ type: 'Name', value: projectItem.name })
    }, [projectItem.name]);

    useEffect(() => {
        dispatch({ type: 'Director', value: projectItem.Director.value })
    }, [projectItem.Director]);

    useEffect(() => {
        dispatch({ type: 'Status', value: projectItem.Status})
    }, [projectItem.Status]);

    useEffect(() => {
        if (CurrentReview?.Link?.text && CurrentReview.Link.text.length > 0)
            setReviewLink(CurrentReview.Link.text);
        else if (reviewLink !== null)
            setReviewLink(null);

        let tags = CurrentReview?.Tags?.value ?
            CurrentReview.Tags.value.reduce((acc, t) => {
                if (tagOptions[t]) {
                    acc.push(t)
                }
                return acc;
            }, []) : [];
        dispatch({ type: 'ReviewTags', value: tags });

    }, [CurrentReview])

    useEffect(() => {
        if (reviewLink) {
            const id = _.first(
                _.last(reviewLink.split('/#/')).split('/')
            )

            SyncsketchService.ItemById$(id).subscribe(result => {
                if (result.thumbnail_url)
                    setThumbnail(result.thumbnail_url)
            });
        }
    }, [reviewLink])
    useEffect(() => {
        let badges = projectItem.Badges?.value ?
        projectItem.Badges.value.reduce((acc, b) => {
                if (tagOptions[b])
                    acc.push(b)
                return acc;
            }, []) : [];
        dispatch({ type: 'Badges', value: badges });
    }, [projectItem.Badges, badgeOptions]);

    useEffect(() => {
        let tags = projectItem.Tags?.value ?
            projectItem.Tags.value.reduce((acc, t) => {
                if (tagOptions[t]) {
                    acc.push(t)
                }
                return acc;
            }, []) : [];
        dispatch({ type: 'ItemTags', value: tags });
    }, [projectItem.Tags, tagOptions])

    useEffect(() => {   
        let grouped = {};
        const subitems = projectItem.subitems ? 
            [...projectItem.subitems.filter(
                (i) => 
                    i['Feedback Department']?.text?.length > 0 &&
                    i.name?.length > 0
            )].reverse() : [];

            if (!subitems || subitems.length < 1) {
                
                dispatch({ type: 'Timeline', value: formatTimeline(projectItem.Timeline) });
                dispatch({ type: 'Artist', value: 
                    projectItem.Artist.value.filter(a => a && a.length > 0)
                });
                dispatch({ type: 'LastUpdate', value: projectItem.updated_at });
                dispatch({ type: 'CurrentReview', value: null})
                dispatch({ type: 'ActiveTab', value: 'Summary' });
            } else {
                dispatch({ type: 'CurrentReview', value: _.first(subitems) });

                grouped = _.groupBy(subitems, (i) => i['Feedback Department'].text + ' Reviews');
                Object.keys(grouped).forEach((k) => {
                    const length = grouped[k].length; 
                    grouped[k].map((sub, index) => sub.index = length - index);
                });
            }
            
            grouped['All Reviews'] = subitems;
            dispatch({ type: 'Reviews', value: grouped })

    }, [projectItem.subitems])

    useEffect(() => {
        if (CurrentReview == null)
            return;

        dispatch({ type: 'ActiveTab', value: 
            CurrentReview['Feedback Department'].text + ' Reviews' });
        dispatch({ type: 'Timeline', value: 
            formatTimeline(CurrentReview.Timeline?.text?.length > 0 ? 
                CurrentReview.Timeline : projectItem.Timeline)
        });
        dispatch({ type: 'Artist', value: 
            CurrentReview.Artist?.value && CurrentReview.Artist.value.length > 0 ? 
            CurrentReview.Artist.value.filter(a => a && a.length > 0) : 
            projectItem.Artist.value.filter(a => a && a.length > 0)
        });
        dispatch({ type: 'LastUpdate', value: 
            CurrentReview.updated_at > projectItem.updated_at ?
            CurrentReview.updated_at : projectItem.updated_at
        });
    }, [CurrentReview]);

    useEffect(() => {
        setStatusMenu(_.map(statusOptions, (s) => (
            {...s, command: (e) => {

                        dispatch({ type: 'Status', value: {...projectItem.Status, text: s.label,
                            info: {...projectItem.Status.info, color: s.style.background }}
                        });
                        
                        MondayService.SetItemStatus(boardId, projectItem.id, s.column_id, s.id);
                    }
                }
            )
        ))
    }, [statusOptions])

    useEffect(() => {
        const labels = Object.keys(badgeOptions);
        const menu = {label: 'Add Badge', items: []}
        if (labels.length > 0) 
            menu.items = (_.map(_.flatten(Object.values(labels)), (b) => ({
                label: badgeOptions[b].Title,
                icon: ItemBadgeIcon(badgeOptions[b]),
                style: {background: badgeOptions[b].Background},
                className: 'pm-status-option'
            }))
        )
    
        setAddBadgeMenu(menu);
    }, [badgeOptions])

    useEffect(() => {
        if (!Badges || Badges.length < 1)
            setRemoveBadgeMenu(null);
        
        setRemoveBadgeMenu(
            { label: 'Remove Badge', items: _.reduce(projectItem.Badges.value,
                (acc, cur) => {
                    const b = badgeOptions[cur.replace(/[A-Z]/g, ' $&').trim()]
                    if (b)
                        acc.push(b)
                    return acc;
                }, [])
            }
        )
        }, [Badges, badgeOptions])

    useEffect(() => {
        const result = [
            {label: 'Status', items: statusMenu},
            {label: 'Badges', items: [addBadgeMenu, removeBadgeMenu]},

            {separator: true},
            {label: 'Upload Review', command: (evt) => setShowUploadReviewDlg(true)},
            {label: 'Upload Reference', command: (evt) => {}},
            {separator: true},
            {label: 'Edit Task', command: (evt) => {}}
        ];

        setContextMenu(result);
    }, [addBadgeMenu, removeBadgeMenu, statusMenu])

    const OnStatusClick = (evt) => {
        if (statusRef.current.className.indexOf('hover') > -1) {
            evt.stopPropagation();
            evt.preventDefault();
            toggleArrFilter(Status.text, 'Status', searchParams, setSearchParams)
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

    useEffect(() => {
        setReviewTabItems(
            Object.keys(Reviews).map((r) => ({
                label: r, className: "pm-item-submenu", 
                    command: (evt) => dispatch({ type: 'ActiveTab', value: r })
                    })
                )
        )
    }, [Reviews]);

    useEffect(() => {
        setReferenceTabItems(
            departmentOptions.map((d) => {
                const allSelected =  d.indexOf('All Departments') === 0;
                const title = allSelected ? 'All Reference' : d;
                return ({ label: title, command: (event) => 
                    dispatch({ type: 'ActiveTab', value:
                        allSelected ? title : title + ' Reference' 
                    }) // dispatch
                }) // item loop
            }) // departments
        )
    }, [departmentOptions])

    useEffect(() => {
        const reviewSelected = ActiveTab.indexOf('Review') >= 0;
        const referenceSelected = ActiveTab.indexOf('Reference') >= 0;
        const summarySelected = ActiveTab === 'Summary';

        setReviewsTab({
            label: reviewSelected ? ActiveTab : 'Reviews',
            className: reviewSelected ? 'pm-item-tab-active' :'',
            items: reviewTabItems
        });

        setReferenceTab({
            label: referenceSelected ? ActiveTab : 'Reference', 
            className: referenceSelected ? 'pm-item-tab-active' :'',
            items: referenceTabItems
        })

        setSummaryTab({
            label: 'Summary', 
            className: summarySelected ? 'pm-item-tab-active' :'',
            command: (event) => dispatch({type: 'ActiveTab', value: 'Summary' })
        });
    }, [ActiveTab, reviewTabItems, referenceTabItems])

    const header = (options) => {
        const itemClass = options.collapsed ? "pm-projectItem" : "pm-projectItem expanded";

        return (
        <> 
            {
                showUploadReviewDlg ? 
                <UploadReview item={projectItem} reviews={Reviews}
                visibility={true} setVisibility={setShowUploadReviewDlg} /> : null
            }
            <ContextMenu model={contextMenu} ref={itemContext} className="pm-task-context"></ContextMenu>
            <Stack direction="horizontal" className={itemClass} 
                onClick={options.onTogglerClick} onContextMenu={(e) => itemContext.current.show(e)}>
                <div className="pm-task-thumb-container">
                    {
                        thumbnail ? <img src={thumbnail} className="pm-overview-thumbnail" 
                            onClick={(e) => NavigationService.OpenNewTab(reviewLink, e)}
                            width="100px" height="100%" /> :
                            <Skeleton width="100px" height="100%"/>
                    }
                </div>
                <Stack direction="horizontal" gap={0} style={{position:'relative'}}>
                    <div className="pm-task">
                        {
                            grouping != 'Element' ?
                            <span style={{fontWeight:600, marginRight: '10px', position: 'absolute', left: '10px'}}>
                                {Element}
                            </span> : null
                        }

                        {
                            Task ? Task : Element 
                        }
                    </div>
                    <div className="pm-status" ref={statusRef} 
                        onClick={OnStatusClick}
                        style={{background: Status.info.color}}>
                        <span onMouseEnter={AddStatusHover}
                            onMouseLeave={RemoveStatusHover}>{Status.text}</span>
                    </div>
                    <Stack direction="vertical" gap={0} style={{padding:'2px'}}>
                        <div className="pm-task-latest-review" style={CurrentReview ?
                            {} : {color:'#999', fontStyle: 'italic'}}>
                            {CurrentReview ? CurrentReview.name : 'No Reviews'}
                        </div>   
                        <div className="pm-task-latest-timeline"> ({Timeline})</div>
                    </Stack>         
                </Stack>
                <Stack direction="vertical" style={{justifyContent: 'center'}}>
                    <Stack direction="horizontal" gap={2} className="pm-task-tags">
                        {
                            Tags.Item.map((t) => 
                            <div className="pm-tag" key={tagOptions[t].id} 
                                style={{color: 'black'}}
                                onClick={(evt) => onTagClick(evt, t)}>
                                {'#' + t}
                            </div>)
                        }
                    </Stack>
                    <Stack direction="horizontal" gap={2} 
                    className="pm-task-tags" style={{color: Status.info.color}}>
                        {
                            Tags.Review.map((t) => 
                            <div className="pm-tag" key={tagOptions[t].id} 
                                style={{color: Status.info.color}}
                                onClick={(evt) => onTagClick(evt, t)}>
                                {'#' + t}
                            </div>)
                        }
                    </Stack>
                </Stack>
            </Stack>
        </>
        )
    }

    useEffect(() => {
        if (collapsed || ActiveTab.indexOf('Reviews') < 0) {
            setReviewsHTML(null);
            return;
        }

        const reviews = Reviews[ActiveTab];
        if (!reviews || reviews.length < 1) {
            setReviewsHTML(null);
            return;
        }

        setReviewsHTML(Reviews[ActiveTab].map((i) => 
                    <ReviewItem key={i.id} status={Status} review={i} activeTab={ActiveTab}
                        currentReview={CurrentReview} tagOptions={tagOptions} searchParams={searchParams} 
                        setSearchParams={setSearchParams}></ReviewItem>)
        );
    }, [ActiveTab, Reviews, collapsed])



    useEffect(() => 
        setReferenceHTML(
            "Reference Content..."
        )
    , [])

    useEffect(() =>
        setSummaryHTML(
            collapsed && ActiveTab.indexOf('Summary') >= 0 ?
            <ItemSummary item={projectItem} />
    : null), [])

    return (
        <ProjectItemContext.Provider value={state}>
            <div key="task-left" className="pm-task-left">
                    <ProjectArtist users={Artist} 
                    searchParams={searchParams} setSearchParams={setSearchParams}
                    background={Status.info.color}/>
            </div>
            
            <Panel headerTemplate={header} style={{marginBottom:'10px'}} collapsed={collapsed} 
                onToggle={(e) => setCollapsed(e.value)} toggleable>
                <Menubar model={[reviewsTab, referenceTab, summaryTab]}/>
                {
                    <ScrollPanel style={{width: '100%', height: '400px'}} className="pm">
                        { tabHTML }
                    </ScrollPanel>
                }
            </Panel>
            <div key="task-right" className="pm-task-right">
                    <Stack direction="horizontal" gap={2}>
                        {
                            Badges && badgeOptions ? 
                            Badges.map((b) => 
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
        </ProjectItemContext.Provider>
    )
}