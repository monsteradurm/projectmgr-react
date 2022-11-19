import { SUSPENSE } from "@react-rxjs/core";
import { AvatarGroup } from "primereact/avatargroup";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useContext, useEffect, useId, useState } from "react";
import { UserAvatar } from "@Components/General/UserAvatar";
import { useAllUsers } from "@Components/../Application.context";
import { Stack } from "react-bootstrap";

const SuspendedArtists= () => {
    const key = useId();

    return [0, 1].map(b =>
    <Button className="pm-badge suspended p-button-rounded" key={`${key}_${b}`} 
        style={{background: 'lightgray'}}>
    </Button>)
}

export const TableItemLogUsers = ({artists, color, id, align, searchKey, width=150}) => {
    const [artistArr, setArtistArr] = useState(null);
    const AllUsers = useAllUsers();

    useEffect(() => {
        if (artists && artists.length > 0) {
            setArtistArr(artists.filter(a => !!AllUsers[a.toLowerCase()]))
        }
    }, [artists])

    if (!artistArr)
        return <></>
        
    return (
        <Stack direction="horizontal" style={{width: width}}>
            {
                align === "left" && <div className="mx-auto"></div>
            }
            <Tooltip target=".pm-avatar" position="top" className="pm-tooltip" mouseTrack={false}
                    mouseTrackTop={10}/>
            <AvatarGroup>
            {
                artistArr.map(a => 
                <UserAvatar key={id + "_" + a} uid={a} color={color} affectFilters={false} style={{width:'30px !important', height: '30px !important'}}/>)
            }
            </AvatarGroup>
            {
                align === "right" && <div className="mx-auto"></div>
            }
        </Stack>             
    )
}