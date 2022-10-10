import { useEffect, useState } from "react"
import { ScrollPanel } from 'primereact/scrollpanel';

export const ScrollingPage = ({offsetY, scrollEvent, children}) => {
    return (
        <ScrollPanel className="pm" onScroll={scrollEvent}
            style={{width: '100vw', height: 
            `calc(100vh - ${offsetY}px)`, padding:'0.5rem 2rem', textAlign: 'left'}}>
            { children }
        </ScrollPanel>
    );
}