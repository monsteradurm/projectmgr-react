import { useEffect, useState } from "react"
import { of, take, delay } from "rxjs";

export const DelayBy = ({ms, children}) => {
    const [display, setDisplay] = useState(false);

    useEffect(() => {
       if (!ms) return;

       of(null).pipe(
           delay(ms),
           take(1)
       ).subscribe(() => setDisplay(true));
    }, [ms])

    return (
    <>
        <div style={{opacity: display ? 1 : 0}}>{children}</div>
    </>);
}