import { bind, SUSPENSE } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { switchMap, tap, map, take } from "rxjs/operators";
import { merge, EMPTY } from "rxjs";

// --- Toast Messages ---
const _toastStandardMap = (detail) => ({ detail });
const _toastInfoMap = (detail, title) => ({ detail, title });
const [ToastError$, SendToastError] = createSignal(_toastStandardMap);
const [ToastInfo$, SendToastInfo] = createSignal(_toastInfoMap);
const [ToastWarning$, SendToastWarning] = createSignal(_toastStandardMap);
const [ToastSuccess$, SendToastSuccess] = createSignal(_toastStandardMap);

const [useToaster, ToastEvent$] = bind(
    toastRef =>
    merge(
        ToastError$.pipe(
            map(t => ({...t, severity: 'error', summary: 'Error!'}))
        ), 
        ToastInfo$.pipe(
            map(t => ({...t, severity: 'info', summary: 'Info!'}))
        ),
        ToastWarning$.pipe(
            map(t => ({...t, severity: 'warning', summary: t.title}))
        ),
        ToastSuccess$.pipe(
            map(t => ({...t, severity: 'success', summary: 'Success!'}))
        ))
    .pipe(
            tap(evt => {
                console.log(evt, toastRef)
                if (!toastRef?.current) {
                    console.log("No Toast reference to submit message");
                    return EMPTY;
                }

                toastRef.current.show(evt);
            })
    ), SUSPENSE
)

export {
    SendToastError,
    SendToastSuccess,
    SendToastInfo,
    SendToastWarning,
    useToaster
}