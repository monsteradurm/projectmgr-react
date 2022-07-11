
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

export const ApplicationContext = React.createContext(ApplicationState);

function App() {
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