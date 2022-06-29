
import { OAuthScopes } from './Environment/Graph';
import './App.scss';
import { UserService } from './Services/User';
import { useMsal } from "@azure/msal-react";
import { useIsAuthenticated } from "@azure/msal-react";
import { useEffect, useState } from 'react';
import { NavigationComponent } from './Components/Navigation/NavigationComponent';

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [titles, setTitles] = useState([]);

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
    let sub = UserService.User$.subscribe((u) => {
      setUser(u);
      console.log("User", u);
    });

    return () => { sub.unsubscribe(); }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <NavigationComponent user={user} titles={titles}/>
      </header>
    </div>
  )
}

export default App;