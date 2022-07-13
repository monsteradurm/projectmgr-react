
import { OAuthScopes } from './Environment/Graph.environment';
import './Application.component.scss';
import { useMsal } from "@azure/msal-react";
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { NavigationComponent } from './Components/Navigation/Navigation.component';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Overview } from './Components/Project/Overview.component';
import { ApplicationObservables, DispatchApplicationState, ApplicationState } from './Components/Context/Application.context';
import { Toast } from 'primereact/toast';
import { MondayService } from './Services/Monday.service';
import { ToastService } from './Services/Toast.service';
import { Tooltip } from 'primereact/tooltip';
import { SyncsketchService } from './Services/Syncsketch.service';
import { AtomSpinner, BreedingRhombusSpinner, SemipolarSpinner } from 'react-epic-spinners';
import { Stack } from 'react-bootstrap';
import { UserService } from './Services/User.service';
import { switchMap, take } from 'rxjs';

export const ApplicationContext = React.createContext(ApplicationState);

function App() {
  const [fetching, setFetching] = useState(true);
  const [state, dispatch] = useReducer(DispatchApplicationState, ApplicationState)
  const { instance, accounts, inProgress } = useMsal();
  const [accessToken, setAccessToken] = useState(null);
  const appHeaderRef = useRef();
  const toastRef = useRef();

  const authRequest = useMemo(() => ({
    ...OAuthScopes,
    account: accounts[0]
  }), [accounts]);

  const account = authRequest.account;

  useEffect(() => {
    instance.acquireTokenSilent(authRequest).then((response) => {
        setAccessToken(response.accessToken);
    }).catch((e) => {
        instance.acquireTokenRedirect(authRequest).then((response) => {
            setAccessToken(response.accessToken);
        }).catch((x) => { })
    });

  }, [instance, authRequest])

  useEffect(() => {
    ToastService.SetToaster(toastRef.current);
  }, [toastRef.current])

  useEffect(() => {
    if (!account || !accessToken)
      return;

    ApplicationObservables.SetAuthToken(accessToken);
    ApplicationObservables.SetAuthAccount(account);

  }, [account, accessToken, inProgress])

  useEffect(() => {
    if (state.User && fetching)
      setFetching(false);

    UserService.UserPhoto$(account.username)
      .subscribe((result) => {
        dispatch({type: 'Photo', value: result})
      })

    if (state.User)
      ApplicationObservables.AllUsers$.pipe(take(1))
        .subscribe((result) => dispatch({type: 'AllUsers', value: result}))

  }, [state.User, account, accessToken])

  useEffect(() => {
    let subs = [];
    
    subs.push(ApplicationObservables.PrimaryColor$.subscribe((u) => {
      dispatch({type: 'PrimaryColor', value: u})
    }));

    subs.push(ApplicationObservables.User$.subscribe((u) => {
      dispatch({type: 'User', value: u})
    }));

    subs.push(ApplicationObservables.Titles$.subscribe((t) => {
      dispatch({type: 'Titles', value: t})
    }));

    return () => { subs.forEach(s => s.unsubscribe()) }
  }, [])


  return (
      <div className="App">
        <ApplicationContext.Provider value={state}>
          {
            fetching ? 
              <Stack direction="vertical" className="mx-auto my-auto" 
              style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                  Logging in user...
                </div>
              </Stack>:
              state.User ? 
            <>
              <header className="App-header" ref={appHeaderRef}>
                <NavigationComponent />
              </header>
              <Toast ref={toastRef} position="bottom-right"/>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<div>Placeholder...</div>} />
                  <Route path="Projects" element={<Overview 
                    headerHeight={appHeaderRef.current ? appHeaderRef.current.clientHeight : 0} />} />
                </Routes>
              </BrowserRouter>
            </> : null
          }
        </ApplicationContext.Provider>
      </div>
  )
}

export default App;