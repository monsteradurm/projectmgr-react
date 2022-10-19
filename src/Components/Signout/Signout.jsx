import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SetCurrentRoute, SetNavigationHandler } from "../../Application.context";
import { Loading } from "../General/Loading";
import { timer } from "rxjs";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { App_TID } from "../../Application.component";

export const SignOutComponent = ({}) => {
    const isAuthenticated = useIsAuthenticated();
    const { instance } = useMsal();
    SetNavigationHandler(useNavigate());
    const [expired, setExpired] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            sessionStorage.removeItem(App_TID)
            instance.logout()
        }
        else    
            window.open('/Home', "_self")

        timer(0, 3000).pipe(
            take(1)
        ).subscribe(() => setExpired(true));
    }, [])

    if (expired)
        window.open('/Home', "_self")

    return <Loading text="Logging out of your account..." />
}