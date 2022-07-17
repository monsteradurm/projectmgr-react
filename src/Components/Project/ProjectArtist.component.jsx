import { useContext, useEffect, useState } from "react"
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import { Tooltip } from 'primereact/tooltip';
import { toggleArrFilter } from "./Overview.filters";
import { ApplicationContext } from "@/Application.component";

import * as _ from 'underscore';
import { UserService } from "@Services/User.service";
import { combineLatest, switchMap, take, tap } from "rxjs";

export const ProjectArtist = ({users, background, searchParams, setSearchParams}) => {
    const [displayUsers, setDisplayUsers] = useState(null);
    const [photos, setPhotos] = useState({});
    const AppContext = useContext(ApplicationContext)
    useEffect(() => {
        if (!displayUsers || displayUsers.length < 1 || !AppContext.AllUsers)
            return;
            
        const ids = _.reduce(displayUsers, (acc, u) => {
            const key = u.tooltip.toLowerCase();
            const user = AppContext.AllUsers[key];
            
            if (user) {    
                acc.push([u.tooltip, user.graph.id])    
            }
            return acc;
        }, []);

        if (ids.length > 0)
            combineLatest(ids.map(p => UserService.UserPhoto$(p[1])))
            
            .pipe(take(1))
            .subscribe(
                (blobs) => {
                    const result = {};
                    for(var i=0; i < ids.length; i++) {
                        result[ids[i][0]] = blobs[i]
                    }

                    setPhotos(result);
                });

    }, [displayUsers, AppContext.AllUsers])
    const onArtistClick = (artist) => {
        if (artist.label[0] == '+')
            return;

        toggleArrFilter(artist.tooltip, 'Artist', searchParams, setSearchParams);
    }

    useEffect(() => {
        
        if (!users || users.length < 1) {
            setDisplayUsers(null);
        } else {

            const userCount = users.length;
            let display = users.slice(0, 2).map(u => ({
                tooltip: u,
                label: u.split(' ').map(n => n[0]).join('')
            }))

            if (userCount - 2 > 0) {
                display.push({
                    label: '+' + (userCount-2).toString(), 
                    tooltip: users.slice(2).join(', ')
                });
            }

            setDisplayUsers(display);
        }
    }, [users])
    return (
            displayUsers ? 
                <>
                    <Tooltip target=".pm-avatar" position="top" className="pm-tooltip" mouseTrack={false}
                    mouseTrackTop={10}/>
                    <AvatarGroup> 
                        {
/*<img className="pm-artist-photo" src={photos[u.tooltip]} /> */
                            displayUsers.map(u =>
                                    photos && photos[u.tooltip] ? 
                                    <Avatar data-pr-tooltip={u.tooltip} data-pr-position="top"
                                        className="pm-avatar pm-avatar-image"
                                        onClick={(evt) => onArtistClick(u)}
                                        image={photos[u.tooltip]}
                                        key={u.label}  size="large" shape="circle"
                                        /> :
                                    <Avatar data-pr-tooltip={u.tooltip} data-pr-position="top"
                                        className="pm-avatar"
                                        onClick={(evt) => onArtistClick(u)}
                                        key={u.label}  size="large" shape="circle" label={u.label} 
                                        
                                        style={{background: background}} />
                            )
                        }
                    </AvatarGroup>
                </>
            :   null
    )
}