import { SUSPENSE } from "@react-rxjs/core";
import { VirtualScroller } from "primereact/virtualscroller";
import { Stack } from "react-bootstrap";
import { useProjectsByStatus, useStatusItemGroups } from "./Home.context";
import { HomeStatusItem } from "./Home.StatusItem";
import * as _ from 'underscore';
import { useEffect, useRef, useState } from "react";


export const HomeStatus = ({Status}) => {
    const groups = useStatusItemGroups()
    const [items, setItems] = useState([])
    const [range, setRange] = useState([0, 2]);

    const itemTemplate = (item) => {
        return <Stack direction="horizontal" style={{width: '100%', justifyContent: 'center', padding: 20}}>
                <HomeStatusItem key={item.group_title + "_" + item.id} statusItem={item} maxIndex={range[1]}/>
            </Stack>
    }

    useEffect(() => {
        if (groups && groups.length > 0)
            setItems(
                    _.flatten(
                        groups.map(
                            ([group_title, group_items]) => group_items.map(i => ({group_title, ...i}))
                        )
                    ).map((i, index) => ({...i, index}))
            )
    }, [groups])

    useEffect(() => {
        console.log("StatusItem Range: ", range)
    }, [range])

    if (groups === SUSPENSE || items.length < 1)
        return <div>SUSPENDED</div>;

    const onScroll = (evt) => { 
        const index = Math.ceil((evt.target.scrollTop + evt.target.clientHeight) / 300);
        if (range[1] < index)
            setRange([0, index]);
    }

    

    return (
        <VirtualScroller items={items} onScroll={onScroll}
            itemTemplate={itemTemplate} itemSize={30} style={{width: '100%', height: '100%', padding:30}}/>
    )
}
 