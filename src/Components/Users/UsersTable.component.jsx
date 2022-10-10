import { SUSPENSE } from "@react-rxjs/core";
import { Button, Column, DataTable, Skeleton } from "primereact";
import { useEffect, useRef, useState } from "react";
import { Stack } from "react-bootstrap";
import { useUserPhotoByName } from "../../App.Users.context";
import { useAllUsers, usePrimaryColor } from "../../Application.context"
import * as _ from 'underscore';

const UserTemplate = (data) => {
    return(<RowAvatar name={data?.monday?.name} />)
}
const PerforceTemplate = (data) => {
    return <div>{data?.graph?.mail.split('@')[0]}-perforce</div>
}
const RoleTemplate = (data) => {
    return <div>{data?.monday.title}</div>
}
const MailTemplate = (data) => {
    return <div>{data?.graph.mail}</div> 
}
const RowAvatar = ({name}) => {
    const photo = useUserPhotoByName(name);
    const background = usePrimaryColor();
    let initials = name[0];
    if (name.indexOf(' ') >= 0)
        initials = name.split(' ').map(u => u[0]).join('');

    return (
        <Stack direction="horizontal" gap={3}>
            
            <Button className="pm-user p-button-rounded" style={{background, fontWeight: 600}}>  
            { photo && photo !== SUSPENSE ? <img src={photo} style={{position:'absolute'}}/> : 
                <div style={{position: 'absolute'}}>{initials}</div>}
            </Button>
            <div style={{fontWeight: 600}}>{name}</div>
        </Stack>
    );
}
export const UsersTable = ({headerHeight}) => {
    const AllUsers = useAllUsers();
    const [virtualUsers, setVirtualUsers] = useState([]);
    const tableRef = useRef();


    useEffect(() => {
        if (!AllUsers || AllUsers === SUSPENSE)
            return;

        setVirtualUsers(_.sortBy(
                Object.values(AllUsers), u=> u.monday.name)
        );
    }, [AllUsers])

    return (
        <DataTable value={virtualUsers} scrollable scrollHeight={`calc(100% - ${headerHeight}px`} ref={tableRef}>
            <Column header="Name" body={UserTemplate}></Column>
            <Column header="Role" body={RoleTemplate}></Column>
            <Column header="Perforce" body={PerforceTemplate}></Column>
            <Column header="Email" body={MailTemplate}></Column>
        </DataTable>
    )
}