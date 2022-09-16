import { Button } from "primereact/button";
import { useEffect } from "react";
import { createKeyedSignal } from "@react-rxjs/utils";
import { bind, SUSPENSE } from "@react-rxjs/core";
import { EMPTY, of, tap } from "rxjs";

const _childMap = (id) => id;
const [useHandlerById, SetHandler] = createKeyedSignal(_childMap,
    x => x.id,
);
const [useHandlerValue, HandlerValue$] = bind(
    id =>
    useHandlerById(id), EMPTY
)

export const HomeComponent = ({}) => {
    return null; //[0, 1, 2].map(id => <ChildComponent key={id} id={id} />)
}


export const ChildComponent = ({id}) => {
    const [ClickEvent, TotalClicks] = [useHandlerById(id), useHandlerValue(id)];
    const onClick = (id, total) => SetHandler(id, total + 1);

    useEffect(() => {
        SetHandler({id, total: 0});
    }, [])

    return (
        <div style={{margin:40}}>
            <Button style={{color: 'white'}}>
                {`Component: ${id}`}
            </Button>
            <div></div>
        </div>
    )
}