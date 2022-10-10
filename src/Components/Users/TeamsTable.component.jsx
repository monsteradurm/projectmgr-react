import { SUSPENSE } from "@react-rxjs/core";
import { useAllTeams } from "./Users.context"
import {Loading} from "./../General/Loading";
import { Stack } from "react-bootstrap";
import { TeamUsersComponent } from "./TeamUsers.component";

export const TeamsTable = ({headerHeight}) => {
    const AllTeams = useAllTeams();
    if (AllTeams === SUSPENSE)
        return <Loading text="Fetching All Teams..." />;


    return (
        <Stack direction="vertical" gap={3} id="Teams_Table" style={{padding: 30}}>
        {
            AllTeams.map(team => (
                <>
                    <div key={"Team_" + team.name} 
                    style={{fontWeight: 600, fontSize: 24, color: 'gray'}}>{team.name}</div>
                    <TeamUsersComponent team={team} key={"Table_" + team.name}/>
                </>
                )
            )
        }
        </Stack>
    )
}