
export class NavigationService {
   static OpenNewTab(url, evt) {
       if (evt)
        evt.stopPropagation()

    window.open(url, '_blank').focus();
   } 
}