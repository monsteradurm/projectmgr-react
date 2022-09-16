import { SUSPENSE } from "@react-rxjs/core";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUserByName, useUserPhotoByName } from "../../App.Users.context";
import { onArtistClick } from "../Project/Overview.filters";

// use when the user avatar is in suspended state
const UserAvatarSkeleton = () => {
    return <Avatar className="pm-avatar" size="large" shape="circle" 
        style={{background: 'lightgray'}} label=""/>
}


const AvatarTemplate = ({tooltip, image, label, onClick, style}) => {
    return (
        <Button className="pm-badge p-button-rounded"
            style={{...style, position: 'relative'}}
            tooltip={tooltip}
            tooltipOptions={{position: 'top', className:"pm-tooltip"}}>
            { image ? <img src={image} style={{position:'absolute'}}/> : 
            <div style={{position: 'absolute'}}>{label}</div>}
        </Button>
    );
}

// uid is the full name of the user, eg. "Nina Campbell"

export const UserAvatar = ({uid, color, affectFilters}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    if (!uid) return null;

    const key = useId();
    const Photo = useUserPhotoByName(uid);
    const User = useUserByName(uid);

    const initials = uid.split(' ')
        .filter(u => !!u && u.length > 0)
        .map(u => u[0])
        .join("");

    // try receive the photo before bothering with the initials based avatar
    if (Photo === SUSPENSE)
        return <UserAvatarSkeleton key={key} color={color}/>

    // skeleton if the user has no photo and waiting on details to derive initials
    else if (!Photo && User === SUSPENSE)
        return <UserAvatarSkeleton key={key} color={color} />

    // might happen in cases where the user has been removed
    // ie. no longer working for the company
    else if (!Photo && !User) {
        console.warn("No user was found by this name: ", uid);
        // dont display anything.
        return null;
    }

    return (
        <Avatar 
            style={{background: Photo ? 'lightgray' : color || 'gray',
                    transition: Photo ? '5s' : null }}
            tooltip={uid}
            template={AvatarTemplate}
            label={initials}
            image={Photo} key={key} size="large" shape="circle"
            onClick={(evt) => onArtistClick(uid, searchParams, setSearchParams, affectFilters)}
        />
    )

    /*
    return (
        <Avatar data-pr-tooltip={uid} data-pr-position="top"
            className="pm-avatar pm-avatar-image pm-tooltip"
            key={key} size="large" shape="circle" label={initials} 
            onClick={(evt) => onArtistClick(uid, searchParams, setSearchParams, affectFilters)}
            style={{background: color || 'gray'}} />
    )*/

}