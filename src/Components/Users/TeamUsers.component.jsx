import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles, useAllUsers, usePrimaryColor } from "../../Application.context";
import { ErrorLoading } from "../General/ErrorLoading";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { TeamsTable } from "./TeamsTable.component";
import { UsersTable } from "./UsersTable.component";
import "./Users.component.scss";
import { SUSPENSE } from "@react-rxjs/core";
import { Button, Column, DataTable } from "primereact";
import { useUserPhotoByName } from "../../App.Users.context";
import { Stack } from "react-bootstrap";


const UserTemplate = (data) => {
    console.log(data?.monday?.name);
    return(<RowAvatar name={data?.monday?.name} />)
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

export const TeamUsersComponent = ({team}) => {
    const AllUsers = useAllUsers();
    const [virtualUsers, setVirtualUsers] = useState([]);

    useEffect(() => {
        if (!AllUsers || AllUsers === SUSPENSE)
            return;

        setVirtualUsers(
            team.users.map(u => AllUsers[u.name.toLowerCase()]).filter(u => !!u)
        )
    }, [AllUsers, team]);

    return (
        <DataTable value={virtualUsers} style={{marginBottom: 30, paddingLeft: 60, paddingRight: 60}}>
            <Column header="Name" body={UserTemplate}></Column>
            <Column header="Email" body={MailTemplate}></Column>
        </DataTable>
    )
}