
import { OAuthScopes } from './Environment/Graph';
import './App.scss';
import { UserService } from './Services/User';
import { useMsal } from "@azure/msal-react";
import { useIsAuthenticated } from "@azure/msal-react";
import { useEffect, useRef, useState } from 'react';
import { NavigationComponent } from './Components/Navigation/NavigationComponent';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProjectOverview } from './Components/Project/Overview';
import { NavigationService } from './Services/Navigation';

function App() {
  const { instance, accounts, inProgress } = useMsal();
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('gray');
  const appHeaderRef = useRef();
  
  const appHeader = useRef();
  const authRequest = {
    ...OAuthScopes,
    account: accounts[0]
  };

  const account = authRequest.account;

  useEffect(() => {
    instance.acquireTokenSilent(authRequest).then((response) => {
        setAccessToken(response.accessToken);
    }).catch((e) => {
        instance.acquireTokenRedirect(authRequest).then((response) => {
            setAccessToken(response.accessToken);
        }).catch((x) => { })
    });

  }, [inProgress])

  
  useEffect(() => {
    if (!account || !accessToken)
      return;

    UserService.SetAuthToken(accessToken);
    UserService.SetAuthAccount(account);

  }, [account, accessToken, inProgress])

  useEffect(() => {
    let subs = [];
    
    subs.push(NavigationService.Primary$.subscribe((u) => {
      setPrimaryColor(u);
    }));

    subs.push(UserService.User$.subscribe((u) => {
      setUser(u);
    }));

    return () => { subs.forEach(s => s.unsubscribe()) }
  }, [])

  return (
      <div className="App">
        <header className="App-header" ref={appHeaderRef}>
          <NavigationComponent user={user} primaryColor={primaryColor}/>
        </header>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<div>Placeholder...</div>} />
            <Route path="Projects" element={<ProjectOverview headerRef={appHeaderRef} />} />
          </Routes>
        </BrowserRouter>
      </div>
  )
}

export default App;