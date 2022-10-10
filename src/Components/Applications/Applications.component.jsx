import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";

export const ApplicationsComponent = ({headerHeight}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [View, setView] = useState(null);
    SetNavigationHandler(useNavigate());
    useEffect(() => {
        const view = searchParams.get('View');
        if (View !== view)
            setView(view);
    }, [searchParams]);

    useLayoutEffect(() => {
        const titles = ['Applications'];
        SetTitles(titles);
    }, [View])

    return <div>Applications In Development...</div>
}