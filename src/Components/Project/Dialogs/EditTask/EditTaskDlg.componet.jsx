import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ScrollPanel } from "primereact/scrollpanel";
import { useRef, useState, useEffect } from "react";
import { Chips } from 'primereact/chips';

import "./EditTaskDlg.component.scss";
import { Stack } from "react-bootstrap";
import { InputText } from "primereact/inputtext";
import _ from "underscore";

export const EditTaskDlg = ({item, timeline, artist, showEditTaskDlg, state, CurrentReview, currentIndex}) => {
    const dialog = useRef();
    const [itemTags, setItemTags] = useState([]);

    const [reviewTags, setReviewTags] = useState([]);
    const [itemName, setItemName] = useState(null);
    const [reviewName, setReviewName] = useState(null);

    useEffect(() => {
        if (!item) return;

        const tags = item.Tags?.value ? item.Tags.value : [];
        setItemName(item.name);
        setItemTags(tags);
    }, [item])

    
    useEffect(() => {
        setReviewTags(CurrentReview?.Tags?.value ? CurrentReview.Tags.value : []);
        setReviewName(CurrentReview?.name ? CurrentReview.name : null)
    }, [CurrentReview])


    const SetTags = (type, val) => {
        if (type === 'item')
            setItemTags(val)
        
        if (type === 'review')
            setReviewTags(val);
    }

    const ChipTemplate = (item) => {
        return (
            <div>
                <span>#{item}</span>
            </div>
        );
    }

    const SetName = (type, val) => {
        if (type === 'task')
            setItemName(val);
        else if (type === 'review')
            setReviewName(val)
    }

    const DlgHeader = ({}) => (
    <div className="pm-dialogHeader" style={{position: 'relative', background: 
            item.Status?.info?.color ? item.Status.info?.color : 'black'}}>
            <span>EditTask:
                <span style={{marginLeft:'10px'}}>
                    {item.name.replace('/', ', ')}
                    <span style={{marginLeft:'10px'}}>({item.Department.text})</span>
                </span>
            </span>
            <Button icon="pi pi-times" style={{background: 'transparent', border:'none'}}
            className="p-button-rounded" aria-label="Cancel" 
            onClick={(e) => showEditTaskDlg.setFalse()}/>
        </div>)

    return (
        <Dialog id="pm-edit-task" showHeader={false} visible={true}
        className="pm-dialog" ref={dialog} onHide={() => showEditTaskDlg.setFalse()}>
            <DlgHeader />
            <ScrollPanel className="pm" style={{height: 'calc(80vh)', overflowX: 'hidden',
                background: 'white'}}>
                <Stack direction="vertical" style={{width: '100%', marginRight: 40, padding:'30px 40px'}} gap={3}>
                {
                    true ? <div>This dialog is in development..</div> : 
                <>
                <Stack direction="horizontal" style={{alignItems: 'baseline', width: '100%'}}>
                    <span className="p-float-label" style={{marginTop: '20px', width: '100%'}}>
                    <InputText id="TaskName" value={itemName} onChange={(evt) =>
                        SetName('task', evt.target.value)}
                        style={{width:'500px'}}/>
                        <label htmlFor="TaskName">Task Name</label>
                    </span>
                </Stack>
                
                    <Stack direction="horizontal" style={{alignItems: 'baseline', width: '100%'}}>
                        <span className="p-float-label" style={{marginTop: '20px', width: '100%'}}>
                            <Chips id="ItemTags" value={itemTags} itemTemplate={ChipTemplate}
                                onChange={(e) => SetTags('item', e.value)}
                                style={{width:'100%'}}></Chips>
                            <label htmlFor="ItemTags">Task Tags</label>
                        </span>
                    </Stack>
                    <div className="pm-attr-note">Note: Task Tags are independent of reviews.</div>

                    <Stack direction="horizontal" style={{alignItems: 'baseline', width: '100%'}}>
                        <span className="p-float-label" style={{marginTop: '20px', width: '100%'}}>
                        <InputText id="ReviewName" value={reviewName} onChange={(evt) => 
                            SetName('review', evt.target.value)}
                            style={{width:'500px'}}/>
                            <label htmlFor="ReviewName">Review Name</label>
                        </span>
                    </Stack>
                    <Stack direction="horizontal" style={{alignItems: 'baseline', width: '100%'}}>
                        <span className="p-float-label" style={{marginTop: '20px', width: '100%'}}>
                            <Chips id="ReviewTags" value={reviewTags} itemTemplate={ChipTemplate}
                                onChange={(e) => SetTags('review', e.value)}
                                style={{width:'100%'}}></Chips>
                            <label htmlFor="ReviewTags">Review Tags</label>
                        </span>
                    </Stack>
                    <div className="pm-attr-note">Note: Review Tags are specific to the current review.</div>
                    </>
                    }
                </Stack>
            </ScrollPanel>
        </Dialog>
    );
} 