import { useState, useEffect } from "react";
import { SUSPENSE } from "@react-rxjs/core";
import { Loading } from "../General/Loading";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import * as _ from 'underscore';
import { Stack } from "react-bootstrap";
import { take } from "rxjs";
import { FirebaseService } from "../../Services/Firebase.service";


export const TestingComponent = ({}) => {

    useEffect(() => {
        FirebaseService.GetProjectHours$().pipe(
            take(1)
        ).subscribe(res => console.log("TESTING RESULT: ", res))
    }, [])

    useEffect(() => {
        SetTitles(['System', 'Testing']);
    }, [])

    return <div style={{padding:30}}>Testing Stuff...</div>
}