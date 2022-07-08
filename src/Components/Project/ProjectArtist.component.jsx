import { useEffect, useState } from "react"
import { Skeleton } from 'primereact/skeleton';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import { Tooltip } from 'primereact/tooltip';
import { toggleArrFilter } from "./Overview.filters";

export const ProjectArtist = ({users, background, searchParams, setSearchParams}) => {
    const [displayUsers, setDisplayUsers] = useState(null);

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

                            displayUsers.map(u =>

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