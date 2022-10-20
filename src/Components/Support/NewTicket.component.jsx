import { SUSPENSE } from "@react-rxjs/core";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useEffect, useRef, useState } from "react";
import { Stack } from "react-bootstrap";
import { CreateTicket, SetMachineIP, SetMachineName, SetNewTicketName, SetRequestors, 
    ShowNewTicketDialog, useMachineIP, useMachineName, useNewTicketDialog, useNewTicketName, 
    usePriorityOptions, useRequestorOptions, useRequestors, useSupportGroups, useTypeOptions } from "./Support.context";
import { DialogHeader } from "../General/DialogHeader";
import "./Support.component.scss"
import { ScrollPanel } from "primereact/scrollpanel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { AutoComplete } from "primereact/autocomplete";
import _ from "underscore";
import { useUserPhotoByName } from "../../App.Users.context";
import { UserAvatar } from "../General/UserAvatar";
import { Avatar } from "primereact/avatar";

const RequestorTemplate = ({tag, background}) => {
    const photo = useUserPhotoByName(tag.user.name);
    let initials = tag.user.name[0];
    if (tag.user.name.indexOf(' ') >= 0)
        initials = tag.user.name.split(' ').map(u => u[0]).join('');

    return (
        <Stack direction="horizontal" gap={3}>
            
            <Button className="pm-requestor p-button-rounded" style={{background, fontWeight: 600}}>  
            { photo && photo !== SUSPENSE ? <img src={photo} style={{position:'absolute'}}/> : 
                <div style={{position: 'absolute'}}>{initials}</div>}
            </Button>
            <div style={{fontWeight: 600}}>{tag.label}</div>
        </Stack>
    );
}

export const NewTicketDialog = ({}) => {
    const Board = useNewTicketDialog();
    const TicketName = useNewTicketName();
    const MachineName = useMachineName();
    const MachineIP = useMachineIP();
    const GroupOptions = useSupportGroups(Board);
    const PriorityOptions = usePriorityOptions(Board);
    const TypeOptions = useTypeOptions();
    const RequestorOptions = useRequestorOptions();
    const Requestors = useRequestors();
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [priority, setPriority] = useState(_.find(PriorityOptions, p => p.label === 'Normal'));
    const [group, setGroup] = useState(null);
    const [type, setType] = useState(null);
    const background = priority ? priority.color : 'black';
    const [editorState, setEditorState] = useState(
        ''
    );

    const editTicketRef = useRef();
    const dialogRef = useRef()
    
    useEffect(() => {
        setEditorState('');
    }, [Board])
    const searchRequestors = (event) => {
        try {
            const optionIds = _.pluck(Requestors, 'id');
            console.log(Requestors, optionIds);
            const options = RequestorOptions.filter(r => optionIds.indexOf(r.id) < 0)
            let _filteredOptions;

            if (!event.query.trim().length) {
                _filteredOptions = [...options];
            } else {
                _filteredOptions = options.filter((o) => {
                    return o.label.toLowerCase().startsWith(event.query.toLowerCase());
                });
            }
            setFilteredOptions(_filteredOptions);
        } catch (err) {
            console.log(err)
        }
    };

    const RemoveRequestor = (e, chip) => {
        SetRequestors(Requestors.filter(r => r.id != chip.id));
    }
    
    const SelectedItemTemplate = (tag) => {
        return (
            <div style={{background: background, color: 'white'}}>{tag.label}
            <span className="pi pi-times" onClick={(e) => RemoveRequestor(e, tag)}></span>
            </div>
        );
    }

    
    const ItemTemplate = (tag) => <RequestorTemplate tag={tag} background={background} />

    const header = (
        <DialogHeader color={background}
            HeaderRight={priority ?  priority.label + " Priority" : ''}
            Header={"New Support Ticket (" + Board + ")" } 
                onClose={() => ShowNewTicketDialog(null)}/>
    )

    const footer = null;
    return (
        <Dialog id="pm-new-ticket" showHeader={true} visible={!!Board} style={{overflowY: 'hidden'}}
            footer={footer} header={header} closable={false}
            className="pm-dialog" ref={dialogRef} onHide={() => ShowNewTicketDialog(null)}>

                <Stack id="ticket-container" gap={3} style={{padding: 30, height: '100%'}}>
                    <Stack direction="horizontal" gap={3}>
                        {
                            (GroupOptions && GroupOptions !== SUSPENSE) &&
                            <span className="p-float-label">
                                    <Dropdown id="SupportGroup" value={group} options={GroupOptions} onChange={(e) => setGroup(e.value)}
                                    optionLabel="title" placeholder="Select A Category"></Dropdown>
                                    <label htmlFor="SupportGroup">Category</label> 
                            </span>
                        }
                        {
                            (PriorityOptions && PriorityOptions !== SUSPENSE) &&
                            <span className="p-float-label">
                                <Dropdown id="Priority" value={priority} options={PriorityOptions} onChange={(e) => setPriority(e.value)}
                                optionLabel="label" placeholder="Select A Priority"></Dropdown>
                                <label htmlFor="Priority">Priority</label> 
                            </span>
                        }
                        <span className="p-float-label">
                            <Dropdown id="Type" value={type} options={TypeOptions} onChange={(e) => setType(e.value)}
                            placeholder="Select A Type"></Dropdown>
                            <label htmlFor="Type">Type</label> 
                        </span>
                        <span className="p-float-label" style={{width: '100%'}}>
                            <InputText id="NewTicketName" value={TicketName}  
                                style={{width:'100%'}} onChange={(e) => SetNewTicketName(e.target.value)}
                                placeholder="eg. Cannot Access S:/, Maya License,  etc." />
                            <label htmlFor="NewTicketName">Title</label> 
                        </span>
                    </Stack>
                    <Stack direction="horizontal" gap={3} style={{marginTop:20}}>
                        <span className="p-float-label" style={{width: 250}}>
                            <InputText id="MachineName" value={MachineName}  
                                style={{width:'100%'}} onChange={(e) => SetMachineName(e.target.value)}
                                placeholder="eg. S-WS-0088" />
                            <label htmlFor="MachineName">Machine Name</label> 
                        </span>

                        <span className="p-float-label" style={{width: 250}}>
                            <InputText id="IP" value={MachineIP}  
                                style={{width:'100%'}} onChange={(e) => SetMachineIP(e.target.value)}
                                placeholder="eg. 10.0.2.100" />
                            <label htmlFor="IP">Machine IP</label> 
                        </span>

                        
                        {
                            filteredOptions &&
                            <span className="p-float-label" style={{width: '100%'}}>
                                <AutoComplete id="Requestors" multiple={1} value={Requestors} 
                                    completeMethod={searchRequestors}
                                    forceSelection
                                    suggestions={filteredOptions} field="label"
                                    onChange={(e) => SetRequestors(e.value)} itemTemplate={ItemTemplate} 
                                        selectedItemTemplate={SelectedItemTemplate}/>
                                <label htmlFor="Requestors">Requestor</label>
                            </span>
                        }
                    </Stack>

                    <ReactQuill theme="snow" value={editorState} onChange={setEditorState} 
                        bounds="#ticket-container" 
                        placeholder="Please write an informative description for your ticket."
                        style={{height: '100%', width: '100%', marginBottom: 30, marginTop: 10}}/>

                    <Stack direction="horizontal" style={{padding: '30px 0 10px 10px'}}>
                        <div className="mx-auto"></div>
                        <Button label="Submit" onClick={() => CreateTicket(Board, {
                            TicketName, MachineName, Priority: priority, Description: editorState,
                            Group: group, MachineIP, Requestors, Type: type
                        }) }
                            style={{width: 100}}/>
                    </Stack>
                    
                </Stack>
        </Dialog>
    )
}