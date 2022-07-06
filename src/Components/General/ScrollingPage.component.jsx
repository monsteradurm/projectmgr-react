import { useEffect, useState } from "react"
import { ScrollPanel } from 'primereact/scrollpanel';

export const ScrollingPage = ({offsets, children}) => {
    const [offsetHeight, setOffsetHeight] = useState(0);

    useEffect(() => {
        let height = 0;
        offsets.forEach(o => {
            if (o.current)
                height += o.current.clientHeight;
        });
        setOffsetHeight(height);
    }, [offsets]);

    return (
        <ScrollPanel className="pm" style={{width: '100vw', height: 
            `calc(100vh - ${offsetHeight}px)`, padding:'2rem'}}>
            { children }
        </ScrollPanel>
    );
}