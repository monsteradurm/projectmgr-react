import { ContextMenu } from "primereact/contextmenu";
import { useContext, useEffect, useRef, useState } from "react";
import { Stack } from "react-bootstrap";
import { useBoolean } from "react-hanger";
import useString from "../../Hooks/useString";
import { UploadReview } from "../Dialogs/UploadReview.component";
import { ProjectContext } from "../Overview.component";
import { LazyThumbnail } from "@Components/General/LazyThumbnail";
import { ItemBadgeIcon } from '@Helpers/ProjectItem.helper';
import { SyncsketchService } from '@Services/Syncsketch.service';
import { map, take } from 'rxjs';
import { ToastService } from '@Services/Toast.service';
import { MondayService } from '@Services/Monday.service';
import * as _ from 'underscore';

export const ProjectItemHeader = ({mouseOverItem, projectItem, collapsed, state, dispatch}) => {
    const [statusMenu, setStatusMenu] = useState([]);
    const [addBadgeMenu, setAddBadgeMenu] = useState([]);
    const [removeBadgeMenu, setRemoveBadgeMenu] = useState(null);
    const [itemContextMenu, setItemContextMenu] = useState(null);
    const [thumbnail$, setThumbnail$] = useState(null);

    const showUploadReviewDlg = useBoolean(false);
    const itemContextMenuRef = useRef();
    const statusRef = useRef();

    const reviewLink = useString(null);
    
    const projectContext = useContext(ProjectContext);

    const itemClass = collapsed.value ? "pm-projectItem" : "pm-projectItem expanded";

    const { Status, Artist, Timeline, Reviews, Tags, Badges, 
        LastUpdate, Element, Task } = state.item;

    const { TagOptions, BadgeOptions, StatusOptions } = projectContext.objects;
    const { Grouping } = projectContext.params.Grouping;
    const { BoardId } = projectContext.params;
    const { CurrentReview } = projectItem;
    
    const handleContextMenu = (e) => {
        itemContextMenuRef.current.show(e);
    }

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
        if (CurrentReview?.Link?.text && CurrentReview.Link.text.length > 0)
            reviewLink.Set(CurrentReview.Link.text);
        else if (reviewLink.value !== null)
            reviewLink.Reset();

        let tags = CurrentReview?.Tags?.value ?
            CurrentReview.Tags.value.reduce((acc, t) => {
                if (TagOptions[t]) {
                    acc.push(t)
                }
                return acc;
            }, []) : [];
        dispatch({ type: 'ReviewTags', value: tags });

    }, [CurrentReview])

    useEffect(() => {
        if (reviewLink.value) {
            const id = _.first(
                _.last(reviewLink.value.split('/#/')).split('/')
            )
            setThumbnail$(SyncsketchService.ItemById$(id).pipe(
                take(1),
                map(result => result.thumbnail_url ? result.thumbnail_url : null)
            ))
        }
    }, [reviewLink.value])

    useEffect(() => {
        if (mouseOverItem.value != projectItem.id && itemContextMenuRef.current)
            itemContextMenuRef.current.hide();

    }, [mouseOverItem.value])

    useEffect(() => {
        setStatusMenu(_.map(StatusOptions, (s) => (
            {...s, command: (e) => {
                        MondayService.SetItemStatus(BoardId, projectItem.id, s.column_id, s.index);
                        dispatch({ type: 'Status', value: {...projectItem.Status, text: s.label,
                            info: {...projectItem.Status.info, color: s.style.background }}
                        }); 
                    }
                }
            )
        ))
    }, [StatusOptions])

    useEffect(() => {
        const labels = Object.keys(BadgeOptions);
        const menu = {label: 'Add Badge', items: []}
        if (labels.length > 0) 
            menu.items = (_.map(_.flatten(Object.values(labels)), (b) => ({
                label: BadgeOptions[b].Title,
                icon: ItemBadgeIcon(BadgeOptions[b]),
                style: {background: BadgeOptions[b].Background},
                command: (e) => {
                    if (_.find(Badges, (e) => e.name == b)) {
                        ToastService.SendError('"' + b + '"' + ' has already been assigned!')
                        return;
                    }
                    if (Badges.length >= 3) {
                        ToastService.SendError('There is a limit of 3 "Badges" per Item.');
                        return
                    }
                    MondayService.AddItemBadge(BoardId, projectItem.id, 
                        projectItem.Badges.id, Badges, b, TagOptions[b] ? TagOptions[b].id : null);

                    dispatch({ type: 'Badges', value: [...Badges, {name: b, id: ''}]});
                },
                className: 'pm-status-option'
            }))
        )
    
        setAddBadgeMenu(menu);
    }, [BadgeOptions, Badges])

    useEffect(() => {
        if (!Badges || Badges.length < 1) {
            setRemoveBadgeMenu(null);
            return;
        }
        
        setRemoveBadgeMenu(
            { label: 'Remove Badge', items: _.reduce(projectItem.Badges.value,
                (acc, cur) => {
                    const b = BadgeOptions[cur];
                    
                    if (b)
                        acc.push({label: b.Title,
                            icon: ItemBadgeIcon(b),
                            style: {background: b.Background},
                            className: 'pm-status-option',
                            command: (e) => {
                                const badge = _.find(Badges, (i) => i.name === cur);
                                const entries = Badges.filter(i => i.id != badge.id);

                                if (!badge) {
                                    ToastService.SendError("Could Not Remove Badge: " + cur);
                                    return;
                                }

                                MondayService.RemoveItemBadge(BoardId, projectItem.id, 
                                    projectItem.Badges.id, Badges, cur, badge.id);

                                dispatch({ type: 'Badges', value: entries});
                            }
                        });
                    return acc;
                }, [])
            }
        )
        }, [Badges, BadgeOptions])

    useEffect(() => {
        const result = [
            {label: 'Status', items: statusMenu},
            {label: 'Badges', items: removeBadgeMenu ? [addBadgeMenu, removeBadgeMenu] : [addBadgeMenu]},
            {separator: true},
            {label: 'Upload Review', command: (evt) => showUploadReviewDlg.setTrue()},
            //{label: 'Upload Reference', command: (evt) => {}},
            {separator: true},
            {label: 'Edit Task', command: (evt) => {}}
        ];

        setItemContextMenu(result);
    }, [addBadgeMenu, removeBadgeMenu, statusMenu]);

    return (
    <div onMouseEnter={() => mouseOverItem.Set(projectItem.id)}> 
            <ContextMenu model={itemContextMenu} ref={itemContextMenuRef} 
                                    className="pm-task-context"></ContextMenu>
                                
            {
                showUploadReviewDlg.value ? 
                <UploadReview item={projectItem} reviews={Reviews}
                visibility={true} showUploadReviewDlg={showUploadReviewDlg} /> : null
            }      

            <Stack direction="horizontal" className={itemClass} 
                onClick={(e) => collapsed.toggle()} onContextMenu={handleContextMenu}>
                <div className="pm-task-thumb-container">
                    <LazyThumbnail width={100} height={60} thumbnail$={thumbnail$} url={reviewLink}/>
                </div>
                <Stack direction="horizontal" gap={0} style={{position:'relative'}}>
                    <div className="pm-task">
                        {
                            Grouping != 'Element' ?
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
                            <div className="pm-tag" key={TagOptions[t].id} 
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
                            <div className="pm-tag" key={TagOptions[t].id} 
                                style={{color: Status.info.color}}
                                onClick={(evt) => onTagClick(evt, t)}>
                                {'#' + t}
                            </div>)
                        }
                    </Stack>
                </Stack>
            </Stack>
        </div>
    )
}