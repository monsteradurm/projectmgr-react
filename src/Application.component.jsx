
import { useAppMessageQueue, SetAuthentication, useLoggedInUser, UpdateLocation, useCurrentRoute, SetCurrentRoute, useTitles, useNavigationHandler, useFavIcon } from './Application.context';
import { OAuthScopes } from '@Environment/Graph.environment';
import './Application.component.scss';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import React, { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { NavigationComponent } from '@Components/Navigation/Navigation.component';
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { AtomSpinner, BreedingRhombusSpinner, SemipolarSpinner } from 'react-epic-spinners';
import { Stack } from 'react-bootstrap';
import { Project } from './Components/Project/Project.component';
import { RefreshTags, RefreshBadges } from "./Components/Project/Context/Project.Objects.context";
import { SimulateUser, useAllUsers, useSimulatedUser } from './App.Users.context';
import { HomeComponent } from './Components/Home/Home.component';
import { useToaster } from './App.Toasts.context';
import { AddQueueMessage, CreateMessageQueue, RemoveQueueMessage, useBusyMessage } from './App.MessageQueue.context';
import moment from 'moment';
import { SUSPENSE } from '@react-rxjs/core';
import { SupportComponent } from './Components/Support/Support.component';
import { NewTicketDialog } from './Components/Support/NewTicket.component';
import { UsersComponent } from './Components/Users/Users.component';
import { ApplicationsComponent } from './Components/Applications/Applications.component';
import { GalleryComponent } from './Components/Gallery/Gallery.component';
import { SignOutComponent } from './Components/Signout/Signout';
import { AllocationsComponent } from './Components/Allocations/Allocations';
import { GalleryUpdateComponent } from './System/GalleryUpdate';
import { TimesheetComponent } from './Components/Timesheet/Timesheet.component';
import { TimesheetSubmissions } from './Components/Timesheet/Timesheet.Submissions';
import { Helmet } from 'react-helmet';
import { useReportTeam } from './Components/Timesheet/Timesheet.context';
import { TestingComponent } from './Components/Testing/Testing';

const preventMouseProps = (evt) => {
  evt.stopPropagation();
  evt.preventDefault();
} 

export const App_TID = 'PM_ACCESS_TOKEN'
const RefreshLogin = (instance, authRequest, setAccessToken) => {
  instance.acquireTokenSilent(authRequest).then((response) => {
    sessionStorage.setItem(App_TID, JSON.stringify(response));
    setAccessToken(response.accessToken);
}).catch((e) => {
    instance.acquireTokenRedirect(authRequest).then((response) => {
        sessionStorage.setItem(App_TID, JSON.stringify(response));
        setAccessToken(response.accessToken);
    }).catch((x) => { })
});
}
export const APP_QID = '/Application'

function App() {
  const CurrentRoute = useCurrentRoute();
  const Titles = useTitles();
  const BusyMessage = useBusyMessage(APP_QID)
  const User = useLoggedInUser();
  const SimulatedUser = useSimulatedUser();
  const AllUsers = useAllUsers() // pre-fetch observable for sharing;
  const ReportingTeam = useReportTeam() // pre-fetch;
  
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const [accessToken, setAccessToken] = useState(null);
  const appHeaderRef = useRef();
  const toastRef = useRef();
  const Toaster = useToaster(toastRef);
  const [URL, NavigationHandler] = useNavigationHandler()

  const FavIcon = useFavIcon();

  const authRequest = useMemo(() => ({
    ...OAuthScopes,
    account: accounts[0]
  }), [accounts]);

  const account = authRequest.account;

  useEffect(() => {
    if (CurrentRoute === null)
      SetCurrentRoute(window.location.pathname)
  })

  useEffect(() => {
    if ([URL, NavigationHandler].indexOf(SUSPENSE) >= 0)
      return;

    if (URL.indexOf(window.location.pathname) < 0)
      window.location = URL;
    
    else NavigationHandler(URL);
  }, [URL, NavigationHandler])

  useEffect(() => {
    if (account) {
      const stored = sessionStorage.getItem(App_TID);
      if (stored) {
        try {
          const response = JSON.parse(stored);
          const expired = moment(response.expiresOn).isBefore();

          if (!expired && accessToken !== response.accessToken) {
            console.log("Using Cached access token...");
            setAccessToken(response.accessToken)
            return;
          }

          else if (!expired)
            return;
          
          console.log("Cached Token has expired, Refreshing...");
        }
        catch { }
      }
    }
    RefreshLogin(instance, authRequest, setAccessToken);
  }, [instance, authRequest, isAuthenticated])

  useEffect(() => {
    if (!account || !accessToken)
      return;
      
      SetAuthentication(accessToken, account);
  }, [account, accessToken, inProgress])

  return (
    <>
      <Helmet>
        <link
          rel="shortcut icon"
          href={"./" + FavIcon}
        />
      </Helmet>
      <div className="App" onContextMenu={preventMouseProps}>
        <BrowserRouter>
        <header className="App-header" ref={appHeaderRef}>
            <NavigationComponent User={User} SimulatedUser={SimulatedUser}
              Initializing={BusyMessage?.key === 'init'}/>
        </header>
          <NewTicketDialog />
          {
            BusyMessage ? 
              <Stack direction="vertical" className="mx-auto my-auto" 
              style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                  {BusyMessage.message}
                </div>
              </Stack>:
              User ? 
            <>
              <Toast ref={toastRef} position="bottom-right"/>
              <Routes>
                <Route path="/" element={<HomeComponent headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/Allocations" element={<AllocationsComponent headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/Applications" element={<ApplicationsComponent headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/Gallery" element={<GalleryComponent headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/Home" element={<HomeComponent headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/Users" element={<UsersComponent  headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/Timesheets" element={<TimesheetComponent headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/Support" element={<SupportComponent headerHeight={appHeaderRef.current?.clientHeight ?? 0}/>} />
                <Route path="/SignOut" element={<SignOutComponent />} />
                <Route path="/Testing" element={<TestingComponent 
                  headerHeight={appHeaderRef.current?.clientHeight ?? 0} />} />
                <Route path="/Projects" element={<Project 
                  headerHeight={appHeaderRef.current?.clientHeight ?? 0} />} />
                <Route path="/GalleryUpdate" element={<GalleryUpdateComponent 
                  headerHeight={appHeaderRef.current?.clientHeight ?? 0} />} />
              </Routes>
            </> : null
          }
          </BrowserRouter>
      </div>
    </>
  )
}

export default App;