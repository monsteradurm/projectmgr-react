import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import { ErrorLoading } from "../General/ErrorLoading";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { TeamsTable } from "./TeamsTable.component";
import { UsersTable } from "./UsersTable.component";
import "./Users.component.scss";

export const UsersComponent = ({headerHeight}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [View, setView] = useState(null);
    SetNavigationHandler(useNavigate());

    useEffect(() => {
        const view = searchParams.get('View');
        if (View !== view)
            setView(view);
    }, [searchParams]);

    useLayoutEffect(() => {
        const titles = ['Users'];
        if (View && View != 'Users')
            titles.push(View);

        SetTitles(titles);
    }, [View])

    return (<ScrollingPage key="page_scroll" offsetY={headerHeight}>
        <div id="Users_Items" style={{height: '100%'}}>
        {
            {   'Users' : <UsersTable key="Users_Table" headerHeight={headerHeight}/>,
                'Teams' : <TeamsTable key="Teams_Table" headerHeight={headerHeight} />,

            }[View] || 

            (<div style={{width: '100%'}}>
                <ErrorLoading text={`View as "${View}" In Development`} />
            </div>)
        } 
        </div>
    </ScrollingPage>)
}