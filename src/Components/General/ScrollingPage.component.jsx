import { useEffect, useState } from "react"
import { ScrollPanel } from 'primereact/scrollpanel';

export const ScrollingPage = ({offsetY, children}) => {
    return (
        <ScrollPanel className="pm" style={{width: '100vw', height: 
            `calc(100vh - ${offsetY}px)`, padding:'0.5rem 2rem'}}>
            { children }
        </ScrollPanel>
    );
}