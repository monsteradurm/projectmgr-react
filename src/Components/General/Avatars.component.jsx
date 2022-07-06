import { useEffect, useState } from "react"
import { Skeleton } from 'primereact/skeleton';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';

export const Avatars = ({users, background}) => {
    const [displayUsers, setDisplayUsers] = useState(null);
    useEffect(() => {
        if (!users || users.length < 1) {
            setDisplayUsers(null);
        } else {
            const userCount = users.length;
            let display = users.slice(0, 2).map(u => ({label: u.split(' ').map(n => n[0]).join('')}))

            if (userCount > 2)
                display.push({label: '+' + (userCount - 2).toString()})
            setDisplayUsers(display);
        }
    }, [users])
    return (
            displayUsers ? 
                <AvatarGroup> 
                    {
                        displayUsers.map(u =>
                            <Avatar key={u.label} size="large" shape="circle" label={u.label} 
                            style={{background: background}} />
                        )
                    }
                </AvatarGroup>
            :   <Skeleton shape="circle" size="50px" />
    )
}